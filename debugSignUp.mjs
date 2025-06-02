import { supabase } from './lib/supabase.js';

async function testSignUp() {
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';

  console.log('Starting sign-up test...');
  console.log('Test credentials:', { testEmail, testPassword, testName });

  try {
    console.log('Attempting sign-up...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName
        }
      }
    });

    if (error) {
      console.error('Sign-up failed with error:', {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error
      });
      return;
    }

    console.log('Sign-up response:', {
      user: data.user,
      session: data.session,
      requiresVerification: !data.session
    });

    if (data.user) {
      console.log('Checking profiles table...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile check failed:', profileError);
      } else {
        console.log('Profile created successfully:', profile);
      }
    }
  } catch (err) {
    console.error('Unexpected error during sign-up:', err);
  }
}

testSignUp()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err));
