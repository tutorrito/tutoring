import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Platform, Alert, FlatList, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, CalendarDays, Clock, ImagePlus, XCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base-64'; // For converting base64 string to ArrayBuffer
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 24, // Adjusted for status bar (iOS typically 44-50)
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1F2937',
    marginLeft: 16,
  },
  addCourseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    marginHorizontal: 24, // Kept for when it's visible
    marginVertical: 20, // Kept for when it's visible
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    ...(Platform.OS === 'web' && { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }),
  },
  addCourseButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  addFormScrollView: {
    flex: 1, // Takes up available space when visible
    backgroundColor: '#FFFFFF', // Moved background here for full screen effect
  },
  addFormContainer: {
    // This is now contentContainerStyle for the ScrollView
    paddingHorizontal: 20, // Horizontal padding for content
    paddingVertical: 24,   // Vertical padding for content
    // Removed marginHorizontal, marginTop, marginBottom, borderRadius, borderWidth, borderColor
    // backgroundColor is now on addFormScrollView
  },
  formTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F9FAFB', // Light input background
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  pickerContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 16,
    height: 48,
    justifyContent: 'center',
  },
  picker: {
    height: 48,
    width: '100%',
    color: '#1F2937',
  },
  pickerItem: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1F2937',
  },
  pickerItemUnselected: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#9CA3AF',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8, // Space before preview
    gap: 8,
  },
  imagePickerButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#4F46E5',
  },
  coverImagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
  },
  subFormTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#374151',
    marginTop: 12,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  availabilitySlotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  availabilitySlotText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#374151',
  },
  availabilityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pickerContainerSmall: {
    flex: 2,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
  },
  pickerSmall: {
    height: 44,
    width: '100%',
  },
  pickerItemSmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  timeInput: {
    flex: 3,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  addAvailabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6', // Blue for add availability
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginBottom: 20, // Space before main form actions
  },
  addAvailabilityButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Spread buttons
    marginTop: 16,
    gap: 12,
  },
  formButton: {
    flex: 1, // Make buttons take equal width
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center', // Center text
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#4B5563',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
  },
  saveButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 16, // Reduced horizontal padding
    paddingBottom: 24,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center', // Center items vertically
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    ...(Platform.OS === 'web' && { boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }),
  },
  courseImage: {
    width: 72, // Slightly smaller
    height: 72, // Slightly smaller
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#E5E7EB',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    color: '#1F2937',
    marginBottom: 2,
  },
  courseSubject: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#4338CA', // Darker purple
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  courseDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 18,
  },
  coursePrice: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#059669', // Darker green
    marginTop: 4,
  },
  courseActions: {
    flexDirection: 'column',
    gap: 10,
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20, // Circular buttons
  },
  emptyState: {
    flex: 1, // Take up available space
    justifyContent: 'center', // Center content
    alignItems: 'center',
    padding: 24,
    marginTop: 40, // Push down from header/add button
  },
  emptyStateTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});

type Subject = {
  id: string;
  name: string;
};

type AvailabilitySlot = {
  day_of_week: string;
  start_time: string;
  end_time: string;
};

type Course = {
  id: string;
  tutor_id: string;
  title: string;
  description: string | null; // Changed from string to string | null
  subject_id: string; // Changed from subject: string
  price: number;
  cover_image_url: string | null; // Added
  created_at: string;
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ManageSubjectsScreen() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Added for edit mode
  const [editingCourse, setEditingCourse] = useState<Course | null>(null); // Added for storing course being edited
  const [isFormLoading, setIsFormLoading] = useState(false); // Added for loading form-specific data like availability
  
  // New Course Form State
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseSubjectId, setNewCourseSubjectId] = useState<string | undefined>(undefined); // Changed from newCourseSubject
  const [newCoursePrice, setNewCoursePrice] = useState('');
  const [newCourseCoverImage, setNewCourseCoverImage] = useState<ImagePicker.ImagePickerAsset | null>(null); // Added
  const [newCourseCoverImageUrl, setNewCourseCoverImageUrl] = useState<string | null>(null); // Added for existing image URL during edit
  const [newCourseAvailability, setNewCourseAvailability] = useState<AvailabilitySlot[]>([]); // Added

  // Temporary state for adding a single availability slot
  const [currentAvailabilityDay, setCurrentAvailabilityDay] = useState<string>(DAYS_OF_WEEK[0]); // Added
  const [currentAvailabilityStartTime, setCurrentAvailabilityStartTime] = useState(''); // Added
  const [currentAvailabilityEndTime, setCurrentAvailabilityEndTime] = useState(''); // Added

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]); // Added
  const [subjectsLoading, setSubjectsLoading] = useState(true); // Added for subject loading state

  useEffect(() => {
    const fetchSubjects = async () => {
      setSubjectsLoading(true);
      try {
        const { data, error } = await supabase.from('subjects').select('id, name');
        if (error) throw error;
        setAllSubjects(data || []);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        Alert.alert('Error', 'Failed to fetch subjects.');
      } finally {
        setSubjectsLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!profile?.id) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, tutor_id, title, description, subject_id, price, cover_image_url, created_at') // Updated select
          .eq('tutor_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCourses(data as Course[] || []); // Cast to Course[]
      } catch (error) {
        console.error('Error fetching courses:', error);
        Alert.alert('Error', 'Failed to fetch your courses.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [profile]);

  useEffect(() => {
    // Automatically select the first valid subject when the form is opened and subjects are loaded
    if ((isAdding || isEditing) && !editingCourse) { // Don't override if editing and subject is already set
      const validSubjects = allSubjects.filter(s => s.id && typeof s.id === 'string' && s.id.trim() !== '');
      if (validSubjects.length > 0 && newCourseSubjectId === undefined) {
        setNewCourseSubjectId(validSubjects[0].id);
      }
    }
  }, [isAdding, isEditing, editingCourse, allSubjects, subjectsLoading]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewCourseCoverImage(result.assets[0]);
    }
  };

  const handleAddAvailabilitySlot = () => {
    if (!currentAvailabilityDay || !currentAvailabilityStartTime || !currentAvailabilityEndTime) {
      Alert.alert('Error', 'Please fill in all fields for the availability slot.');
      return;
    }
    // Basic time validation (HH:MM format)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(currentAvailabilityStartTime) || !timeRegex.test(currentAvailabilityEndTime)) {
        Alert.alert('Error', 'Please enter time in HH:MM format (e.g., 09:00).');
        return;
    }

    // Validate that end time is after start time
    const startTimeParts = currentAvailabilityStartTime.split(':').map(Number);
    const endTimeParts = currentAvailabilityEndTime.split(':').map(Number);
    const startTimeInMinutes = startTimeParts[0] * 60 + startTimeParts[1];
    const endTimeInMinutes = endTimeParts[0] * 60 + endTimeParts[1];

    if (endTimeInMinutes <= startTimeInMinutes) {
      Alert.alert('Error', 'End time must be after start time.');
      return;
    }

    setNewCourseAvailability([...newCourseAvailability, {
      day_of_week: currentAvailabilityDay,
      start_time: currentAvailabilityStartTime,
      end_time: currentAvailabilityEndTime,
    }]);
    setCurrentAvailabilityDay(DAYS_OF_WEEK[0]);
    setCurrentAvailabilityStartTime('');
    setCurrentAvailabilityEndTime('');
  };

  const handleRemoveAvailabilitySlot = (index: number) => {
    setNewCourseAvailability(newCourseAvailability.filter((_, i) => i !== index));
  };


  const handleSaveCourse = async () => {
    const actionType = isEditing && editingCourse ? 'update' : 'create';
    console.log(`[handleSaveCourse] Called for ${actionType}`);
    console.log(`[handleSaveCourse] Profile ID:`, profile?.id);
    console.log(`[handleSaveCourse] Editing Course ID:`, editingCourse?.id);
    console.log(`[handleSaveCourse] Title:`, newCourseTitle);
    console.log(`[handleSaveCourse] Subject ID:`, newCourseSubjectId);
    console.log(`[handleSaveCourse] Price:`, newCoursePrice);
    console.log(`[handleSaveCourse] Availability Slots:`, newCourseAvailability.length);
    console.log(`[handleSaveCourse] New Cover Image URI:`, newCourseCoverImage ? newCourseCoverImage.uri : 'null');
    console.log(`[handleSaveCourse] Existing Cover Image URL:`, newCourseCoverImageUrl);
    console.log(`[handleSaveCourse] Is Editing: ${isEditing}, Editing Course ID: ${editingCourse?.id}`);


    if (!profile?.id || !newCourseTitle || !newCourseSubjectId || !newCoursePrice) {
      const missingFields = [];
      if (!profile?.id) missingFields.push('Profile ID');
      if (!newCourseTitle) missingFields.push('Title');
      if (!newCourseSubjectId) missingFields.push('Subject');
      if (!newCoursePrice) missingFields.push('Price');
      const errorMessage = `Please fill in required fields: ${missingFields.join(', ')}.`;
      console.error(`[handleSaveCourse] Validation Error:`, errorMessage);
      Alert.alert('Error', errorMessage);
      return;
    }

    const priceNumber = parseFloat(newCoursePrice);
    if (isNaN(priceNumber) || priceNumber < 0) {
      console.error(`[handleSaveCourse] Validation Error: Invalid price.`);
      Alert.alert('Error', 'Please enter a valid positive price.');
      return;
    }
    if (newCourseAvailability.length === 0) {
      console.error(`[handleSaveCourse] Validation Error: No availability slots.`);
      Alert.alert('Error', 'Please add at least one availability slot.');
      return;
    }

    console.log(`[handleSaveCourse] All validations passed. Proceeding to set loading state.`);
    setIsLoading(true);
    try {
      let finalCoverImageUrl: string | null = isEditing ? newCourseCoverImageUrl : null;

      if (newCourseCoverImage) { // If a new image was picked
        console.log(`[handleSaveCourse] New cover image picked. Asset:`, newCourseCoverImage);
        const asset = newCourseCoverImage;
        
        let fileExt = 'jpeg'; // Default extension
        let finalMimeType: string | null = null;

        // 1. Try to get MIME type and extension from data URI first
        if (asset.uri.startsWith('data:')) {
            const match = asset.uri.match(/^data:(image\/[a-z0-9]+);base64,/);
            if (match && match[1]) {
                finalMimeType = match[1].toLowerCase(); // Normalize to lowercase
                const extCandidate = finalMimeType.split('/')[1];
                if (extCandidate) fileExt = extCandidate;
            }
        }

        // 2. If not a data URI or parsing failed, try asset.mimeType
        console.log(`[handleSaveCourse] Initial asset.mimeType: '${asset.mimeType}'`);
        if (!finalMimeType && asset.mimeType) {
            const types = asset.mimeType.toLowerCase().split(','); // Normalize to lowercase before splitting
            const imageMime = types.map(t => t.trim()).find(t => t.startsWith('image/'));
            if (imageMime) {
                finalMimeType = imageMime;
                console.log(`[handleSaveCourse] MIME type from asset.mimeType: '${finalMimeType}'`);
                // If fileExt is still default, try to derive from this found MIME type
                if (fileExt === 'jpeg' || fileExt === 'jpg') { // Check against jpg as well
                    const potentialExt = imageMime.split('/')[1];
                    if (potentialExt) fileExt = potentialExt;
                }
            } else {
                console.warn(`[handleSaveCourse] No image MIME type found in asset.mimeType: '${asset.mimeType}'`);
            }
        }
        
        // 3. Use asset.fileName for extension if available and more specific than current fileExt
        if (asset.fileName) {
            const nameParts = asset.fileName.split('.');
            if (nameParts.length > 1) {
                const extFromFileName = nameParts.pop()!.toLowerCase();
                if (extFromFileName.length > 0 && extFromFileName.length <= 4 && /^[a-z0-9]+$/.test(extFromFileName)) {
                    // Only update fileExt if it's different and potentially more accurate
                    if (fileExt !== extFromFileName) {
                        console.log(`[handleSaveCourse] Updating fileExt from '${fileExt}' to '${extFromFileName}' based on asset.fileName.`);
                        fileExt = extFromFileName;
                    }
                }
            }
        } else if (!asset.fileName && !asset.uri.startsWith('data:') && asset.uri) { 
            // 4. Fallback for non-data URI without filename: try to parse from URI path
             try {
                const path = new URL(asset.uri).pathname;
                const nameFromPath = path.substring(path.lastIndexOf('/') + 1);
                const nameParts = nameFromPath.split('.');
                if (nameParts.length > 1) {
                    const extCandidate = nameParts.pop()!.toLowerCase();
                    if (extCandidate.length > 0 && extCandidate.length <= 4 && /^[a-z0-9]+$/.test(extCandidate)) {
                         if (fileExt !== extCandidate) {
                            console.log(`[handleSaveCourse] Updating fileExt from '${fileExt}' to '${extCandidate}' based on URI path.`);
                            fileExt = extCandidate;
                        }
                    }
                }
            } catch (e) { console.warn("[handleSaveCourse] Could not parse extension from URI path:", asset.uri, e); }
        }

        // Normalize common extensions
        if (fileExt === 'jpg' || fileExt === 'jfif') fileExt = 'jpeg';
        if (fileExt === 'svg+xml') fileExt = 'svg'; // Handle svg if it was somehow derived

        // 5. If MIME type is still not determined, construct it from the finalized fileExt
        if (!finalMimeType) {
            const derivedMime = `image/${fileExt}`;
            console.warn(`[handleSaveCourse] finalMimeType not determined. Falling back to extension-based: '${derivedMime}'. Original asset.mimeType: '${asset.mimeType}'`);
            finalMimeType = derivedMime;
        }
        
        // Normalize common MIME types
        if (finalMimeType === 'image/jpg') finalMimeType = 'image/jpeg';
        if (finalMimeType === 'image/svg+xml') finalMimeType = 'image/svg';


        // Ensure finalMimeType is a valid one for Supabase storage policies
        const allowedSupabaseMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!finalMimeType || !allowedSupabaseMimeTypes.includes(finalMimeType)) {
            console.error(`[handleSaveCourse] Invalid or unsupported finalMimeType: '${finalMimeType}'. Defaulting to 'image/jpeg'. Original asset.mimeType: '${asset.mimeType}', derived fileExt: '${fileExt}'`);
            finalMimeType = 'image/jpeg'; 
            if (fileExt !== 'jpeg' && fileExt !== 'png' && fileExt !== 'webp') { // If extension also doesn't match allowed types
                fileExt = 'jpeg'; // Default extension to match default MIME
            }
        }
        console.log(`[handleSaveCourse] Determined finalMimeType: '${finalMimeType}', finalFileExt: '${fileExt}'`);
        
        const fileNameForUpload = `${profile.id}-${Date.now()}.${fileExt}`;
        let arrayBuffer;

        try {
          if (Platform.OS === 'web') {
            if (asset.uri.startsWith('data:')) {
              const base64String = asset.uri.split(',')[1];
              const decodedBinaryString = decode(base64String);
              const byteArray = new Uint8Array(decodedBinaryString.length);
              for (let i = 0; i < decodedBinaryString.length; i++) {
                byteArray[i] = decodedBinaryString.charCodeAt(i);
              }
              arrayBuffer = byteArray.buffer;
            } else { // Handle blob URI
              const response = await fetch(asset.uri);
              arrayBuffer = await response.arrayBuffer();
            }
          } else { // Native platforms
            const base64FileData = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const decodedBinaryString = decode(base64FileData);
            const byteArray = new Uint8Array(decodedBinaryString.length);
            for (let i = 0; i < decodedBinaryString.length; i++) {
              byteArray[i] = decodedBinaryString.charCodeAt(i);
            }
            arrayBuffer = byteArray.buffer;
          }
          
          if (!arrayBuffer) {
            console.error('[handleSaveCourse] Failed to convert image to ArrayBuffer. Asset URI:', asset.uri, 'Platform:', Platform.OS);
            throw new Error('Failed to convert image to ArrayBuffer.');
          }

          console.log(`[handleSaveCourse] Uploading ${fileNameForUpload} (MIME: ${finalMimeType}), size: ${arrayBuffer.byteLength} bytes.`);
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('course-covers')
            .upload(fileNameForUpload, arrayBuffer, { contentType: finalMimeType, cacheControl: '3600', upsert: true });

          if (uploadError) {
            console.error(`[handleSaveCourse] Image upload error (fileName: ${fileNameForUpload}, mimeType: ${finalMimeType}):`, JSON.stringify(uploadError, null, 2));
            throw uploadError;
          }
          if (!uploadData || !uploadData.path) { 
            console.error(`[handleSaveCourse] Image upload failed: No path returned from storage.`);
            throw new Error('Image upload failed: No path returned from storage.');
          }
          
          console.log(`[handleSaveCourse] Image uploaded successfully. Path:`, uploadData.path);
          // getPublicUrl is synchronous and returns { data: { publicUrl: string } }
          // It does not return an error property in the destructured response like other async calls.
          const { data: urlObject } = supabase.storage.from('course-covers').getPublicUrl(uploadData.path);

          if (!urlObject || !urlObject.publicUrl) { 
             console.error(`[handleSaveCourse] Error getting public URL: No publicUrl in response or urlObject is null.`);
            throw new Error('Failed to get image public URL.');
          }
          finalCoverImageUrl = urlObject.publicUrl;
          console.log(`[handleSaveCourse] New image public URL:`, finalCoverImageUrl);

          // If editing and an old image existed, and it's different from the new one, delete the old one.
          if (isEditing && editingCourse?.cover_image_url && editingCourse.cover_image_url !== finalCoverImageUrl) {
            const oldImageFileName = editingCourse.cover_image_url.split('/').pop();
            if (oldImageFileName) {
              console.log(`[handleSaveCourse] New image uploaded, deleting old cover image: ${oldImageFileName}`);
              try {
                await supabase.storage.from('course-covers').remove([oldImageFileName]);
              } catch (removeError) {
                console.error(`[handleSaveCourse] Failed to delete old image ${oldImageFileName}:`, removeError);
                // Non-fatal, continue with saving course data
              }
            }
          }
        } catch (e: any) {
          console.error(`[handleSaveCourse] Exception during image upload process:`, e);
          throw e; // Re-throw to be caught by main try-catch
        }
      } else if (isEditing && editingCourse?.cover_image_url && !newCourseCoverImageUrl) {
        // Case: Editing, no new image picked, and newCourseCoverImageUrl is now null (user clicked "Remove Image")
        // So, delete the old image from storage.
        const oldImageFileName = editingCourse.cover_image_url.split('/').pop();
        if (oldImageFileName) {
          console.log(`[handleSaveCourse] User chose to remove image. Deleting: ${oldImageFileName}`);
          try {
            await supabase.storage.from('course-covers').remove([oldImageFileName]);
          } catch (removeError) {
            console.error(`[handleSaveCourse] Failed to delete (removed) image ${oldImageFileName}:`, removeError);
             // Non-fatal
          }
        }
        finalCoverImageUrl = null; // Ensure it's set to null in DB
      }
      // If no new image is picked (`newCourseCoverImage` is null), 
      // and we are either not editing, or we are editing but `newCourseCoverImageUrl` is still set (i.e., user wants to keep existing image),
      // `finalCoverImageUrl` correctly holds its initial value (null for add, or existing URL for edit).


      const courseDataPayload = {
        tutor_id: profile.id,
        title: newCourseTitle,
        description: newCourseDescription || null,
        subject_id: newCourseSubjectId,
        price: priceNumber,
        cover_image_url: finalCoverImageUrl,
      };
      console.log(`[handleSaveCourse] Course data payload for ${actionType}:`, courseDataPayload);

      let savedCourse: Course | null = null;

      if (isEditing && editingCourse) {
        const { data: updatedData, error: updateError } = await supabase
          .from('courses')
          .update(courseDataPayload)
          .eq('id', editingCourse.id)
          .select('id, tutor_id, title, description, subject_id, price, cover_image_url, created_at')
          .single();
        if (updateError) throw updateError;
        savedCourse = updatedData as Course;
        console.log(`[handleSaveCourse] Course updated successfully:`, savedCourse);
      } else {
        const { data: insertedData, error: insertError } = await supabase
          .from('courses')
          .insert(courseDataPayload)
          .select('id, tutor_id, title, description, subject_id, price, cover_image_url, created_at')
          .single();
        if (insertError) throw insertError;
        savedCourse = insertedData as Course;
        console.log(`[handleSaveCourse] Course inserted successfully:`, savedCourse);
      }

      if (!savedCourse) {
        throw new Error(`Course ${actionType} failed, no data returned.`);
      }

      // Handle availability: delete existing and insert new ones for the course
      console.log(`[handleSaveCourse] Deleting existing availability for course ID:`, savedCourse.id);
      const { error: deleteAvailError } = await supabase
        .from('course_availability')
        .delete()
        .eq('course_id', savedCourse.id);
      if (deleteAvailError) {
          console.error(`[handleSaveCourse] Error deleting old availability:`, deleteAvailError);
          // Not throwing, as course itself is saved. Log and alert.
          Alert.alert('Warning', `Course ${actionType}d, but failed to clear old availability slots: ${deleteAvailError.message}`);
      }

      if (newCourseAvailability.length > 0) {
        console.log(`[handleSaveCourse] Adding new availability slots for course ID:`, savedCourse.id);
        const availabilityToInsert = newCourseAvailability.map(slot => ({
          course_id: savedCourse!.id, // savedCourse is guaranteed to be non-null here
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
        }));
        console.log(`[handleSaveCourse] About to insert availability. Course ID: ${savedCourse?.id}, Tutor ID (profile.id): ${profile?.id}`);
        console.log(`[handleSaveCourse] Availability insert data:`, JSON.stringify(availabilityToInsert, null, 2));
        
        const { error: availInsertError } = await supabase
          .from('course_availability')
          .insert(availabilityToInsert);
        
        if (availInsertError) {
          console.error(`[handleSaveCourse] Error adding new availability (Course ID: ${savedCourse?.id}, Tutor ID: ${profile?.id}):`, JSON.stringify(availInsertError, null, 2));
          // Instead of just alerting, throw an error to indicate the save operation was not fully successful.
          throw new Error(`Course ${actionType === 'update' ? 'updated' : 'created'}, but failed to save new availability slots: ${availInsertError.message}`);
        } else {
          console.log(`[handleSaveCourse] Availability slots updated/added successfully.`);
        }
      }

      if (isEditing) {
        setCourses(courses.map(c => c.id === savedCourse!.id ? savedCourse! : c));
      } else {
        setCourses([savedCourse!, ...courses]);
      }
      console.log(`[handleSaveCourse] Local courses state updated.`);
      
      resetFormState();
      setIsAdding(false);
      setIsEditing(false);
      console.log(`[handleSaveCourse] Form reset and flags updated.`);
      Alert.alert('Success', `Course ${actionType === 'update' ? 'updated' : 'added'} successfully!`);

    } catch (error: any) {
      console.error(`[handleSaveCourse] CATCH BLOCK: Error during course ${actionType}:`, error);
      Alert.alert('Error', `Failed to ${actionType} the course: ${error.message || 'Unknown error'}`);
    } finally {
      console.log(`[handleSaveCourse] FINALLY BLOCK: Setting isLoading to false.`);
      setIsLoading(false);
    }
  };

  const resetFormState = () => {
    setNewCourseTitle('');
    setNewCourseDescription('');
    const validSubjectsOnReset = allSubjects.filter(s => s.id && typeof s.id === 'string' && s.id.trim() !== '');
    setNewCourseSubjectId(validSubjectsOnReset.length > 0 ? validSubjectsOnReset[0].id : undefined);
    setNewCoursePrice('');
    setNewCourseCoverImage(null);
    setNewCourseCoverImageUrl(null);
    setNewCourseAvailability([]);
    setCurrentAvailabilityDay(DAYS_OF_WEEK[0]);
    setCurrentAvailabilityStartTime('');
    setCurrentAvailabilityEndTime('');
    setEditingCourse(null);
    setIsFormLoading(false); // Reset form loading state
  };

  const handleEditPress = async (course: Course) => {
    setIsFormLoading(true); // Start loading form-specific data
    setIsEditing(true);
    setIsAdding(false);
    setEditingCourse(course);

    setNewCourseTitle(course.title);
    setNewCourseDescription(course.description || '');
    setNewCourseSubjectId(course.subject_id);
    setNewCoursePrice(course.price.toString());
    setNewCourseCoverImage(null); // Reset local image picker state
    setNewCourseCoverImageUrl(course.cover_image_url); // Set existing image URL
    setNewCourseAvailability([]); // Initialize to empty before fetching

    try {
      const { data, error } = await supabase
        .from('course_availability')
        .select('day_of_week, start_time, end_time')
        .eq('course_id', course.id);
      
      if (error) {
        console.error('Error fetching course availability for edit:', error);
        Alert.alert('Error', 'Could not load course availability.');
        // setNewCourseAvailability([]); // Already initialized to empty
      } else {
        setNewCourseAvailability(data || []);
      }
    } catch (error) {
      console.error('Exception fetching course availability for edit:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading course availability.');
      // setNewCourseAvailability([]); // Already initialized to empty
    } finally {
      setIsFormLoading(false); // Finish loading form-specific data
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this course?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optionally, delete associated cover image from storage here
              // Delete availabilities first (due to foreign key with ON DELETE CASCADE on course_id, this might be automatic if course is deleted)
              // await supabase.from('course_availability').delete().eq('course_id', courseId);

              const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', courseId);

              if (error) throw error;

              setCourses(courses.filter(course => course.id !== courseId));
              Alert.alert('Success', 'Course deleted successfully!');
            } catch (error: any) {
              console.error('Error deleting course:', error);
              Alert.alert('Error', `Failed to delete the course: ${error.message || 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (isAdding || isEditing) {
            setIsAdding(false);
            setIsEditing(false);
            resetFormState();
          } else {
            if (router.canGoBack()) {
              router.back();
            } else {
              // Navigate to a default screen if cannot go back, e.g., dashboard
              router.replace('/(tabs)/tutor-dashboard'); 
            }
          }
        }}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>{isAdding ? 'Add New Course' : isEditing ? 'Edit Course' : 'Manage Courses'}</Text>
      </View>

      {/* Conditional rendering for Add/Edit Form vs. Course List */}
      {(isAdding || isEditing) ? (
        // ADD/EDIT COURSE FORM (Full Screen)
        <ScrollView 
          style={styles.addFormScrollView} 
          contentContainerStyle={styles.addFormContainer}
          keyboardShouldPersistTaps="handled" // Good for forms
        >
          {/* The main title is in the header. No need for styles.formTitle here anymore unless desired. */}
          {/* e.g., <Text style={styles.formTitle}>{isEditing ? 'Edit Subject Details' : 'New Subject Details'}</Text> */}
          
          <TextInput
            style={styles.input}
            placeholder="Subject Title *"
            value={newCourseTitle}
            onChangeText={setNewCourseTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Subject Description"
            value={newCourseDescription}
            onChangeText={setNewCourseDescription}
            multiline
          />
          
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={newCourseSubjectId}
              onValueChange={(itemValue) => setNewCourseSubjectId(itemValue || undefined)}
              style={styles.picker}
              prompt="Select Subject"
            >
              <Picker.Item label="Select Subject *" value={undefined} style={styles.pickerItemUnselected}/>
              {allSubjects.map((subject) => (
                <Picker.Item key={subject.id} label={subject.name} value={subject.id} style={styles.pickerItem}/>
              ))}
            </Picker>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Price (QAR) *"
            value={newCoursePrice}
            onChangeText={setNewCoursePrice}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
            <ImagePlus size={20} color="#4F46E5" />
            <Text style={styles.imagePickerButtonText}>
              {newCourseCoverImage ? 'Change Cover Image' : (isEditing && newCourseCoverImageUrl) ? 'Change Cover Image' : 'Add Cover Image'}
            </Text>
          </TouchableOpacity>
          {newCourseCoverImage ? (
            <Image source={{ uri: newCourseCoverImage.uri }} style={styles.coverImagePreview} resizeMode="cover" />
          ) : isEditing && newCourseCoverImageUrl ? (
            <Image source={{ uri: newCourseCoverImageUrl }} style={styles.coverImagePreview} resizeMode="cover" />
          ) : null}
          {isEditing && newCourseCoverImageUrl && !newCourseCoverImage && (
            <TouchableOpacity 
              onPress={() => {
                Alert.alert(
                  "Remove Image",
                  "Are you sure you want to remove the current cover image?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Remove", 
                      style: "destructive", 
                      onPress: () => setNewCourseCoverImageUrl(null) 
                    }
                  ]
                );
              }} 
              style={{alignItems: 'center', marginBottom: 16, marginTop: -8}}
            >
              <Text style={{color: '#DC2626', fontFamily: 'Inter_500Medium', fontSize: 14, padding: 8}}>Remove Current Image</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.subFormTitle}>Course Availability</Text>
          {newCourseAvailability.map((slot, index) => (
            <View key={index} style={styles.availabilitySlotCard}>
              <Text style={styles.availabilitySlotText}>
                {slot.day_of_week}: {slot.start_time} - {slot.end_time}
              </Text>
              <TouchableOpacity onPress={() => handleRemoveAvailabilitySlot(index)}>
                <XCircle size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.availabilityInputContainer}>
            <View style={styles.pickerContainerSmall}>
                <Picker
                selectedValue={currentAvailabilityDay}
                onValueChange={(itemValue) => setCurrentAvailabilityDay(itemValue)}
                style={styles.pickerSmall}
                prompt="Select Day"
                >
                {DAYS_OF_WEEK.map(day => (
                    <Picker.Item key={day} label={day.substring(0,3)} value={day} style={styles.pickerItemSmall}/>
                ))}
                </Picker>
            </View>
            <TextInput
                style={styles.timeInput}
                placeholder="Start (HH:MM)"
                value={currentAvailabilityStartTime}
                onChangeText={setCurrentAvailabilityStartTime}
                keyboardType="numbers-and-punctuation"
            />
            <TextInput
                style={styles.timeInput}
                placeholder="End (HH:MM)"
                value={currentAvailabilityEndTime}
                onChangeText={setCurrentAvailabilityEndTime}
                keyboardType="numbers-and-punctuation"
            />
          </View>
          <TouchableOpacity style={styles.addAvailabilityButton} onPress={handleAddAvailabilitySlot}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addAvailabilityButtonText}>Add Slot</Text>
          </TouchableOpacity>
          

          <View style={styles.formActions}>
            <TouchableOpacity 
              style={[styles.formButton, styles.cancelButton]}
              onPress={() => {
                setIsAdding(false);
                setIsEditing(false);
                resetFormState();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, styles.saveButton]}
              onPress={handleSaveCourse}
              disabled={isLoading || isFormLoading || ((isAdding || isEditing) && !newCourseSubjectId && (subjectsLoading || allSubjects.length > 0))}
            >
              <Text style={styles.saveButtonText}>{isLoading ? 'Saving...' : isFormLoading ? 'Loading...' : (isEditing ? 'Update Course' : 'Save Course')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <>
          {/* COURSE LIST VIEW */}
          <TouchableOpacity
            style={styles.addCourseButton}
            onPress={() => {
              resetFormState(); 
              setIsAdding(true);
              setIsEditing(false);
              setIsFormLoading(false); 
              const validSubjects = allSubjects.filter(s => s.id && typeof s.id === 'string' && s.id.trim() !== '');
              if (validSubjects.length > 0) {
                  setNewCourseSubjectId(validSubjects[0].id);
              }
            }}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addCourseButtonText}>Add New Course</Text>
          </TouchableOpacity>

          <FlatList
            data={courses}
            renderItem={({ item }) => {
              const subjectName = allSubjects.find(s => s.id === item.subject_id)?.name || 'Unknown Subject';
          return (
            <View style={styles.courseCard}>
              {item.cover_image_url && (
                <Image source={{ uri: item.cover_image_url }} style={styles.courseImage} resizeMode="cover" />
              )}
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{item.title}</Text>
                <Text style={styles.courseSubject}>{subjectName}</Text>
                <Text style={styles.courseDescription} numberOfLines={2}>{item.description || 'No description'}</Text>
                <Text style={styles.coursePrice}>QAR {item.price}</Text>
                {/* TODO: Display availability for the course card if needed */}
              </View>
              <View style={styles.courseActions}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => handleEditPress(item)}
                >
                  <Edit size={20} color="#4F46E5" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => handleDeleteCourse(item.id)}
                >
                  <Trash2 size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
            ListEmptyComponent={() => (
          !isLoading && !isAdding && !isEditing && (
            <View style={styles.emptyState}>
              <BookOpen size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No Courses Yet</Text>
              <Text style={styles.emptyStateText}>
                Add your first course using the button above.
              </Text>
            </View>
          )
        )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}
