import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Search as SearchIcon, Filter, GraduationCap, Star, MapPin, BookOpen } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Image } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase'; // Import Supabase client

// Define types
type Subject = {
  id: string;
  name: string;
  // icon?: string; // Optional: if you want to store icons in DB or map them
};

type Profile = {
  id: string;
  full_name: string | null;
  profile_images?: { image_path: string }[] | null; // Updated to fetch profile images
  // Add other profile fields if needed for display (e.g., rating, location - though these are not on course directly)
};

type Course = {
  id: string;
  tutor_id: string;
  title: string;
  description: string | null;
  subject_id: string;
  price: number;
  cover_image_url: string | null;
  created_at: string;
  // Joined data
  subject_name?: string;
  tutor_name?: string | null;
  tutor_avatar_url?: string | null;
};

// Mock subjects with icons - these could be fetched or enhanced from DB data
const subjectIcons: { [key: string]: string } = {
  'Mathematics': '📐',
  'Physics': '⚡',
  'Chemistry': '🧪',
  'Biology': '🧬',
  'Computer Science': '💻',
  'English': '📚',
  'Arabic': '🗣️',
  // Add more as needed
};


export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  // const [selectedLevel, setSelectedLevel] = useState<string | null>(null); // Education level filter removed for now

  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('id, name');
        if (subjectsError) throw subjectsError;
        setAllSubjects(subjectsData || []);

        // Fetch courses with tutor and subject information
        // This query can be complex. Let's fetch courses and then enrich them.
        // A more optimized way would be to use a Supabase View or RPC function.
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            id,
            tutor_id,
            title,
            description,
            subject_id,
            price,
            cover_image_url,
            created_at,
            profiles (full_name, profile_images (image_path)),
            subjects (name)
          `)
          .order('created_at', { ascending: false });

        if (coursesError) {
          console.error('Supabase error fetching courses:', JSON.stringify(coursesError, null, 2));
          throw coursesError;
        }
        
        console.log('Fetched coursesData:', JSON.stringify(coursesData, null, 2));

        const enrichedCourses = (coursesData || []).map((course: any) => {
          let avatarUrl = null;
          const imagePath = course.profiles?.profile_images?.[0]?.image_path;
          if (imagePath) {
            // The storage bucket for profile images is 'avatars'
            const publicUrlResult = supabase.storage.from('avatars').getPublicUrl(imagePath);
            console.log(`Public URL result for ${imagePath}:`, JSON.stringify(publicUrlResult, null, 2));
            avatarUrl = publicUrlResult.data?.publicUrl || null;
            if (!avatarUrl) {
              console.warn(`Could not retrieve public URL for image path: ${imagePath}`);
            }
          }
          return {
            ...course,
            subject_name: course.subjects?.name || 'Unknown Subject',
            tutor_name: course.profiles?.full_name,
            tutor_avatar_url: avatarUrl,
          };
        });
        
        console.log('Enriched courses:', JSON.stringify(enrichedCourses, null, 2));
        setAllCourses(enrichedCourses as Course[]);

      } catch (error: any) {
        console.error('Error in fetchData (search.tsx):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        Alert.alert('Error', `Failed to load data for search. ${error.message || ''}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);


  const handleBookSession = (courseId: string) => {
    // Navigate to the course details page
    router.push(`/course-details/${courseId}` as any);
  };

  // Filter courses based on search query and selected subject
  const filteredCourses = allCourses.filter(course => {
    const matchesSearch = searchQuery === '' ||
      (course.title && course.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course.subject_name && course.subject_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course.tutor_name && course.tutor_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject = !selectedSubjectId || course.subject_id === selectedSubjectId;
    // const matchesLevel = !selectedLevel || (course.educationLevels && course.educationLevels.includes(selectedLevel)); // If educationLevels are added to courses

    return matchesSearch && matchesSubject; // && matchesLevel;
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading Tutors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Courses</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <SearchIcon size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by course, subject, tutor..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {/* <TouchableOpacity style={styles.filterButton}> // Filter button can be re-added later
          <Filter size={20} color="#4F46E5" />
        </TouchableOpacity> */}
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Subjects</Text>
        <View style={styles.tagsContainer}>
          {allSubjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={[
                styles.tag,
                selectedSubjectId === subject.id && styles.tagSelected
              ]}
              onPress={() => setSelectedSubjectId(
                selectedSubjectId === subject.id ? null : subject.id
              )}
            >
              <Text style={styles.tagIcon}>{subjectIcons[subject.name] || '📚'}</Text>
              <Text style={[
                styles.tagText,
                selectedSubjectId === subject.id && styles.tagTextSelected
              ]}>
                {subject.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Education Levels filter removed for now, can be added back if courses have this data
        <Text style={styles.sectionTitle}>Education Levels</Text>
        <View style={styles.tagsContainer}>
          {educationLevels.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.levelTag,
                selectedLevel === level && styles.levelTagSelected
              ]}
              onPress={() => setSelectedLevel(
                selectedLevel === level ? null : level
              )}
            >
              <Text style={[
                styles.levelTagText,
                selectedLevel === level && styles.levelTagTextSelected
              ]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        */}

        <Text style={styles.sectionTitle}>Available Courses</Text>
        <View style={styles.tutorsContainer}> {/* Renamed from tutorsContainer to coursesContainer or similar might be better */}
          {filteredCourses.length === 0 ? (
            <View style={styles.emptyState}>
               <BookOpen size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No courses found</Text>
              <Text style={styles.emptyStateText}>
                Try adjusting your filters or search query. More courses are being added!
              </Text>
            </View>
          ) : (
            filteredCourses.map((course) => (
              <View key={course.id} style={styles.tutorCard}> {/* Re-using tutorCard style, can be renamed to courseCard */}
                <Image 
                  source={(course.cover_image_url && course.cover_image_url.trim() !== '') 
                            ? { uri: course.cover_image_url } 
                            : (course.tutor_avatar_url && course.tutor_avatar_url.trim() !== '' 
                                ? {uri: course.tutor_avatar_url} 
                                : require('@/assets/images/icon.png'))}
                  style={styles.tutorImage} 
                  onError={(e) => console.log(`Failed to load image: ${course.cover_image_url || course.tutor_avatar_url}`, e.nativeEvent.error)}
                />
                <View style={styles.tutorInfo}>
                  <Text style={styles.tutorName}>{course.title}</Text>
                  <Text style={styles.tutorSubject}>{course.subject_name}</Text>
                  {course.tutor_name && <Text style={styles.courseTutorText}>Tutor: {course.tutor_name}</Text>}
                  {course.description && <Text style={styles.courseDescriptionText} numberOfLines={2}>{course.description}</Text>}
                  
                  {/* Meta like rating, reviews, location are not directly on course. Can be added if fetched for tutor */}
                  {/* 
                  <View style={styles.tutorMeta}>
                    <View style={styles.ratingContainer}>
                      <Star size={16} color="#FFB800" fill="#FFB800" />
                      <Text style={styles.rating}>{tutor.rating}</Text>
                      <Text style={styles.reviews}>({tutor.reviews} reviews)</Text>
                    </View>
                    <View style={styles.locationContainer}>
                      <MapPin size={16} color="#6B7280" />
                      <Text style={styles.location}>{tutor.location}</Text>
                    </View>
                  </View>
                  */}

                  {/* Education levels badge removed as it's not on course directly
                  <View style={styles.educationLevels}>
                    {course.educationLevels.map((level) => ( // Assuming course might have educationLevels
                      <View key={level} style={styles.levelBadge}>
                        <GraduationCap size={14} color="#4F46E5" />
                        <Text style={styles.levelBadgeText}>{level}</Text>
                      </View>
                    ))}
                  </View>
                  */}

                  <View style={styles.cardFooter}>
                    <Text style={styles.price}>{course.price} QAR</Text> 
                    <TouchableOpacity 
                      style={styles.bookButton}
                      onPress={() => handleBookSession(course.id)} // Pass course.id
                    >
                      <Text style={styles.bookButtonText}>View Details</Text> 
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#4F46E5',
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 30, // Adjusted padding for status bar
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8, // Adjusted padding for Android
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 10, // Added margin bottom
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1F2937',
    height: Platform.OS === 'ios' ? undefined : 40, // Ensure consistent height on Android
  },
  filterButton: {
    marginLeft: 12,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20, // Only horizontal padding for scrollview content
    paddingBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginTop: 20, // Adjusted margin
    marginBottom: 12, // Adjusted margin
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // marginTop: 8, // Removed, using sectionTitle margin
    gap: 10, // Increased gap
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14, // Adjusted padding
    paddingVertical: 10, // Adjusted padding
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  tagIcon: {
    fontSize: 16, // Keep icon size
    marginRight: 6, // Adjusted margin
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14, // Keep text size
    color: '#6B7280',
  },
  tagTextSelected: {
    color: '#4F46E5',
  },
  // levelTag styles removed as filter is removed for now
  // levelTag: {
  //   backgroundColor: '#F3F4F6',
  //   paddingHorizontal: 16,
  //   paddingVertical: 8,
  //   borderRadius: 20,
  //   borderWidth: 1,
  //   borderColor: '#E5E7EB',
  // },
  // levelTagSelected: {
  //   backgroundColor: '#EEF2FF',
  //   borderColor: '#4F46E5',
  // },
  // levelTagText: {
  //   fontFamily: 'Inter_500Medium',
  //   fontSize: 14,
  //   color: '#6B7280',
  // },
  // levelTagTextSelected: {
  //   color: '#4F46E5',
  // },
  tutorsContainer: { // Consider renaming to coursesContainer if styles diverge
    marginTop: 12, // Adjusted margin
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    padding: 30, // Increased padding
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 20, // Add some top margin
    minHeight: 150, // Ensure it has some height
  },
  emptyStateTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 16, // Add margin for icon
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20, // Improve readability
  },
  tutorCard: { // This style is now for Course Cards
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden', // Keep for image rounding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // Softer shadow
    shadowRadius: 4, // Softer shadow
    elevation: 2, // Softer shadow
  },
  tutorImage: { // This is now Course Image or Tutor Avatar
    width: '100%',
    height: 180, // Slightly reduced height
    backgroundColor: '#E5E7EB', // Background for when image is loading or missing
    resizeMode: 'cover', // Ensures the image covers the area, cropping if necessary
  },
  tutorInfo: { // Course Info
    padding: 16,
  },
  tutorName: { // Course Title
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 4,
  },
  tutorSubject: { // Course Subject Name
    fontFamily: 'Inter_500Medium',
    fontSize: 15, // Slightly smaller
    color: '#4F46E5',
    marginBottom: 6, // Adjusted margin
  },
  courseTutorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  courseDescriptionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  // tutorMeta, ratingContainer, reviews, locationContainer, location styles removed as they are not on course directly
  // educationLevels, levelBadge, levelBadgeText styles removed

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12, // Increased margin
    borderTopWidth: 1, // Add a separator
    borderTopColor: '#F3F4F6',
    paddingTop: 12, // Add padding above footer
  },
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#059669',
  },
  bookButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20, // Increased padding
    paddingVertical: 10, // Increased padding
    borderRadius: 8,
  },
  bookButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
