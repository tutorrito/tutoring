import { supabase } from './build/lib/supabase.js';

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
      return;
    }

    console.log('Success! Retrieved profiles:', data);
  } catch (err) {
    console.error('Connection test failed:', err);
  }
}

testConnection();
