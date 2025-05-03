import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Search, GraduationCap, Star, Users, ArrowRight, Clock, Shield } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const features = [
  {
    icon: Search,
    title: 'Find Expert Tutors',
    description: 'Connect with qualified tutors in your area',
  },
  {
    icon: GraduationCap,
    title: 'Quality Education',
    description: 'Learn from experienced educators',
  },
  {
    icon: Star,
    title: 'Verified Profiles',
    description: 'All tutors are thoroughly vetted',
  },
  {
    icon: Users,
    title: 'Personalized Learning',
    description: 'One-on-one sessions tailored to you',
  },
];

const popularSubjects = [
  {
    name: 'Mathematics',
    image: 'https://images.pexels.com/photos/3729557/pexels-photo-3729557.jpeg',
    count: '250+ Tutors',
  },
  {
    name: 'Physics',
    image: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg',
    count: '180+ Tutors',
  },
  {
    name: 'Chemistry',
    image: 'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg',
    count: '200+ Tutors',
  },
  {
    name: 'Biology',
    image: 'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg',
    count: '150+ Tutors',
  },
];

const featuredTutors = [
  {
    id: 1,
    name: 'Dr. Sarah Ahmed',
    subject: 'Mathematics',
    rating: 4.9,
    reviews: 128,
    image: 'https://images.pexels.com/photos/5212324/pexels-photo-5212324.jpeg',
    badges: ['Top Rated', 'PhD'],
  },
  {
    id: 2,
    name: 'Prof. Mohammed Ali',
    subject: 'Physics',
    rating: 4.8,
    reviews: 96,
    image: 'https://images.pexels.com/photos/5212317/pexels-photo-5212317.jpeg',
    badges: ['Expert', 'University Professor'],
  },
];

export default function HomeScreen() {
  const { profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4F46E5']}
          tintColor="#4F46E5"
        />
      }
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg' }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.welcomeText}>
            Welcome{profile ? `, ${profile.full_name.split(' ')[0]}` : ''}!
          </Text>
          <Text style={styles.heroTitle}>Find Your Perfect Tutor</Text>
          <Text style={styles.heroSubtitle}>
            Connect with expert tutors and achieve your academic goals
          </Text>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Search size={20} color="#FFFFFF" />
            <Text style={styles.searchButtonText}>Find a Tutor</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>500+</Text>
          <Text style={styles.statLabel}>Expert Tutors</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>5000+</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>95%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>
      </View>

      {/* Popular Subjects Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Subjects</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <ArrowRight size={16} color="#4F46E5" />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subjectsContainer}
        >
          {popularSubjects.map((subject, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.subjectCard}
              onPress={() => router.push({
                pathname: '/(tabs)/search',
                params: { subject: subject.name }
              })}
            >
              <Image source={{ uri: subject.image }} style={styles.subjectImage} />
              <View style={styles.subjectOverlay} />
              <View style={styles.subjectContent}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={styles.subjectCount}>{subject.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Tutors Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Tutors</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <ArrowRight size={16} color="#4F46E5" />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tutorsContainer}
        >
          {featuredTutors.map((tutor) => (
            <TouchableOpacity 
              key={tutor.id}
              style={styles.tutorCard}
              onPress={() => router.push(`/tutor/${tutor.id}`)}
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
                  <Text style={styles.ratingText}>{tutor.rating}</Text>
                  <Text style={styles.reviewCount}>({tutor.reviews} reviews)</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Why Choose Us Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose Tutorrito?</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <View key={index} style={styles.featureCard}>
                <Icon size={32} color="#4F46E5" />
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Trust Indicators */}
      <View style={styles.trustSection}>
        <View style={styles.trustItem}>
          <Clock size={24} color="#4F46E5" />
          <Text style={styles.trustTitle}>Flexible Scheduling</Text>
          <Text style={styles.trustText}>Book sessions at your convenience</Text>
        </View>
        <View style={styles.trustItem}>
          <Shield size={24} color="#4F46E5" />
          <Text style={styles.trustTitle}>Safe & Secure</Text>
          <Text style={styles.trustText}>Verified tutors and secure payments</Text>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Start Learning?</Text>
        <Text style={styles.ctaText}>
          Join thousands of students achieving their academic goals with Tutorrito
        </Text>
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Text style={styles.ctaButtonText}>Find a Tutor Now</Text>
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
  hero: {
    height: 500,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
  },
  welcomeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#E5E7EB',
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 40,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#E5E7EB',
    marginBottom: 24,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  searchButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F9FAFB',
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#111827',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4F46E5',
  },
  subjectsContainer: {
    paddingRight: 24,
    gap: 16,
  },
  subjectCard: {
    width: 280,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  subjectImage: {
    width: '100%',
    height: '100%',
  },
  subjectOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
  },
  subjectContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  subjectName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subjectCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#E5E7EB',
  },
  tutorsContainer: {
    paddingRight: 24,
    gap: 16,
  },
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
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  featureCard: {
    width: '47%',
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 16,
  },
  featureTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  featureDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: '#F3F4F6',
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  trustTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  trustText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  ctaSection: {
    margin: 24,
    padding: 32,
    backgroundColor: '#EEF2FF',
    borderRadius: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});