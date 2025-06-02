import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, GraduationCap, Star, Languages, CalendarDays, Clock } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Assuming supabase is configured here
import { Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth

// Define types similar to ManageCoursesScreen for consistency
type Course = {
  id: string;
  tutor_id: string;
  title: string;
  description: string | null;
  subject_id: string;
  price: number;
  cover_image_url: string | null;
  created_at: string;
  // Potentially add tutor profile data if joined, or fetch separately
  profiles?: { full_name?: string; bio?: string; education?: string; hourly_rate?: number }; // Optional tutor profile - avatar_url removed
  subjects?: { name?: string }; // Optional subject name
};

// Define a specific type for the tutor profile data we expect
type TutorProfile = {
  full_name?: string;
  email?: string; // Added email
  bio?: string;
  education?: string;
  hourly_rate?: number;
  avatar_public_url?: string; // To store the fetched public URL for the avatar
};

type AvailabilitySlot = {
  id: string; // Added ID for the slot itself
  course_id: string;
  day_of_week: string; // e.g., "Monday", "Tuesday"
  start_time: string; // e.g., "09:00:00"
  end_time: string;   // e.g., "10:00:00"
};

// Helper to get next N dates for a given day of the week
const getNextDatesForDay = (dayOfWeek: string, count: number = 4): Date[] => {
  const resultDates: Date[] = [];
  const today = new Date();
  const dayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(dayOfWeek);

  if (dayIndex === -1) return [];

  let currentDate = new Date(today);
  currentDate.setDate(today.getDate() + (dayIndex - today.getDay() + 7) % 7);

  for (let i = 0; i < count; i++) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + i * 7);
    resultDates.push(nextDate);
  }
  return resultDates;
};


export default function BookSessionScreen() {
  const { id: courseId } = useLocalSearchParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null); // Use the new TutorProfile type
  const [subjectName, setSubjectName] = useState<string>('');
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: authUser, profile: authProfile } = useAuth(); // Get user and profile from useAuth
  
  const [selectedFullDate, setSelectedFullDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  // Derived state for UI
  const [uniqueAvailableDays, setUniqueAvailableDays] = useState<string[]>([]);
  const [datesForSelection, setDatesForSelection] = useState<{ display: string, date: Date, dayOfWeek: string }[]>([]);
  const [timeSlotsForSelectedDate, setTimeSlotsForSelectedDate] = useState<AvailabilitySlot[]>([]);


  useEffect(() => {
    if (!courseId) {
      Alert.alert("Error", "Course ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchCourseData = async () => {
      console.log(`[BookSessionScreen] fetchCourseData START for courseId: ${courseId}`);
      setIsLoading(true);
      try {
        // Fetch course details
        console.log(`[BookSessionScreen] Fetching course details for courseId: ${courseId}`);
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*') // Simplified select
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        if (!courseData) throw new Error('Course not found.');
        
        setCourse(courseData as Course);

        // Fetch tutor profile and subject name separately
        let fetchedTutorProfile: TutorProfile | null = null;
        let subjectNameData: string = 'Unknown Subject';

        console.log('[BookSessionScreen] Course Data:', JSON.stringify(courseData, null, 2));
        if (courseData.tutor_id) {
          console.log(`[BookSessionScreen] Fetching profile for tutor_id: ${courseData.tutor_id}`);
          // Fetch core tutor details
          const { data: tutorCoreData, error: tutorCoreError } = await supabase
            .from('profiles')
            .select('full_name, email, bio, education, hourly_rate')
            .eq('id', courseData.tutor_id)
            .single();

          if (tutorCoreError) {
            console.error(`[BookSessionScreen] Error fetching tutor core profile data for tutor_id ${courseData.tutor_id}: Code: ${tutorCoreError.code}, Message: ${tutorCoreError.message}`, tutorCoreError);
            if (tutorCoreError.code === 'PGRST116') {
              Alert.alert("Data Error", `Tutor profile for ID ${courseData.tutor_id} not found. This course cannot be booked currently. Please contact support.`);
              console.log(`[BookSessionScreen] PGRST116 error detected for tutor_id ${courseData.tutor_id}. Alert shown.`);
            } else {
              Alert.alert("Profile Error", `Could not load tutor details (Error: ${tutorCoreError.code}). This course cannot be booked currently.`);
              console.log(`[BookSessionScreen] Other error fetching tutor profile for tutor_id ${courseData.tutor_id}: ${tutorCoreError.message}. Alert shown.`);
            }
          } else if (tutorCoreData) {
            console.log(`[BookSessionScreen] Successfully fetched tutor core data for tutor_id ${courseData.tutor_id}:`, JSON.stringify(tutorCoreData, null, 2));
            fetchedTutorProfile = {
              full_name: tutorCoreData.full_name ?? undefined,
              email: tutorCoreData.email ?? undefined,
              bio: tutorCoreData.bio ?? undefined,
              education: tutorCoreData.education ?? undefined,
              hourly_rate: tutorCoreData.hourly_rate ?? undefined,
            };

            // Fetch avatar from profile_images
            const { data: imageData, error: imageError } = await supabase
              .from('profile_images')
              .select('image_path')
              .eq('user_id', courseData.tutor_id)
              .order('created_at', { ascending: false }) // Get the latest image
              .limit(1)
              .single();

            if (imageError) {
              console.warn(`Error fetching tutor avatar for tutor ${courseData.tutor_id}:`, imageError.message);
            } else if (imageData && imageData.image_path) {
              const { data: publicUrlData } = supabase
                .storage
                .from('avatars') // Assuming 'avatars' is the bucket name
                .getPublicUrl(imageData.image_path);
              
              if (fetchedTutorProfile) { // Check again due to async nature
                fetchedTutorProfile.avatar_public_url = publicUrlData?.publicUrl;
              }
            } else {
              console.log(`No avatar image_path found for tutor ${courseData.tutor_id}`);
            }
          }
        } else {
          console.warn(`[BookSessionScreen] courseData.tutor_id is missing or invalid for course ${courseId}. Course data:`, JSON.stringify(courseData, null, 2));
          Alert.alert("Data Issue", `The tutor ID for this course (ID: ${courseId}) is missing. Booking cannot proceed.`);
        }
        
        console.log('[BookSessionScreen] Right before setTutorProfile. Value of fetchedTutorProfile:', JSON.stringify(fetchedTutorProfile, null, 2));
        setTutorProfile(fetchedTutorProfile);

        if (courseData.subject_id) {
          const { data: subjectData, error: subjectError } = await supabase
            .from('subjects')
            .select('name')
            .eq('id', courseData.subject_id)
            .single();
          if (subjectError) {
            console.warn('Error fetching subject separately:', subjectError.message);
          } else if (subjectData) {
            subjectNameData = subjectData.name;
          }
        }
        setSubjectName(subjectNameData);

        // Fetch availability for this course
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('course_availability')
          .select('*')
          .eq('course_id', courseId);

        if (availabilityError) throw availabilityError;
        
        const fetchedSlots = availabilityData || [];
        setAvailabilitySlots(fetchedSlots);

        // Process availability for UI
        const uniqueDays = Array.from(new Set(fetchedSlots.map(slot => slot.day_of_week)));
        setUniqueAvailableDays(uniqueDays);
        
        const generatedDates: { display: string, date: Date, dayOfWeek: string }[] = [];
        uniqueDays.forEach(dayStr => {
          const nextFourOccurrences = getNextDatesForDay(dayStr, 4);
          nextFourOccurrences.forEach(dateObj => {
            generatedDates.push({
              display: dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
              date: dateObj,
              dayOfWeek: dayStr
            });
          });
        });
        // Sort dates chronologically
        generatedDates.sort((a,b) => a.date.getTime() - b.date.getTime());
        setDatesForSelection(generatedDates);

      } catch (error: any) {
        console.error('Error fetching course data:', error);
        Alert.alert('Error', error.message || 'Failed to load course details.');
        // router.back(); // Optionally navigate back if data loading fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  const handleContinue = () => {
    console.log('handleContinue called');
    console.log('selectedFullDate:', selectedFullDate ? selectedFullDate.toISOString() : null);
    console.log('selectedSlot:', selectedSlot ? selectedSlot.id : null);
    console.log('course:', course ? course.id : null);
    console.log('tutorProfile:', tutorProfile ? tutorProfile.full_name : null);
    console.log('authUser:', authUser ? authUser.id : null);
    console.log('authProfile:', authProfile ? authProfile.role : null);

    if (authProfile?.role === 'tutor' && authUser?.id === course?.tutor_id) {
      Alert.alert("Booking Error", "Tutors cannot book their own courses.");
      console.log('Tutor attempting to book own course. Prevented.');
      return;
    }

    const canProceed = selectedFullDate && selectedSlot && course && tutorProfile;
    console.log('canProceed:', canProceed);

    if (canProceed) {
      // Ensure all required properties exist before trying to access them
      const params = {
        tutorName: tutorProfile!.full_name || 'Tutor',
        tutorEmail: tutorProfile!.email || '', // Added tutorEmail
        courseTitle: course!.title,
        subjectName: subjectName,
        date: selectedFullDate!.toISOString().split('T')[0],
        time: `${selectedSlot!.start_time.substring(0,5)} - ${selectedSlot!.end_time.substring(0,5)}`,
        price: course!.price.toString(),
        courseId: course!.id,
        tutorId: course!.tutor_id,
        availabilitySlotId: selectedSlot!.id,
        subjectId: course!.subject_id, // Pass subject_id
      };
      console.log('Navigating to /book-session/contact-info with params:', params);
      try {
        router.push({
          pathname: '/book-session/contact-info',
          params: params
        });
        console.log('router.push called successfully');
      } catch (e: unknown) { // Changed type to unknown for better error handling
        console.error('Error during router.push:', e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        Alert.alert("Navigation Error", "Could not proceed to the next step. " + errorMessage);
      }
    } else {
      console.log('Condition not met, showing alert. Course exists:', !!course, 'TutorProfile exists:', !!tutorProfile, 'Date selected:', !!selectedFullDate, 'Slot selected:', !!selectedSlot);
      Alert.alert(
        "Selection Incomplete", 
        "Please select a date and a time slot.\n" +
        `Details: Course loaded: ${!!course}, Tutor profile loaded: ${!!tutorProfile} (Tutor ID: ${course?.tutor_id}), Date selected: ${!!selectedFullDate}, Time slot selected: ${!!selectedSlot}`
      );
    }
  };
  
  useEffect(() => {
    if (selectedFullDate) {
      const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][selectedFullDate.getDay()];
      const slotsForDay = availabilitySlots.filter(slot => slot.day_of_week === dayOfWeek);
      // Sort slots by start_time
      slotsForDay.sort((a, b) => a.start_time.localeCompare(b.start_time));
      setTimeSlotsForSelectedDate(slotsForDay);
      setSelectedSlot(null); // Reset selected slot when date changes
    } else {
      setTimeSlotsForSelectedDate([]);
    }
  }, [selectedFullDate, availabilitySlots]);

  if (isLoading) {
    return <View style={styles.container}><Text style={styles.loadingText}>Loading course details...</Text></View>;
  }

  if (!course) {
    return <View style={styles.container}><Text style={styles.loadingText}>Course not found.</Text></View>;
  }

  // Determine if the button should be disabled
  const isButtonDisabled = 
    !selectedFullDate || 
    !selectedSlot || 
    !course || 
    !tutorProfile || 
    isLoading ||
    (authProfile?.role === 'tutor' && authUser?.id === course?.tutor_id);

  // Use actual fetched data for display
  const displayData = {
    name: tutorProfile?.full_name || 'Tutor Name',
    title: course.title || 'Course Title',
    rating: 4.8, // Mock, replace if available
    reviews: 93, // Mock, replace if available
    location: 'Qatar', // Mock, replace if available
    education: tutorProfile?.education || 'N/A',
    languages: ['Arabic', 'English'], // Mock, replace if available
    price: course.price,
    subjects: [subjectName],
    image: course.cover_image_url || tutorProfile?.avatar_public_url || 'https://via.placeholder.com/120' // Use avatar_public_url
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        {/* <View style={styles.badge}>
          <Text style={styles.badgeText}>Top Rated!</Text>
        </View> */}
      </View>

      <View style={styles.tutorInfo}>
        <Image source={{ uri: displayData.image }} style={styles.tutorImage} />
        <Text style={styles.tutorName}>{displayData.name}</Text>
        <Text style={styles.tutorTitle}>{displayData.title}</Text>
        
        <View style={styles.ratingContainer}>
          <Star size={16} color="#FFB800" fill="#FFB800" />
          <Text style={styles.rating}>{displayData.rating}</Text>
          <Text style={styles.reviews}>({displayData.reviews} reviews)</Text>
        </View>

        <View style={styles.tags}>
          {displayData.subjects.map((subject, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{subject}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoRow}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.infoText}>{displayData.location}</Text>
        </View>

        <View style={styles.infoRow}>
          <GraduationCap size={16} color="#6B7280" />
          <Text style={styles.infoText}>{displayData.education}</Text>
        </View>

        {/* <View style={styles.infoRow}>
          <Languages size={16} color="#6B7280" />
          <Text style={styles.infoText}>{displayData.languages.join(', ')}</Text>
        </View> */}

        <Text style={styles.price}>QAR {displayData.price} / hour</Text>
      </View>

      <View style={styles.bookingSection}>
        <Text style={styles.sectionTitle}>Book a Session</Text>
        <Text style={styles.sectionSubtitle}>Select a date and time that works for you</Text>

        <Text style={styles.label}>1. Select a Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateSelectionScroll}>
          {datesForSelection.length > 0 ? datesForSelection.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateButton, 
                selectedFullDate?.toDateString() === item.date.toDateString() && styles.selectedDate
              ]}
              onPress={() => {
                setSelectedFullDate(item.date);
                setSelectedSlot(null); // Reset time slot when date changes
              }}
            >
              <Text style={[
                styles.dateText, 
                selectedFullDate?.toDateString() === item.date.toDateString() && styles.selectedDateText
              ]}>
                {item.display.split(', ')[0]} {/* Day, e.g., Tue */}
              </Text>
              <Text style={[
                styles.dateTextSmall,
                selectedFullDate?.toDateString() === item.date.toDateString() && styles.selectedDateText
              ]}>
                {item.display.split(', ')[1]} {/* Date, e.g., Apr 1 */}
              </Text>
            </TouchableOpacity>
          )) : <Text style={styles.noAvailabilityText}>No available dates found.</Text>}
        </ScrollView>

        {selectedFullDate && (
          <>
            <Text style={styles.label}>2. Select a Time Slot</Text>
            <View style={styles.timeSelection}>
              {timeSlotsForSelectedDate.length > 0 ? timeSlotsForSelectedDate.map((slot, index) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeButton, 
                    selectedSlot?.id === slot.id && styles.selectedTime
                  ]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[
                    styles.timeText, 
                    selectedSlot?.id === slot.id && styles.selectedTimeText
                  ]}>
                    {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}
                  </Text>
                </TouchableOpacity>
              )) : <Text style={styles.noAvailabilityText}>No time slots available for this date.</Text>}
            </View>
          </>
        )}

        <TouchableOpacity 
          style={[
            styles.continueButton, 
            isButtonDisabled && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={isButtonDisabled}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    color: '#D97706',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  tutorInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  tutorImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  tutorName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 4,
  },
  tutorTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rating: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 4,
  },
  reviews: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  tags: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4F46E5',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#059669',
    marginTop: 16,
  },
  bookingSection: {
    padding: 24,
    marginTop: 24,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  dateSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedDate: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  dateText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1F2937',
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  timeSelection: {
    gap: 12,
    marginBottom: 32,
  },
  timeButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedTime: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  timeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
  },
  selectedTimeText: {
    color: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  continueButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6B7280',
  },
  dateSelectionScroll: {
    paddingVertical: 8, // Add some padding for the scroll content
    marginBottom: 24,
  },
  dateTextSmall: {
    fontFamily: 'Inter_400Regular', // Different font for smaller text
    fontSize: 12,
    textAlign: 'center', // Center the smaller date part
    // color will be inherited or set by selectedDateText
  },
  noAvailabilityText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  }
});
