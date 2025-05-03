import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts'; // Assuming you have a shared CORS setup

// IMPORTANT: Set these secrets in your Supabase project dashboard:
// `RESEND_API_KEY`: Your Resend API key (e.g., re_...)
// `RESEND_FROM_EMAIL`: The verified email address you send from (e.g., noreply@yourdomain.com)

const RESEND_API_URL = 'https://api.resend.com/emails';

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Retrieve secrets
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');

    if (!resendApiKey || !fromEmail) {
      console.error('Missing RESEND_API_KEY or RESEND_FROM_EMAIL environment variables');
      return new Response(JSON.stringify({ error: 'Email service configuration error.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse request body
    let payload: EmailPayload;
    try {
      payload = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid request body. Expected JSON.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { to, subject, html } = payload;

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, html' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Sending email via Edge Function to: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`Subject: ${subject}`);

    // 3. Call Resend API
    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: to,
        subject: subject,
        html: html,
      }),
    });

    const resendData = await resendResponse.json();

    // 4. Handle Resend API response
    if (!resendResponse.ok) {
      console.error('Resend API Error:', resendData);
      throw new Error(resendData.message || 'Failed to send email via Resend API');
    }

    console.log('Email sent successfully via Resend Edge Function:', resendData);

    // 5. Return success response
    return new Response(JSON.stringify({ success: true, message: 'Email sent successfully.', resend_id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-email Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});