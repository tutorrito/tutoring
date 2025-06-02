import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  TextInput,
  Platform,
  Modal,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { BookOpen, Star, Clock, User as UserIcon, X, Camera, CreditCard as Edit2, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProfileScreen() {
  const { profile, loading, user, signOut, updateProfile, avatarUrl, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    bio: '',
    email: '',
    phone: ''
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setEditData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        email: profile.email || '',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  const handleMySubjects = () => {
    router.push('/my-subjects');
  };

  const handleFavoriteTutors = () => {
    router.push('/favorite-tutors');
  };

  const handleSessionHistory = () => {
    router.push('/session-history');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const validateImage = (fileSize: number, mimeType?: string) => {
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error('Image size must be less than 5MB');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (mimeType && !allowedTypes.includes(mimeType)) {
      throw new Error('Only JPEG, PNG and WebP images are allowed');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const { uri, fileSize, mimeType } = result.assets[0];
        
        try {
          validateImage(fileSize || 0, mimeType);
          // Pass the mimeType and fileSize obtained from ImagePicker to uploadAvatar
          await uploadAvatar(uri, mimeType, fileSize); 
        } catch (error) {
          if (error instanceof Error) {
            Alert.alert('Error', error.message);
          }
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadAvatar = async (uri: string, originalMimeType?: string, originalFileSize?: number) => {
    console.log('[ProfileScreen|uploadAvatar] Initiated.');
    if (!user) {
      console.log('[ProfileScreen|uploadAvatar] No user, returning.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      let formData: FormData | Blob;
      let determinedContentType: string;

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        formData = await response.blob();
        // For web, blob.type is reliable. Fallback to originalMimeType if blob.type is missing.
        determinedContentType = formData.type || originalMimeType || 'image/jpeg';
      } else {
        // For native, prioritize originalMimeType from ImagePicker.
        determinedContentType = originalMimeType || 'image/jpeg';
        const extension = determinedContentType.split('/')[1] || 'jpg';
        const tempFileName = `avatar-${Date.now()}.${extension}`;

        formData = new FormData();
        formData.append('file', {
          uri,
          name: tempFileName, // Use dynamically generated extension
          type: determinedContentType   // Use actual determinedContentType
        } as any);
      }
      
      // Ensure determinedContentType has a valid value before splitting for the final fileName
      const safeContentType = determinedContentType || 'image/jpeg';
      const extension = safeContentType.split('/')[1] || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${extension}`;
      const filePath = `${user.id}/${fileName}`;

      // Get file size for logging
      // For web, formData.size is accurate if formData is a Blob.
      // For native, use the passed originalFileSize.
      const actualFileSize = (Platform.OS === 'web' && formData instanceof Blob) ? formData.size : originalFileSize;

      console.log(`[ProfileScreen|uploadAvatar] Attempting to upload to Storage. filePath: ${filePath}, contentType: ${safeContentType}, fileSize: ${actualFileSize}`);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData, { 
          upsert: true,
          contentType: safeContentType // Use the determined and validated content type for upload
        });

      if (uploadError) {
        console.error('[ProfileScreen|uploadAvatar] Supabase Storage upload error:', JSON.stringify(uploadError));
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Generated publicUrl for avatar:', publicUrl); // Log the generated URL
      if (!publicUrl) { // publicUrl is still useful for immediate display if desired, but filePath is key for DB
        throw new Error('Failed to get public URL for avatar or filePath is missing.');
      }

      // Insert a record into the new profile_images table
      console.log(`[ProfileScreen|uploadAvatar] Attempting to insert into profile_images with user_id: ${user.id} and image_path: ${filePath}`);
      const { error: insertError } = await supabase
        .from('profile_images')
        .insert({
          user_id: user.id, // This must match auth.uid() for the RLS policy
          image_path: filePath, // Store the path, not the full URL
        });

      if (insertError) {
        console.error('[ProfileScreen|uploadAvatar] Error inserting avatar record into profile_images:', JSON.stringify(insertError));
        throw insertError; // This will be caught by the outer catch
      }
      console.log('[ProfileScreen|uploadAvatar] Successfully inserted record into profile_images.');

      // Refresh the profile/avatar in the auth context to update UI
      console.log('[ProfileScreen|uploadAvatar] Calling refreshProfile().');
      await refreshProfile(); 
      console.log('[ProfileScreen|uploadAvatar] refreshProfile() completed.');

    } catch (error) {
      // Log the specific error object
      if (typeof error === 'object' && error !== null && 'message' in error) {
        console.error('[ProfileScreen|uploadAvatar] CATCH BLOCK: Error during avatar upload or DB insert:', JSON.stringify(error));
      } else {
        console.error('[ProfileScreen|uploadAvatar] CATCH BLOCK: An unknown error occurred:', error);
      }
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    console.log('[ProfileScreen|handleSaveProfile] Initiated. Data to save:', JSON.stringify(editData));
    try {
      setError(null);
      await updateProfile(editData); // editData should not contain avatar_url
      setIsEditing(false);
      console.log('[ProfileScreen|handleSaveProfile] Profile update successful.');
    } catch (error) {
      console.error('[ProfileScreen|handleSaveProfile] Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setIsEditing(true)}
        >
          <Edit2 size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isEditing}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsEditing(false)}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editData.full_name}
                onChangeText={(text) => setEditData(prev => ({ ...prev, full_name: text }))}
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={editData.bio}
                onChangeText={(text) => setEditData(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={editData.email}
                onChangeText={(text) => setEditData(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={editData.phone}
                onChangeText={(text) => setEditData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
      
      <View style={styles.profileInfo}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={pickImage}
          disabled={uploading}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              onError={(e) => console.log(`Failed to load profile avatar from avatarUrl: ${avatarUrl}`, e.nativeEvent.error)}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserIcon size={32} color="#6B7280" />
            </View>
          )}
          <View style={styles.cameraButton}>
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Camera size={16} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{profile?.full_name || 'Anonymous User'}</Text>
        <Text style={styles.bio}>{profile?.bio || 'No bio added yet'}</Text>

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
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleMySubjects}
        >
          <BookOpen size={24} color="#1F2937" />
          <Text style={styles.actionText}>My Subjects</Text>
          <ChevronRight size={20} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleFavoriteTutors}
        >
          <Star size={24} color="#1F2937" />
          <Text style={styles.actionText}>Favorite Tutors</Text>
          <ChevronRight size={20} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleSessionHistory}
        >
          <Clock size={24} color="#1F2937" />
          <Text style={styles.actionText}>Session History</Text>
          <ChevronRight size={20} color="#6B7280" />
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  signInButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  signInText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1F2937',
  },
  editButton: {
    padding: 8,
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F46E5',
    width: 32,
    height: 32,
    borderRadius: 16,
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
    textAlign: 'center',
    marginBottom: 24,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
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
    justifyContent: 'space-between',
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
    flex: 1,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    padding: 24,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    margin: 24,
    borderRadius: 8,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
