import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { Database } from '@/types/supabase';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

// Validate URL format
try {
  console.log('Attempting to validate Supabase URL:', supabaseUrl);
  const url = new URL(supabaseUrl);
  console.log('URL parsed successfully:', {
    protocol: url.protocol,
    hostname: url.hostname,
    pathname: url.pathname
  });
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('URL validation error details:', {
    error: errorMessage,
    url: supabaseUrl,
    typeofUrl: typeof supabaseUrl,
    urlLength: supabaseUrl?.length,
    first10Chars: supabaseUrl?.substring(0, 10),
    last10Chars: supabaseUrl?.substring(supabaseUrl.length - 10)
  });
  throw new Error(
    `Invalid Supabase URL format. Please ensure EXPO_PUBLIC_SUPABASE_URL is a valid URL. Current value: ${supabaseUrl}. Error: ${errorMessage}`
  );
}

// Create Supabase client
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    }
  }
});

// Debug initialization
console.log('Supabase client initialized with URL:', supabaseUrl);
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Current session:', session);
})();

// Debug: Test profiles table access
(async () => {
  try {
    // First check if profiles table exists and is accessible
    const { data: profileCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Profiles table access error:', {
        message: countError.message,
        code: countError.code,
        details: countError.details,
        hint: countError.hint
      });
      return;
    }

    console.log('Profiles table accessible with', profileCount, 'rows');

    // Test actual profile query
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .maybeSingle();
    
    if (error) {
      console.error('Profile query failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('Profile query succeeded:', data);
    }
    
    console.log('Current client configuration:', {
      url: supabaseUrl,
      headers: supabase['headers'],
      auth: supabase['auth']
    });
  } catch (err) {
    console.error('Supabase initialization error:', err);
  }
})();

export { supabase };
