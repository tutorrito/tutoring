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

// Create Supabase client with optimized settings
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
  global: {
    headers: {
      'Accept': 'application/json'
      // 'Content-Type': 'application/json' // Removed to allow service-specific Content-Types
    },
    // Configure fetch with retry behavior
    fetch: (input, init) => {
      const retry = async (attempt = 1): Promise<Response> => {
        try {
          const response = await fetch(input, init);
          if (!response.ok && attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return retry(attempt + 1);
          }
          return response;
        } catch (error) {
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return retry(attempt + 1);
          }
          throw error;
        }
      };
      return retry();
    }
  },
  db: {
    schema: 'public'
  }
});

export { supabase };
