import { supabase } from './lib/supabase';

async function testStorageAccess() {
  try {
    console.log('Testing Supabase storage access...');
    
    // 1. List files in avatars bucket
    const { data: listData, error: listError } = await supabase
      .storage
      .from('avatars')
      .list();

    if (listError) {
      console.error('Storage list error:', listError);
      return;
    }

    console.log('Files in avatars bucket:', listData);

    // 2. Check if specific avatar exists
    const avatarId = '76528296-d217-4176-96c5-75c59d1dfab6';
    const { data: urlData } = await supabase
      .storage
      .from('avatars')
      .getPublicUrl(avatarId);

    console.log('Public URL for avatar:', urlData.publicUrl);

    // 3. Try to download the file
    try {
      const response = await fetch(urlData.publicUrl);
      if (!response.ok) {
        console.error(`Failed to fetch avatar (HTTP ${response.status})`);
      } else {
        console.log('Successfully fetched avatar');
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
    }

  } catch (err) {
    console.error('Storage test failed:', err);
  }
}

testStorageAccess();
