import { Resend } from 'npm:resend@3.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const { 
      studentName, studentEmail, studentPhone,
      tutorName, tutorEmail,
      subject, date, time, location, price
    }: BookingEmailData = await req.json();

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

    // Send email to tutor
    await resend.emails.send({
      from: 'Tutorrito <notifications@tubeboostai.com>',
      to: tutorEmail,
      subject: 'New Session Booking',
      html: `
        <h2>New Session Booking</h2>
        <p>Hello ${tutorName},</p>
        <p>You have a new tutoring session booked:</p>
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
        <p>Please ensure you arrive at the location on time.</p>
        <p>If you need to make any changes, please contact us immediately.</p>
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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});