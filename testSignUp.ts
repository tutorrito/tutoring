import { supabase } from './lib/supabase';
import * as fs from 'fs';
import type { AuthError, PostgrestError } from '@supabase/supabase-js';

const logStream = fs.createWriteStream('signup-test.log', { flags: 'w' });
const log = (...args: any[]) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
  logStream.write(message + '\n');
  console.log(...args);
};

async function testSignUp() {
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  const testName = 'Test User';

  log('Starting sign up test at', new Date().toISOString());
  log('Attempting sign up with:', { testEmail, testName });

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
        },
      },
    });

    if (error) {
    log('Sign up error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
      return;
    }

    log('Sign up successful! Verification required:', !data.session);
    log('User:', data.user?.email);
    
    if (data.user) {
      // Check profile creation
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        log('Profile fetch error:', {
          message: profileError.message,
          code: profileError.code,
          hint: profileError.hint
        });
      } else {
        log('Profile created successfully:', {
          id: profile.id,
          full_name: profile.full_name,
          updated_at: profile.updated_at
        });
      }
    }
  } catch (err) {
    log('Unexpected error:', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    });
  }
}

testSignUp().finally(() => {
  log('Test completed at', new Date().toISOString());
});
