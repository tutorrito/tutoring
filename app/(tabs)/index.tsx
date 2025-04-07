import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { GraduationCap, Star, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import BookingModal from '../../components/BookingModal';
import FavoriteButton from '../../components/FavoriteButton';
import { useAuth } from '@/hooks/useAuth';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

const categories = [
  {
    id: 1,
    name: 'Mathematics',
    icon: '📐'
  },
  {
    id: 2,
    name: 'Physics',
    icon: '⚡'
  },
  {
    id: 3,
    name: 'Chemistry',
    icon: '🧪'
  },
  {
    id: 4,
    name: 'Biology',
    icon: '🧬'
  },
  {
    id: 5,
    name: 'Computer Science',
    icon: '💻'
  },
  {
    id: 6,
    name: 'Languages',
    icon: '🗣️'
  }
];

const tutors = [
  {
    id: 1,
    name: 'Dr. Sarah Ahmed',
    subject: 'Mathematics',
    rating: 4.9,
    reviews: 128,
    price: 200,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
    expertise: 'Calculus',
    location: 'Qatar University',
  },
  {
    id: 2,
    name: 'Prof. Mohammed Ali',
    subject: 'Physics',
    rating: 4.8,
    reviews: 96,
    price: 200,
    image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=800',
    expertise: 'Quantum Mechanics',
    location: 'Education City',
  },
  {
    id: 3,
    name: 'Ms. Fatima Hassan',
    subject: 'Chemistry',
    rating: 4.7,
    reviews: 84,
    price: 200,
    image: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=800&auto=format&fit=crop',
    expertise: 'Organic Chemistry',
    location: 'Qatar National Library',
  },
  {
    id: 4,
    name: 'Dr. Ahmed Khan',
    subject: 'Mathematics',
    rating: 4.9,
    reviews: 112,
    price: 200,
    image: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?q=80&w=800&auto=format&fit=crop',
    expertise: 'Linear Algebra',
    location: 'Education City',
  },
  {
    id: 5,
    name: 'Prof. Layla Mohammed',
    subject: 'Biology',
    rating: 4.8,
    reviews: 76,
    price: 200,
    image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?q=80&w=800&auto=format&fit=crop',
    expertise: 'Molecular Biology',
    location: 'Qatar University',
  }
];

export default function HomeScreen() {
  const { profile } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<string>('');
  const [favoriteTutors, setFavoriteTutors] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const navigateToProfile = () => {
    router.push('/(tabs)/profile');
  };

  const handleBookSession = (tutorId: number) => {
    router.push(`/book-session/${tutorId}`);
  };

  const handleFavoriteToggle = (tutorId: number, isFavorited: boolean) => {
    setFavoriteTutors(prev => 
      isFavorited 
        ? [...prev, tutorId]
        : prev.filter(id => id !== tutorId)
    );
  };

  const handleCategoryPress = (categoryName: string) => {
    setSelectedCategory(prevCategory => 
      prevCategory === categoryName ? null : categoryName
    );
  };

  const filteredTutors = selectedCategory
    ? tutors.filter(tutor => tutor.subject === selectedCategory)
    : tutors;

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning 👋</Text>
          <Text style={styles.name}>{profile.full_name}</Text>
        </View>
        <TouchableOpacity onPress={navigateToProfile}>
          {profile.avatar_url ? (
            <Image 
              source={{ uri: profile.avatar_url }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
              <Text style={styles.profileImagePlaceholderText}>
                {profile.full_name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Popular Categories</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity 
            key={category.id} 
            style={[
              styles.categoryCard,
              selectedCategory === category.name && styles.categoryCardActive
            ]}
            onPress={() => handleCategoryPress(category.name)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryName,
              selectedCategory === category.name && styles.categoryNameActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.featuredSection}>
        <Text style={styles.sectionTitle}>
          {selectedCategory ? `${selectedCategory} Tutors` : 'Featured Tutors'}
        </Text>
        {filteredTutors.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No tutors found</Text>
            <Text style={styles.emptyStateMessage}>
              There are currently no tutors available for {selectedCategory}
            </Text>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={styles.resetButtonText}>Show all tutors</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tutorsContainer}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + 20}
            snapToAlignment="center"
          >
            {filteredTutors.map((tutor) => (
              <View key={tutor.id} style={[styles.tutorCard, { width: CARD_WIDTH }]}>
                <Image source={{ uri: tutor.image }} style={styles.tutorImage} />
                <View style={styles.tutorOverlay}>
                  <View style={styles.tutorInfo}>
                    <View style={styles.tutorHeader}>
                      <View style={styles.tutorHeaderLeft}>
                        <Text style={styles.tutorName}>{tutor.name}</Text>
                        <View style={styles.ratingContainer}>
                          <Star size={16} color="#FFB800" fill="#FFB800" />
                          <Text style={styles.ratingText}>{tutor.rating}</Text>
                        </View>
                      </View>
                      <FavoriteButton
                        tutorId={tutor.id}
                        initialFavorited={favoriteTutors.includes(tutor.id)}
                        onToggle={(isFavorited) => handleFavoriteToggle(tutor.id, isFavorited)}
                      />
                    </View>
                    <Text style={styles.tutorSubject}>{tutor.subject}</Text>
                    <View style={styles.tutorMeta}>
                      <View style={styles.metaItem}>
                        <GraduationCap size={16} color="#64748B" />
                        <Text style={styles.metaText}>{tutor.expertise}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MapPin size={16} color="#64748B" />
                        <Text style={styles.metaText}>{tutor.location}</Text>
                      </View>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>{tutor.price} QAR</Text>
                      <Text style={styles.priceUnit}>/hour</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.bookButton}
                      onPress={() => handleBookSession(tutor.id)}
                    >
                      <Text style={styles.bookButtonText}>Book Session</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <BookingModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        tutorName={selectedTutor}
      />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748B',
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1E293B',
    marginTop: 4,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  profileImagePlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#9CA3AF',
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1E293B',
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: 100,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryCardActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1E293B',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#4F46E5',
    fontFamily: 'Inter_600SemiBold',
  },
  featuredSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  resetButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4F46E5',
  },
  tutorsContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  tutorCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  tutorImage: {
    width: '100%',
    height: 400,
  },
  tutorOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  tutorInfo: {
    gap: 8,
  },
  tutorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tutorHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  tutorName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1E293B',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1E293B',
  },
  tutorSubject: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#3B82F6',
  },
  tutorMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748B',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
  },
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1E293B',
  },
  priceUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  bookButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  bookButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});