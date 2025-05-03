import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Star, GraduationCap, MapPin } from 'lucide-react-native';
import FavoriteButton from '../components/FavoriteButton';

// This would come from your global state management in a real app
const tutors = [
  {
    id: 1,
    name: 'Dr. Sarah Ahmed',
    subject: 'Mathematics',
    rating: 4.9,
    reviews: 128,
    price: 250,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
    expertise: 'Calculus',
    location: 'Qatar University',
  },
  {
    id: 2,
    name: 'Prof. Mohammed Ali',
    subject: 'Physics',
    rating: 4.8,
    reviews: 96,
    price: 280,
    image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=800&auto=format&fit=crop',
    expertise: 'Quantum Mechanics',
    location: 'Education City',
  },
];

export default function FavoriteTutorsScreen() {
  const handleBookSession = (tutorId: number) => {
    router.push(`/book-session/${tutorId}`);
  };

  const handleFavoriteToggle = (tutorId: number, isFavorited: boolean) => {
    // In a real app, this would update your global state/storage
    console.log('Toggle favorite:', tutorId, isFavorited);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Favorite Tutors</Text>
      </View>

      {tutors.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Favorite Tutors Yet</Text>
          <Text style={styles.emptyStateText}>
            When you find tutors you like, tap the favorite button to save them here
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.exploreButtonText}>Explore Tutors</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.tutorsGrid}>
          {tutors.map((tutor) => (
            <View key={tutor.id} style={styles.tutorCard}>
              <Image source={{ uri: tutor.image }} style={styles.tutorImage} />
              <View style={styles.tutorInfo}>
                <View style={styles.tutorHeader}>
                  <View style={styles.tutorHeaderLeft}>
                    <Text style={styles.tutorName}>{tutor.name}</Text>
                    <View style={styles.ratingContainer}>
                      <Star size={16} color="#FFB800" fill="#FFB800" />
                      <Text style={styles.ratingText}>{tutor.rating}</Text>
                      <Text style={styles.reviewCount}>({tutor.reviews} reviews)</Text>
                    </View>
                  </View>
                  <FavoriteButton
                    tutorId={tutor.id}
                    initialFavorited={true}
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
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#1F2937',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  exploreButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  tutorsGrid: {
    padding: 16,
    gap: 16,
  },
  tutorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tutorImage: {
    width: '100%',
    height: 200,
  },
  tutorInfo: {
    padding: 16,
  },
  tutorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tutorHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  tutorName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#1F2937',
  },
  reviewCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  tutorSubject: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#3B82F6',
    marginBottom: 12,
  },
  tutorMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#1F2937',
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
  },
  bookButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});