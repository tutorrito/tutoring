import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'shared/cors.ts';

console.log('Create Notification Edge Function starting up...');

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { recipient_id, type, message, metadata } = await req.json();

    if (!recipient_id || !type || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: recipient_id, type, or message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create a Supabase client with the Service Role Key
    // Ensure your Deno environment has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set.
    // These are typically set in the Supabase project settings for functions.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const notificationPayload = {
      user_id: recipient_id, // This is the recipient
      type,
      message,
      metadata,
      is_read: false, // Default to unread
    };

    console.log('Attempting to insert notification:', JSON.stringify(notificationPayload));

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notificationPayload)
      .select()
      .single();

    if (error) {
      console.error('Error inserting notification:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('Notification inserted successfully:', JSON.stringify(data));

    // ---- START: Send email notification via Resend ----
    const recipientIdForEmail = recipient_id; // from original request
    const senderNameFromMetadata = metadata?.sender_name || 'Someone';
    const conversationIdFromMetadata = metadata?.conversation_id;

    try {
      // 1. Fetch recipient's email
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', recipientIdForEmail)
        .single();

      if (profileError || !profileData) {
        console.error('Error fetching recipient profile for email or profile not found:', profileError?.message);
        // Proceed without sending email, but the in-app notification was successful
        return new Response(JSON.stringify({ 
          success: true, 
          data: data, 
          email_status: 'failed_to_fetch_recipient_profile',
          error_detail: profileError?.message 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201, // Still 201 because in-app notification was created
        });
      }

      const recipientEmail = profileData.email;
      const recipientName = profileData.full_name || 'User';
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      const senderEmail = Deno.env.get('RESEND_SENDER_EMAIL') || 'noreply@example.com'; // Fallback sender

      if (!resendApiKey) {
        console.error('RESEND_API_KEY environment variable is not set.');
        // Proceed without sending email
        return new Response(JSON.stringify({ 
          success: true, 
          data: data, 
          email_status: 'resend_api_key_missing' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        });
      }
      
      if (!recipientEmail) {
        console.warn(`Recipient ${recipientIdForEmail} does not have an email address. Skipping email notification.`);
        return new Response(JSON.stringify({ 
          success: true, 
          data: data, 
          email_status: 'recipient_email_missing' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        });
      }

      const emailSubject = `You have a new message from ${senderNameFromMetadata}`;
      const emailHtmlBody = `
        <h1>New Message Received</h1>
        <p>Hello ${recipientName},</p>
        <p>You've received a new message from <strong>${senderNameFromMetadata}</strong>.</p>
        <p>Message: "${message}"</p> 
        ${conversationIdFromMetadata 
          ? `<p><a href="${Deno.env.get('APP_URL') || 'https://yourapp.com'}/chat/${conversationIdFromMetadata}">Click here to view the conversation</a>.</p>` 
          : '<p>Open the app to view the message.</p>'}
        <p>Thanks,<br/>The App Team</p>
      `;
      // Consider adding a plain text version too for email clients that don't support HTML.

      console.log(`Attempting to send email to ${recipientEmail} via Resend.`);

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          ...corsHeaders, // Include CORS headers if Resend API requires them for direct invocation (usually not for server-to-server)
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: senderEmail,
          to: recipientEmail,
          subject: emailSubject,
          html: emailHtmlBody,
        }),
      });

      if (!resendResponse.ok) {
        const errorBody = await resendResponse.text();
        console.error('Resend API error:', resendResponse.status, errorBody);
        return new Response(JSON.stringify({ 
          success: true, // In-app notification was still successful
          data: data, 
          email_status: 'failed_to_send', 
          email_error_details: { status: resendResponse.status, body: errorBody }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201, // In-app notification created, email failed
        });
      }

      const resendData = await resendResponse.json();
      console.log('Email sent successfully via Resend:', JSON.stringify(resendData));
      return new Response(JSON.stringify({ success: true, data: data, email_status: 'sent', email_response: resendData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });

    } catch (emailError) {
      console.error('Error during email sending process:', emailError);
      // In-app notification was successful, but email process had an error
      return new Response(JSON.stringify({ 
        success: true, 
        data: data, 
        email_status: 'internal_error_during_send',
        error_detail: emailError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201, 
      });
    }
    // ---- END: Send email notification via Resend ----

  } catch (e) {
    console.error('Unhandled error in create-notification function:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
