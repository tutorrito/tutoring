import { Resend } from 'npm:resend@3.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface BookingEmailData {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  tutorName: string;
  tutorEmail: string;
  subject: string;
  date: string;
  time: string;
  location: string;
  price: number;
}

interface NewUserNotificationData {
  type: 'new_user_notification';
  to: string;
  subject: string;
  content: {
    name: string;
    email: string;
    timestamp: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const requestData = await req.json();

    if (requestData.type === 'new_user_notification') {
      const { to, subject, content } = requestData as NewUserNotificationData;
      
      console.log('Preparing to send new user notification to admin:', to);
      console.log('New user details:', content);

      const { data, error } = await resend.emails.send({
        from: 'Tutorrito <notifications@tubeboostai.com>',
        to,
        subject: `[Tutorrito] ${subject}`,
        html: `
          <h1 style="color: #3B82F6;">New User Signup Notification</h1>
          <p style="font-size: 16px;">A new user has registered on Tutorrito:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #F3F4F6;">
              <th style="padding: 12px; text-align: left; border: 1px solid #E5E7EB;">Field</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #E5E7EB;">Value</th>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #E5E7EB;"><strong>Name</strong></td>
              <td style="padding: 12px; border: 1px solid #E5E7EB;">${content.name}</td>
            </tr>
            <tr style="background-color: #F9FAFB;">
              <td style="padding: 12px; border: 1px solid #E5E7EB;"><strong>Email</strong></td>
              <td style="padding: 12px; border: 1px solid #E5E7EB;">${content.email}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #E5E7EB;"><strong>Signup Time</strong></td>
              <td style="padding: 12px; border: 1px solid #E5E7EB;">${content.timestamp}</td>
            </tr>
          </table>
          <p style="font-size: 14px; color: #6B7280;">
            This is an automated notification. Please do not reply to this email.
          </p>
        `,
      });

      if (error) {
        throw new Error(JSON.stringify(error));
      }

      return new Response(
        JSON.stringify({ message: 'New user notification sent successfully', data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    }

    // Rest of existing booking email logic
    const { 
      studentName, studentEmail, studentPhone,
      tutorName, tutorEmail,
      subject, date, time, location, price
    }: BookingEmailData = requestData;

    // Send email to admin
    await resend.emails.send({
      from: 'Tutorrito <notifications@tubeboostai.com>',
      to: 'admin@tubeboostai.com',
      subject: 'New Tutoring Session Booked',
      html: `
        <h2>New Tutoring Session Booking</h2>
        <p>A new tutoring session has been booked:</p>
        <h3>Session Details:</h3>
        <ul>
          <li><strong>Subject:</strong> ${subject}</li>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Time:</strong> ${time}</li>
          <li><strong>Location:</strong> ${location}</li>
          <li><strong>Price:</strong> ${price} QAR</li>
        </ul>
        <h3>Student Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${studentName}</li>
          <li><strong>Email:</strong> ${studentEmail}</li>
          <li><strong>Phone:</strong> ${studentPhone}</li>
        </ul>
        <h3>Tutor Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${tutorName}</li>
          <li><strong>Email:</strong> ${tutorEmail}</li>
        </ul>
      `,
    });

    return new Response(
      JSON.stringify({ message: 'Booking emails sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Email sending error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
