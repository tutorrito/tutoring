import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  ImageSourcePropType,
  Modal,
  TextInput 
} from 'react-native';
import IconImage from '@/assets/images/icon.png';
import { Settings, BookOpen, Star, Clock, User as UserIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/types/supabase';

const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    // More lenient check that allows for different Supabase URL formats
    return url.startsWith('https://') && 
           (url.includes('storage') && 
           (url.includes('supabase') || url.includes('storage.googleapis.com')));
  } catch {
    return false;
  }
};

export default function ProfileScreen() {
  const { profile, loading, user, signOut, updateProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [editBio, setEditBio] = useState(profile?.bio || '');

  const handleSaveProfile = async () => {
    console.log('[handleSaveProfile] Attempting to save profile...'); // Added log
    console.log('[handleSaveProfile] Data:', { name: editName, bio: editBio }); // Added log
    try {
      await updateProfile({
        full_name: editName,
        bio: editBio
      });
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      console.log('[handleSaveProfile] Save process finished.'); // Added log
    }
  };

  useEffect(() => {
    const fetchToken = async () => {
      const { data } = await supabase.auth.getSession();
      setAccessToken(data?.session?.access_token || '');
    };
    fetchToken();
  }, []);

  const handleFavoriteTutors = () => {
    router.push('/favorite-tutors');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please sign in to view your profile</Text>
        <TouchableOpacity 
          style={styles.signInButton}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Profile not found</Text>
      </View>
    );
  }

  const handleChooseAndUploadPhoto = async () => {
    if (!user?.id) return;
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setUploading(true);
        const imageUri = result.assets[0].uri;
        // Use user ID as filename in avatars folder
        const filePath = `avatars/${user.id}`; 

        // Fetch the image blob
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // Upload directly using client with JWT
        const { error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(filePath, blob, {
            upsert: true,
            contentType: blob.type,
            cacheControl: '3600'
          });

        if (uploadError) {
          const errorDetails = {
            message: uploadError.message,
            name: (uploadError as any).name,
            statusCode: (uploadError as any).statusCode,
            error: (uploadError as any).error,
            filePath: filePath,
            blobType: blob.type,
            blobSize: blob.size,
            timestamp: new Date().toISOString()
          };
          console.error('Detailed upload error:', errorDetails);
          throw uploadError;
        }

        // Get the public URL for the uploaded file with retry logic
        let publicUrl = '';
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries && !publicUrl) {
          try {
            const { data: { publicUrl: retrievedUrl } } = await supabase
              .storage
              .from('avatars')
              .getPublicUrl(filePath);
            
            if (retrievedUrl) {
              publicUrl = retrievedUrl;
              console.log('Retrieved Public URL:', publicUrl);
              break;
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
            retries++;
          } catch (error) {
            console.error(`Error getting public URL (attempt ${retries + 1}):`, error);
            retries++;
            if (retries >= maxRetries) throw error;
          }
        }

        if (!publicUrl) {
          throw new Error('Failed to get public URL after multiple attempts');
        }

        // Validate the URL before storing
            if (!isValidUrl(publicUrl)) {
              console.error('Invalid public URL format:', publicUrl);
              throw new Error('Failed to generate valid image URL');
            }

        // Update profile with the validated public URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) {
          console.error('Update error with validated URL:', updateError.message);
          throw updateError;
        }
        
        // Refresh profile data with the validated public URL
        updateProfile({ avatar_url: publicUrl } as Partial<Database['public']['Tables']['profiles']['Update']>);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity onPress={handleSettings}>
            <Settings size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileInfo}>
          <TouchableOpacity 
            onPress={handleChooseAndUploadPhoto}
            disabled={uploading}
          >
            {profile?.avatar_url && isValidUrl(profile.avatar_url) ? (
              <Image
                source={{ 
                  uri: profile.avatar_url,
                  cache: 'force-cache'
                }}
                style={styles.avatar}
                onError={(e: any) => {
                  console.error('Image load failed:', {
                    error: e.nativeEvent.error,
                    urlAttempted: profile.avatar_url,
                    userId: user?.id,
                    timestamp: new Date().toISOString()
                  });
                }}
                defaultSource={IconImage as unknown as { uri: string }}
                loadingIndicatorSource={IconImage as unknown as { uri: string }}
                onLoad={() => console.log('Avatar loaded successfully')}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserIcon size={32} color="#6B7280" />
              </View>
            )}
            {uploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{profile.full_name}</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => {
                setEditName(profile.full_name || '');
                setEditBio(profile.bio || '');
                setEditModalVisible(true);
              }}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bio}>{profile.bio || 'No bio added yet'}</Text>

          <Modal
            animationType="slide"
            transparent={true}
            visible={editModalVisible}
            onRequestClose={() => setEditModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                />

                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell us about yourself"
                  multiline
                  numberOfLines={4}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveProfile}
                  >
                    <Text style={styles.modalButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Tutors</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>-</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <BookOpen size={24} color="#1F2937" />
          <Text style={styles.actionText}>My Subjects</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleFavoriteTutors}
        >
          <Star size={24} color="#1F2937" />
          <Text style={styles.actionText}>Favorite Tutors</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Clock size={24} color="#1F2937" />
          <Text style={styles.actionText}>Session History</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  signInButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    alignItems: 'center',
  },
  signInText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#2563EB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1F2937',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadOverlay: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 8,
  },
  bio: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  actions: {
    padding: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  signOutButton: {
    margin: 24,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#DC2626',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  editButton: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
  },
  editText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#2563EB',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#2563EB',
  },
  modalButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
});
