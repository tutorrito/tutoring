import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react-native'; // For back button
import CustomTabBar from '../../components/CustomTabBar'; // Path seems correct
import { useAuth } from '@/hooks/useAuth'; // For role-based tab visibility
import { supabase } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons'; // For icons
import { Button } from 'react-native-elements'; // For a nicer button

// Define a more detailed type for the course, including tutor and subject info
interface CourseDetails {
  id: string;
  title: string;
  description: string | null;
  price: number;
  cover_image_url: string | null;
  created_at: string;
  tutor_id: string;
  subject_id: string;
  tutor_name: string | null; // To store tutor's full name
  tutor_avatar_url: string | null; // To store tutor's avatar
  subject_name: string | null; // To store subject name
}

interface CourseAvailability {
  id: string;
  course_id: string;
  start_time: string;
  end_time: string;
  day_of_week: string; // e.g., 'Monday', 'Tuesday'
  // consider adding specific_date if applicable
}

export default function CourseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth(); // Get profile for role
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [availability, setAvailability] = useState<CourseAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Course ID is missing.');
      setLoading(false);
      return;
    }

    const fetchCourseDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();

        if (courseError) throw courseError;
        if (!courseData) throw new Error('Course not found.');

        // Fetch tutor details (name only from profiles)
        const { data: tutorProfileData, error: tutorProfileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', courseData.tutor_id)
          .single();

        if (tutorProfileError) console.warn('Error fetching tutor profile:', tutorProfileError.message);

        let tutorAvatarPublicUrl: string | null = null;
        if (tutorProfileData && courseData.tutor_id) {
          // Fetch the latest avatar image path from profile_images table for the tutor
          const { data: imageRecord, error: imageError } = await supabase
            .from('profile_images')
            .select('image_path')
            .eq('user_id', courseData.tutor_id) // Assuming user_id in profile_images maps to profiles.id
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (imageError && imageError.code !== 'PGRST116') { // PGRST116: "Searched item not found"
            console.warn('Error fetching tutor avatar image from profile_images:', imageError.message);
          } else if (imageRecord && imageRecord.image_path) {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars') // Bucket name
              .getPublicUrl(imageRecord.image_path);
            tutorAvatarPublicUrl = publicUrl;
          }
        }

        // Fetch subject details
        const { data: subjectData, error: subjectError } = await supabase
          .from('subjects')
          .select('name')
          .eq('id', courseData.subject_id)
          .single();

        if (subjectError) console.warn('Error fetching subject:', subjectError.message);

        // Fetch course availability
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('course_availability')
          .select('*')
          .eq('course_id', courseData.id);

        if (availabilityError) {
          console.error('Critical error fetching course availability:', availabilityError.message);
          throw new Error(`Failed to load course availability: ${availabilityError.message}`);
        }

        // Ensure created_at is not null, as CourseDetails expects a string
        if (courseData.created_at === null) {
          throw new Error('Course data is incomplete: created_at is missing.');
        }

        setCourse({
          ...courseData,
          created_at: courseData.created_at, // Explicitly set to ensure type correctness
          tutor_name: tutorProfileData?.full_name || 'N/A',
          tutor_avatar_url: tutorAvatarPublicUrl,
          subject_name: subjectData?.name || 'N/A',
        });
        setAvailability(availabilityData || []);

      } catch (err: any) {
        console.error('Failed to fetch course details:', err);
        setError(err.message || 'Failed to load course details.');
        Alert.alert('Error', err.message || 'Failed to load course details.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading course details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="exclamation-triangle" size={50} color="red" />
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="question-circle" size={50} color="#ccc" />
        <Text style={styles.errorText}>Course not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ 
        title: course.title || 'Course Details', 
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10, padding: 5}}>
            <ArrowLeft size={24} color="#007AFF" />
          </TouchableOpacity>
        )
      }} />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: (styles.contentContainer.paddingBottom || 30) + 70 }]} // Add padding for tab bar
      >
        {course.cover_image_url ? (
          <Image source={{ uri: course.cover_image_url }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <FontAwesome name="photo" size={50} color="#ccc" />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{course.title}</Text>

          <View style={styles.infoRow}>
            <FontAwesome name="tag" size={18} color="#4B5563" style={styles.icon} />
            <Text style={styles.subjectText}>Subject: {course.subject_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <FontAwesome name="user-circle" size={18} color="#4B5563" style={styles.icon} />
            <Text style={styles.tutorText}>Tutor: {course.tutor_name}</Text>
            {/* Optionally, display tutor avatar if available */}
            {/* {course.tutor_avatar_url && <Image source={{ uri: course.tutor_avatar_url }} style={styles.tutorAvatar} />} */}
          </View>

          <View style={styles.infoRow}>
            <FontAwesome name="money" size={18} color="#4B5563" style={styles.icon} />
            <Text style={styles.priceText}>Price: QAR {course.price.toFixed(2)}</Text>
          </View>

          {course.description && (
            <>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{course.description}</Text>
            </>
          )}

          <Text style={styles.sectionTitle}>Available Slots</Text>
          {availability.length > 0 ? (
            availability.map((slot) => (
              <View key={slot.id} style={styles.availabilitySlot}>
                <FontAwesome name="calendar" size={16} color="#4B5563" style={styles.icon} />
                <Text style={styles.availabilityText}>
                  {slot.day_of_week}: {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noAvailabilityText}>No available dates for this course at the moment.</Text>
          )}

          <Button
            title="Book This Course"
            onPress={() => router.push(`/book-session/${course.id}?type=course` as any)} // Assuming booking screen can handle course type
            buttonStyle={styles.bookButton}
            titleStyle={styles.bookButtonText}
            icon={<FontAwesome name="calendar-check-o" size={18} color="#FFF" style={{ marginRight: 10 }} />}
            disabled={availability.length === 0} // Disable button if no availability
          />
        </View>
      </ScrollView>
      <CustomTabBar
        state={getMockTabState(profile?.role)}
        descriptors={getMockTabDescriptors(profile?.role)}
        navigation={{
          navigate: (name: string, params?: any) => router.push(`/(tabs)/${name}` as any), // Adjust path as needed
          emit: ({ type, target, canPreventDefault }) => ({ defaultPrevented: false } as any), // Mock emit
          // Add other navigation methods if CustomTabBar uses them, e.g., dispatch, goBack, etc.
          // For simplicity, only providing navigate and emit.
        }}
      />
    </View>
  );
}

// Helper functions to generate mock state and descriptors
const getMockTabRoutes = (role?: string) => {
  const routes = [
    { name: 'index', key: 'index', params: {} }, // Will be filtered by CustomTabBar due to options.href === null
    { name: 'profile', key: 'profile', params: {} }, // Will be filtered
    { name: 'search', key: 'search', params: {} },
    { name: 'messages', key: 'messages', params: {} },
    { name: 'notifications', key: 'notifications', params: {} },
    { name: 'settings', key: 'settings', params: {} },
  ];
  if (role === 'student' || !role) { // Default to student if role is undefined
    routes.splice(4, 0, { name: 'sessions', key: 'sessions', params: {} });
  }
  if (role === 'tutor') {
    routes.splice(4, 0, { name: 'tutor-dashboard', key: 'tutor-dashboard', params: {} });
  }
  return routes;
};

const getMockTabState = (role?: string) => {
  return {
    index: -1, // No tab is active on this screen
    routes: getMockTabRoutes(role),
    // Add other state properties if necessary, e.g., routeNames, history, type, stale
    routeNames: getMockTabRoutes(role).map(r => r.name),
    history: [],
    type: 'tab' as 'tab', // Explicitly type as 'tab'
    stale: false,
  };
};

const getMockTabDescriptors = (role?: string) => {
  const descriptors: any = {};
  getMockTabRoutes(role).forEach(route => {
    descriptors[route.key] = {
      options: {
        href: (route.name === 'index' || route.name === 'profile') ? null : undefined,
        // Add other options if CustomTabBar uses them
      },
      // Add render, navigation, etc. if CustomTabBar uses them from descriptors
    };
  });
  return descriptors;
};

// Helper function to format TIME string (e.g., "14:00:00") to a displayable format (e.g., "2:00 PM")
const formatTime = (timeString: string) => {
  if (!timeString) return 'N/A';
  // Create a date object with today's date and the given time
  // This helps toLocaleTimeString work reliably
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter_500Medium',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  coverImage: {
    width: '100%',
    height: 250,
  },
  placeholderImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#9CA3AF',
    marginTop: 10,
    fontFamily: 'Inter_400Regular',
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 10,
  },
  subjectText: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    color: '#374151',
  },
  tutorText: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    color: '#374151',
  },
  tutorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: 10,
  },
  priceText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#10B981', // Green for price
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 5,
  },
  descriptionText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#4B5563',
    lineHeight: 24,
    textAlign: 'justify',
  },
  availabilitySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E5E7EB', // Light gray background for slots
    borderRadius: 6,
    marginBottom: 8,
  },
  availabilityText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#1F2937',
  },
  noAvailabilityText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280', // Muted color for the message
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  bookButton: {
    backgroundColor: '#007AFF', // Primary action color
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 30,
  },
  bookButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
  },
  // Styles for contentContainer might need adjustment for CustomTabBar later
});
