/// <reference types="https://deno.land/x/deno/cli/types/dts/lib.deno.d.ts" />
import { Resend } from 'resend';
import { serve } from "http/server";

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

serve(async (req: Request) => {
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

    const emailPromises = [];

    // 1. Send email to Admin
    emailPromises.push(resend.emails.send({
      from: 'Tutorrito <notifications@tubeboostai.com>',
      to: 'admin@tubeboostai.com', // Consider making this an environment variable
      subject: `[Admin] New Tutoring Session Booked: ${subject} with ${studentName}`,
      html: `
        <h2 style="color: #3B82F6;">New Tutoring Session Booking (Admin)</h2>
        <p>A new tutoring session has been booked. Details below:</p>
        <h3 style="color: #10B981;">Session Details:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr style="background-color: #F3F4F6;"><th style="padding: 10px; text-align: left; border: 1px solid #E5E7EB;">Item</th><th style="padding: 10px; text-align: left; border: 1px solid #E5E7EB;">Detail</th></tr>
          <tr><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Subject</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${subject}</td></tr>
          <tr style="background-color: #F9FAFB;"><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Date</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${date}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Time</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${time}</td></tr>
          <tr style="background-color: #F9FAFB;"><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Location</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${location}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Price</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${price} QAR</td></tr>
        </table>
        <h3 style="color: #10B981;">Student Information:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr style="background-color: #F3F4F6;"><th style="padding: 10px; text-align: left; border: 1px solid #E5E7EB;">Item</th><th style="padding: 10px; text-align: left; border: 1px solid #E5E7EB;">Detail</th></tr>
          <tr><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Name</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${studentName}</td></tr>
          <tr style="background-color: #F9FAFB;"><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Email</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${studentEmail}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Phone</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${studentPhone || 'N/A'}</td></tr>
        </table>
        <h3 style="color: #10B981;">Tutor Information:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr style="background-color: #F3F4F6;"><th style="padding: 10px; text-align: left; border: 1px solid #E5E7EB;">Item</th><th style="padding: 10px; text-align: left; border: 1px solid #E5E7EB;">Detail</th></tr>
          <tr><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Name</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${tutorName}</td></tr>
          <tr style="background-color: #F9FAFB;"><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Email</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${tutorEmail}</td></tr>
        </table>
        <p style="font-size: 12px; color: #6B7280;">This is an automated notification from Tutorrito.</p>
      `,
    }));

    // 2. Send email to Student
    if (studentEmail) {
      emailPromises.push(resend.emails.send({
        from: 'Tutorrito <notifications@tubeboostai.com>',
        to: studentEmail,
        subject: `Your Tutorrito Session with ${tutorName} is Confirmed!`,
        html: `
          <h2 style="color: #3B82F6;">Session Confirmed!</h2>
          <p>Hi ${studentName},</p>
          <p>Your tutoring session for <strong>${subject}</strong> with <strong>${tutorName}</strong> has been successfully booked. We're excited for you to learn and grow!</p>
          <h3 style="color: #10B981;">Session Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr style="background-color: #F3F4F6;"><th style="padding: 10px; text-align: left; border: 1px solid #E5E7EB;">Item</th><th style="padding: 10px; text-align: left; border: 1px solid #E5E7EB;">Detail</th></tr>
            <tr><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Tutor</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${tutorName}</td></tr>
            <tr style="background-color: #F9FAFB;"><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Subject</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${subject}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Date</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${date}</td></tr>
            <tr style="background-color: #F9FAFB;"><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Time</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${time}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Location</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${location}</td></tr>
            <tr style="background-color: #F9FAFB;"><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Price</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${price} QAR</td></tr>
          </table>
          <p>If you have any questions or need to reschedule, please contact your tutor or visit the platform.</p>
          <p>Happy learning!</p>
          <p style="font-size: 12px; color: #6B7280;">The Tutorrito Team</p>
        `,
      }));
    } else {
      console.warn('Student email not provided for booking notification.');
    }

    // 3. Send email to Tutor
    if (tutorEmail) {
      emailPromises.push(resend.emails.send({
        from: 'Tutorrito <notifications@tubeboostai.com>',
        to: tutorEmail,
        subject: `New Booking: ${subject} with ${studentName}`,
        html: `
          <h2 style="color: #3B82F6;">New Session Booked!</h2>
          <p>Hi ${tutorName},</p>
          <p>You have a new tutoring session booked for <strong>${subject}</strong> with <strong>${studentName}</strong>.</p>
          <h3 style="color: #10B981;">Session Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr style="background-color: #F3F4F6;"><th style="padding: 10px; text-align: left; border: 1px solid #E5E7EB;">Item</th><th style="padding: 10px; text-align: left; border: 1px solid #E5E7EB;">Detail</th></tr>
            <tr><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Student</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${studentName}</td></tr>
            <tr style="background-color: #F9FAFB;"><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Student Email</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${studentEmail}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Student Phone</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${studentPhone || 'N/A'}</td></tr>
            <tr style="background-color: #F9FAFB;"><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Subject</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${subject}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Date</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${date}</td></tr>
            <tr style="background-color: #F9FAFB;"><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Time</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${time}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Location</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${location}</td></tr>
            <tr style="background-color: #F9FAFB;"><td style="padding: 10px; border: 1px solid #E5E7EB;"><strong>Price</strong></td><td style="padding: 10px; border: 1px solid #E5E7EB;">${price} QAR</td></tr>
          </table>
          <p>Please prepare for the session accordingly. You can manage your bookings through the Tutorrito dashboard.</p>
          <p>Best regards,</p>
          <p style="font-size: 12px; color: #6B7280;">The Tutorrito Team</p>
        `,
      }));
    } else {
      console.warn('Tutor email not provided for booking notification.');
    }
    
    const results = await Promise.allSettled(emailPromises);
    
    results.forEach(result => {
      if (result.status === 'rejected') {
        console.error('Failed to send an email:', result.reason);
        // Potentially log this more robustly or alert if critical
      } else if (result.value && result.value.error) {
        // Resend API specific error handling
        console.error('Resend API error:', result.value.error);
      }
    });

    // Check if all emails were attempted (even if some failed)
    // The original logic only checked for admin email. Now we check if any email was processed.
    // A more robust check might be to see if at least student/tutor emails were successful.
    const allSuccessful = results.every(r => r.status === 'fulfilled' && !r.value.error);

    if (!allSuccessful) {
        // Decide if a partial success is still a 200 or if it should be a different status.
        // For now, let's assume if any email fails to send via Resend API (not promise rejection), it's an issue.
        // This part might need refinement based on how critical each email is.
        const firstError = results.find(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error));
        let errorMessage = "Some booking emails could not be sent.";
        if (firstError) {
            if (firstError.status === 'rejected') errorMessage = `Error processing email: ${firstError.reason.message || firstError.reason}`;
            else if (firstError.value.error) errorMessage = `Resend API error: ${JSON.stringify(firstError.value.error)}`;
        }
        // Even if some emails fail, we might still want to return 200 to the client if the booking itself was made.
        // The client call to this function might not need to fail entirely.
        // However, logging the error is crucial.
        console.error("One or more booking emails failed to send.", results);
    }


    return new Response(
      JSON.stringify({ message: 'Booking email process initiated for admin, student, and tutor.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (e) {
    const error = e as Error;
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
