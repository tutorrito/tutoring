import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Clock, Star, Users, Wallet, ChevronRight } from 'lucide-react-native';

const benefits = [
  {
    id: 1,
    title: 'Flexible Schedule',
    description: 'Choose your own hours and teach when it suits you best',
    icon: Clock,
  },
  {
    id: 2,
    title: 'Competitive Earnings',
    description: 'Earn 150 QAR per hour (200 QAR session fee with 50 QAR platform fee)',
    icon: Wallet,
  },
  {
    id: 3,
    title: 'Growing Community',
    description: 'Join a network of passionate educators and learners',
    icon: Users,
  },
  {
    id: 4,
    title: 'Build Your Reputation',
    description: 'Earn reviews and ratings from your students',
    icon: Star,
  },
];

const features = [
  {
    id: 1,
    title: 'Dedicated Support',
    description: 'Our team is here to help you succeed every step of the way',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2940&auto=format&fit=crop'
  },
  {
    id: 2,
    title: 'Smart Tools',
    description: 'Access our suite of teaching tools and resources',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2940&auto=format&fit=crop'
  },
  {
    id: 3,
    title: 'Safety First',
    description: 'We verify all students and ensure a safe teaching environment',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2940&auto=format&fit=crop'
  },
];

export default function BecomeTutorScreen() {
  const handleStartApplication = () => {
    router.push('/tutor-application');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?q=80&w=2940&auto=format&fit=crop' }}
          style={styles.heroImage}
        />
        <View style={styles.overlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Share Your Knowledge</Text>
          <Text style={styles.heroSubtitle}>
            Join Tutorrito and make a difference in students' lives while earning competitive rates
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>500+</Text>
            <Text style={styles.statLabel}>Active Tutors</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5000+</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>95%</Text>
            <Text style={styles.statLabel}>Satisfaction</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Why Choose Tutorrito?</Text>
        <View style={styles.benefitsGrid}>
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <View key={benefit.id} style={styles.benefitCard}>
                <Icon size={32} color="#047857" />
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.featuresSection}>
          {features.map((feature) => (
            <View key={feature.id} style={styles.featureCard}>
              <Image source={{ uri: feature.image }} style={styles.featureImage} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Start Teaching?</Text>
          <Text style={styles.ctaText}>
            Join our community of educators and start making a difference today
          </Text>
          <TouchableOpacity style={styles.applyButton} onPress={handleStartApplication}>
            <Text style={styles.applyButtonText}>Apply Now</Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
    height: 400,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 120, 87, 0.7)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 28,
  },
  content: {
    padding: 24,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -60,
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#047857',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 24,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  benefitCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  benefitTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  benefitDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureImage: {
    width: '100%',
    height: 200,
  },
  featureContent: {
    padding: 20,
  },
  featureTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 8,
  },
  featureDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  ctaSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: '#1F2937',
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
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#047857',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  applyButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 8,
  },
});