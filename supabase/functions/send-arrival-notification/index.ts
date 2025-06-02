/// <reference types="https://deno.land/x/deno/cli/types/dts/index.d.ts" />
import { serve } from 'jsr:@std/http@0.224.0/server';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { studentId, tutorFullName, message, estimatedTime } = await req.json();

    if (!studentId || !tutorFullName || !message) {
      throw new Error('Missing required fields: studentId, tutorFullName, and message are required.');
    }

    // Get student details
    const { data: student, error: studentError } = await supabaseClient
      .from('profiles') // Assuming student details are in 'profiles' table
      .select('id, email, full_name')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found.`);
    }

    // Send email notification
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, // Ensure RESEND_API_KEY is set in Supabase Edge Function env vars
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Tutorrito <notifications@tutorrito.com>',
        to: student.email,
        subject: `Tutor Arrival Update from ${tutorFullName}`,
        html: `
          <html>
            <body>
              <h2>Tutor Arrival Update</h2>
              <p>Hello ${student.full_name || 'Student'},</p>
              <p>Your tutor, ${tutorFullName}, has sent an update regarding your session:</p>
              <p><strong>Message:</strong> ${message}</p>
              ${estimatedTime ? `<p><strong>Estimated Arrival Time:</strong> ${estimatedTime}</p>` : ''}
              <p>Please prepare accordingly.</p>
              <p>Best regards,<br>The Tutorrito Team</p>
            </body>
          </html>
        `,
      }),
    });
    
    const emailResponseData = await emailResponse.json();
    if (!emailResponse.ok) {
      console.error('Resend API Error:', emailResponseData);
      throw new Error(`Failed to send email notification. Status: ${emailResponse.status}. Response: ${JSON.stringify(emailResponseData)}`);
    }

    // Store notification in database
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: student.id, // studentId from request
        type: 'arrival_update', // Consistent type
        message: message, // The message content
        metadata: { 
          estimated_time: estimatedTime,
          tutor_name: tutorFullName 
        }, // Include tutor name for context
      });

    if (notificationError) throw notificationError;

    return new Response(
      JSON.stringify({ message: 'Notification sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) { // Using 'any' for now, can be refined if specific error types are known
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'An unexpected error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
