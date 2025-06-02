import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const avatars = [
  {
    id: 1,
    name: 'Girl with Glasses',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/user.svg'
  },
  {
    id: 2,
    name: 'Boy in Green',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/user-2.svg'
  },
  {
    id: 3,
    name: 'Girl in Yellow',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/user-3.svg'
  },
  {
    id: 4,
    name: 'Boy in Blue',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/user-4.svg'
  },
  {
    id: 5,
    name: 'Fox',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/fox.svg'
  },
  {
    id: 6,
    name: 'Cat',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/cat.svg'
  },
  {
    id: 7,
    name: 'Panda',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/panda.svg'
  },
  {
    id: 8,
    name: 'Dog',
    url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/dog.svg'
  }
];

export default function AvatarSelectionScreen() {
  const { updateProfile } = useAuth();

  const handleAvatarSelect = async (avatar: typeof avatars[0]) => {
    try {
      console.log('Starting avatar upload for:', avatar.url);
      
      // 1. Download the avatar image with error handling
      const response = await fetch(avatar.url);
      if (!response.ok) {
        throw new Error(`Failed to download avatar: ${response.status} ${response.statusText}`);
      }

      // Create blob with explicit type
      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Invalid blob created from avatar image');
      }
      console.log('Blob created successfully, size:', blob.size);
      
      // 2. Generate unique filename
      const fileName = `avatars/${Date.now()}_${avatar.id}.jpg`;
      
      // 3. Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) throw error;

      // 4. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 5. Update user profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl });
      
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      let errorMessage = 'Failed to upload avatar. Please try again.';
      
      if (error.message.includes('storage')) {
        errorMessage = 'Storage service error. Please check your connection.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Failed to download avatar image. Check your internet connection.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Please sign in again.';
      }
      
      Alert.alert('Avatar Upload Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Avatar</Text>
        <Text style={styles.subtitle}>Select an avatar to personalize your profile</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.avatarGrid}
        showsVerticalScrollIndicator={false}
      >
        {avatars.map((avatar) => (
          <TouchableOpacity
            key={avatar.id}
            style={styles.avatarCard}
            onPress={() => handleAvatarSelect(avatar)}
          >
            <Image
              source={{ uri: avatar.url }}
              style={styles.avatarImage}
            />
            <Text style={styles.avatarName}>{avatar.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  avatarGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarCard: {
    width: '48%',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  avatarName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4B5563',
  },
});
