import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { Star } from 'lucide-react-native';

export interface Tutor {
  id: number; // Assuming id is a number, adjust if it's a string (UUID)
  name: string;
  subject: string;
  rating: number;
  reviews: number;
  image: string;
  badges: string[];
}

interface TutorCardProps {
  tutor: Tutor;
}

const TutorCard: React.FC<TutorCardProps> = ({ tutor }) => {
  return (
    <TouchableOpacity
      style={styles.tutorCard}
      onPress={() => router.push(`/tutor/${tutor.id}` as any)} // Adjust route if necessary
    >
      <Image source={{ uri: tutor.image }} style={styles.tutorImage} />
      <View style={styles.tutorInfo}>
        <Text style={styles.tutorName}>{tutor.name}</Text>
        <Text style={styles.tutorSubject}>{tutor.subject}</Text>
        <View style={styles.tutorBadges}>
          {tutor.badges.map((badge, index) => (
            <View key={index} style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ))}
        </View>
        <View style={styles.tutorRating}>
          <Star size={16} color="#FFB800" fill="#FFB800" />
          <Text style={styles.ratingText}>{tutor.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({tutor.reviews} reviews)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tutorCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
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
    color: '#111827',
    marginBottom: 4,
  },
  tutorSubject: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4F46E5',
    marginBottom: 8,
  },
  tutorBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow badges to wrap
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#4F46E5',
  },
  tutorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#111827',
  },
  reviewCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
});

export default TutorCard;
