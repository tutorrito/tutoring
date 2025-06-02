import { supabase } from './supabase';

interface NewUserNotificationParams {
  email: string;
  name: string;
  adminEmail?: string;
}

export async function sendNewUserNotification({ email, name, adminEmail }: NewUserNotificationParams) {
  if (!adminEmail) {
    console.warn('No admin email configured - skipping new user notification');
    return;
  }

  try {
    const { error } = await supabase.functions.invoke('send-booking-emails', {
      body: {
        type: 'new_user_notification',
        to: adminEmail,
        subject: 'New User Signup',
        content: {
          name,
          email,
          timestamp: new Date().toLocaleString()
        }
      }
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to send new user notification:', error);
  }
}
