import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { tutorId, message, estimatedTime } = await req.json();

    // Get tutor's upcoming sessions
    const { data: sessions, error: sessionsError } = await supabaseClient
      .from('sessions')
      .select(`
        id,
        student:student_id(
          id,
          email,
          full_name
        )
      `)
      .eq('tutor_id', tutorId)
      .eq('status', 'confirmed')
      .gte('start_time', new Date().toISOString())
      .order('start_time')
      .limit(1);

    if (sessionsError) throw sessionsError;
    if (!sessions.length) {
      throw new Error('No upcoming sessions found');
    }

    const session = sessions[0];
    const student = session.student;

    // Send email notification
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Tutorrito <notifications@tutorrito.com>',
        to: student.email,
        subject: 'Tutor Arrival Update',
        html: `
          <h2>Tutor Arrival Update</h2>
          <p>Hello ${student.full_name},</p>
          <p>${message}</p>
          ${estimatedTime ? `<p>Estimated arrival time: ${estimatedTime}</p>` : ''}
          <p>Best regards,<br>Tutorrito Team</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send email notification');
    }

    // Store notification in database
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: student.id,
        type: 'arrival_update',
        message,
        metadata: { estimated_time: estimatedTime },
      });

    if (notificationError) throw notificationError;

    return new Response(
      JSON.stringify({ message: 'Notification sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});