import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Search as SearchIcon, Filter, GraduationCap, Star, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Image } from 'react-native';
import { router } from 'expo-router';

// Define education levels
const educationLevels = [
  'Primary School',
  'Middle School',
  'High School',
  'University',
  'Professional'
];

// Define subjects with their icons
const subjects = [
  { name: 'Mathematics', icon: '📐' },
  { name: 'Physics', icon: '⚡' },
  { name: 'Chemistry', icon: '🧪' },
  { name: 'Biology', icon: '🧬' },
  { name: 'Computer Science', icon: '💻' },
  { name: 'English', icon: '📚' },
  { name: 'Arabic', icon: '🗣️' }
];

// Mock tutors data with education levels
const tutors = [
  {
    id: 1,
    name: 'Dr. Sarah Ahmed',
    subject: 'Mathematics',
    educationLevels: ['High School', 'University'],
    rating: 4.9,
    reviews: 128,
    location: 'Qatar University',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
    price: 200,
  },
  {
    id: 2,
    name: 'Prof. Mohammed Ali',
    subject: 'Physics',
    educationLevels: ['High School', 'University'],
    rating: 4.8,
    reviews: 96,
    location: 'Education City',
    image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=800&auto=format&fit=crop',
    price: 200,
  },
  {
    id: 3,
    name: 'Ms. Fatima Hassan',
    subject: 'Chemistry',
    educationLevels: ['Middle School', 'High School'],
    rating: 4.7,
    reviews: 84,
    location: 'Qatar National Library',
    image: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=800&auto=format&fit=crop',
    price: 200,
  },
];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const handleBookSession = (tutorId: number) => {
    router.push(`/book-session/${tutorId}`);
  };

  // Filter tutors based on search query, selected subject, and education level
  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = searchQuery === '' || 
      tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = !selectedSubject || tutor.subject === selectedSubject;
    const matchesLevel = !selectedLevel || tutor.educationLevels.includes(selectedLevel);

    return matchesSearch && matchesSubject && matchesLevel;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Tutors</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <SearchIcon size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by subject, tutor name..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Subjects</Text>
        <View style={styles.tagsContainer}>
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject.name}
              style={[
                styles.tag,
                selectedSubject === subject.name && styles.tagSelected
              ]}
              onPress={() => setSelectedSubject(
                selectedSubject === subject.name ? null : subject.name
              )}
            >
              <Text style={styles.tagIcon}>{subject.icon}</Text>
              <Text style={[
                styles.tagText,
                selectedSubject === subject.name && styles.tagTextSelected
              ]}>
                {subject.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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

        <Text style={styles.sectionTitle}>Available Tutors</Text>
        <View style={styles.tutorsContainer}>
          {filteredTutors.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No tutors found</Text>
              <Text style={styles.emptyStateText}>
                Try adjusting your filters or search query
              </Text>
            </View>
          ) : (
            filteredTutors.map((tutor) => (
              <View key={tutor.id} style={styles.tutorCard}>
                <Image source={{ uri: tutor.image }} style={styles.tutorImage} />
                <View style={styles.tutorInfo}>
                  <Text style={styles.tutorName}>{tutor.name}</Text>
                  <Text style={styles.tutorSubject}>{tutor.subject}</Text>
                  
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

                  <View style={styles.educationLevels}>
                    {tutor.educationLevels.map((level) => (
                      <View key={level} style={styles.levelBadge}>
                        <GraduationCap size={14} color="#4F46E5" />
                        <Text style={styles.levelBadgeText}>{level}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.price}>{tutor.price} QAR/hr</Text>
                    <TouchableOpacity 
                      style={styles.bookButton}
                      onPress={() => handleBookSession(tutor.id)}
                    >
                      <Text style={styles.bookButtonText}>Book Session</Text>
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
  header: {
    padding: 24,
    paddingTop: 60,
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
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    marginLeft: 12,
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  tagIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  tagTextSelected: {
    color: '#4F46E5',
  },
  levelTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  levelTagSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  levelTagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  levelTagTextSelected: {
    color: '#4F46E5',
  },
  tutorsContainer: {
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  tutorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tutorImage: {
    width: '100%',
    height: 200,
  },
  tutorInfo: {
    padding: 16,
  },
  tutorName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 4,
  },
  tutorSubject: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#4F46E5',
    marginBottom: 12,
  },
  tutorMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#1F2937',
  },
  reviews: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  educationLevels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  levelBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#4F46E5',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#059669',
  },
  bookButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});