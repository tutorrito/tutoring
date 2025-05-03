// Basic HTML email templates
// Consider using a templating library or service for more complex emails

export const templates = {
  // 1. Admin Notification for New User Sign-up
  adminNewUser: (name: string, email: string, role: string) => `
    <h1>New User Signup on Tutorrito</h1>
    <p>A new user has signed up:</p>
    <ul>
      <li><strong>Name:</strong> ${name}</li>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Role:</strong> ${role}</li>
      <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
    </ul>
    <p>Please review their profile if necessary.</p>
  `,

  // 2. Welcome Email for New User
  welcomeUser: (name: string, role: string) => `
    <h1>Welcome to Tutorrito, ${name}!</h1>
    <p>We're excited to have you join our community as a ${role}.</p>
    ${role === 'student'
      ? '<p>Start exploring tutors and book your first session today!</p>'
      : '<p>Complete your profile and set your availability to start connecting with students.</p>'}
    <p>If you have any questions, feel free to contact our support team.</p>
    <p>Best regards,<br/>The Tutorrito Team</p>
  `,

  // 3. Booking Confirmation for Student
  studentBookingConfirmation: (studentName: string, tutorName: string, subject: string, date: string, time: string, location: string, price: string) => `
    <h1>Booking Confirmed!</h1>
    <p>Hi ${studentName},</p>
    <p>Your tutoring session with <strong>${tutorName}</strong> has been confirmed:</p>
    <ul>
      <li><strong>Subject:</strong> ${subject}</li>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Time:</strong> ${time}</li>
      <li><strong>Location:</strong> ${location}</li>
      <li><strong>Price:</strong> QAR ${price}</li>
    </ul>
    <p>Please be prepared for your session. If you need to reschedule, please contact your tutor or support.</p>
    <p>Best regards,<br/>The Tutorrito Team</p>
  `,

  // 4. Booking Confirmation for Tutor
  tutorBookingConfirmation: (tutorName: string, studentName: string, subject: string, date: string, time: string, location: string) => `
    <h1>New Session Booked!</h1>
    <p>Hi ${tutorName},</p>
    <p>You have a new session booked with <strong>${studentName}</strong>:</p>
    <ul>
      <li><strong>Subject:</strong> ${subject}</li>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Time:</strong> ${time}</li>
      <li><strong>Location:</strong> ${location}</li>
    </ul>
    <p>Please ensure you are prepared for the session. You can manage your sessions in the dashboard.</p>
    <p>Best regards,<br/>The Tutorrito Team</p>
  `,

  // 5. Session Reminder for Student (Template only - Sending handled by backend)
  studentSessionReminder: (studentName: string, tutorName: string, subject: string, date: string, time: string, location: string) => `
    <h1>Session Reminder</h1>
    <p>Hi ${studentName},</p>
    <p>This is a reminder for your upcoming tutoring session with <strong>${tutorName}</strong>:</p>
    <ul>
      <li><strong>Subject:</strong> ${subject}</li>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Time:</strong> ${time}</li>
      <li><strong>Location:</strong> ${location}</li>
    </ul>
    <p>We look forward to seeing you there!</p>
    <p>Best regards,<br/>The Tutorrito Team</p>
  `,

  // 6. Session Reminder for Tutor (Template only - Sending handled by backend)
  tutorSessionReminder: (tutorName: string, studentName: string, subject: string, date: string, time: string, location: string) => `
    <h1>Session Reminder</h1>
    <p>Hi ${tutorName},</p>
    <p>This is a reminder for your upcoming tutoring session with <strong>${studentName}</strong>:</p>
    <ul>
      <li><strong>Subject:</strong> ${subject}</li>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Time:</strong> ${time}</li>
      <li><strong>Location:</strong> ${location}</li>
    </ul>
    <p>Please be prepared for the session.</p>
    <p>Best regards,<br/>The Tutorrito Team</p>
  `,

  // 7. Message Notification (Arrival Update)
  arrivalUpdateNotification: (studentName: string, tutorName: string, message: string, estimatedTime?: string) => `
    <h1>Update from your Tutor</h1>
    <p>Hi ${studentName},</p>
    <p>Your tutor, <strong>${tutorName}</strong>, sent an update regarding your upcoming session:</p>
    <p><em>"${message}"</em></p>
    ${estimatedTime ? `<p><strong>Estimated Arrival:</strong> ${estimatedTime}</p>` : ''}
    <p>Best regards,<br/>The Tutorrito Team</p>
  `,
};

