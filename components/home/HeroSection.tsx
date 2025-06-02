import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth'; // Assuming Profile type is exported from useAuth or a types file

interface HeroSectionProps {
  // If profile is passed as a prop, define its type here
  // For now, we'll use useAuth directly within this component
}

const HeroSection: React.FC<HeroSectionProps> = () => {
  const { profile } = useAuth();

  return (
    <View style={styles.hero}>
      <Image
        source={{ uri: 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg' }}
        style={styles.heroImage}
      />
      <View style={styles.heroOverlay} />
      <View style={styles.heroContent}>
        <Text style={styles.welcomeText}>
          Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
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
  );
};

const styles = StyleSheet.create({
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
});

export default HeroSection;
