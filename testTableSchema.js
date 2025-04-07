import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yuyntfqmarmjwolrwqkf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eW50ZnFtYXJtandvbHJ3cWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MTMzNDYsImV4cCI6MjA1OTE4OTM0Nn0.dO6k7XOXA2hQQ_AxZSF5MVTvJamlQyDP619A2PKpLFg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchema() {
  try {
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: 'profiles' });

    if (error) {
      console.error('Error checking table schema:', error);
      return;
    }

    console.log('Current profiles table columns:', data);
  } catch (err) {
    console.error('Failed to check table schema:', err);
  }
}

checkTableSchema();
