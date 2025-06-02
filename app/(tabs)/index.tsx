import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl } from 'react-native'; // Removed Image
import { router } from 'expo-router';
import { Search, GraduationCap, Star, Users, ArrowRight, Clock, Shield } from 'lucide-react-native'; // Search is used in HeroSection
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import SubjectCard, { Subject } from '@/components/home/SubjectCard';
import TutorCard, { Tutor } from '@/components/home/TutorCard';
import FeatureCard, { Feature } from '@/components/home/FeatureCard';
import HeroSection from '@/components/home/HeroSection';
import StatsSection from '@/components/home/StatsSection';
import Section from '@/components/home/Section';
import TrustIndicators from '@/components/home/TrustIndicators';
import CTASection from '@/components/home/CTASection'; // Import CTASection

// TODO: Fetch this data from an API
const features: Feature[] = [
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

// TODO: Fetch this data from an API
const popularSubjects: Subject[] = [
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

// TODO: Fetch this data from an API
const featuredTutors: Tutor[] = [
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
  // const { profile } = useAuth(); // profile is now used within HeroSection
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
      <HeroSection />

      {/* Stats Section */}
      <StatsSection />

      {/* Popular Subjects Section */}
      <Section title="Popular Subjects" seeAllLink="/(tabs)/search">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContainer}
        >
          {popularSubjects.map((subject, index) => (
            <SubjectCard key={index} subject={subject} />
          ))}
        </ScrollView>
      </Section>

      {/* Featured Tutors Section */}
      <Section title="Featured Tutors" seeAllLink="/(tabs)/search">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContainer}
        >
          {featuredTutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </ScrollView>
      </Section>

      {/* Why Choose Us Section */}
      <Section title="Why Choose Tutorrito?" hideSeeAll={true}>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </View>
      </Section>

      {/* Trust Indicators */}
      <TrustIndicators />

      {/* CTA Section */}
      <CTASection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Styles for hero, heroImage, heroOverlay, heroContent, welcomeText, heroTitle, heroSubtitle, searchButton, searchButtonText
  // are now in components/home/HeroSection.tsx and can be removed.

  // Styles for statsContainer, statItem, statNumber, statLabel, statDivider
  // are now in components/home/StatsSection.tsx and can be removed.

  // Styles for section, sectionHeader, sectionTitle, seeAllButton, seeAllText
  // are now in components/home/Section.tsx and can be removed.
  // Individual sections might still need padding if not handled by the Section component's style.
  // The Section component uses paddingHorizontal: 24, paddingVertical: 16.

  horizontalScrollContainer: {
    paddingRight: 24, // Keep padding for the last item
    gap: 16,
  },
  // Styles for subjectCard, subjectImage, subjectOverlay, subjectContent, subjectName, subjectCount
  // are now in components/home/SubjectCard.tsx and can be removed.

  // Styles for tutorCard, tutorImage, tutorInfo, tutorName, tutorSubject, tutorBadges, badge, badgeText, tutorRating, ratingText, reviewCount
  // are now in components/home/TutorCard.tsx and can be removed.

  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Distribute items evenly
    marginTop: 16,
    // gap: 16, // Gap is handled by FeatureCard's marginBottom and width
  },
  // Styles for featureCard, featureTitle, featureDescription
  // are now in components/home/FeatureCard.tsx and can be removed.

  // Styles for trustSection, trustItem, trustTitle, trustText
  // are now in components/home/TrustIndicators.tsx and can be removed.

  // Styles for ctaSection, ctaTitle, ctaText, ctaButton, ctaButtonText
  // are now in components/home/CTASection.tsx and can be removed.
});
