import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

const CTASection: React.FC = () => {
  return (
    <View style={styles.ctaSection}>
      <Text style={styles.ctaTitle}>Ready to Start Learning?</Text>
      <Text style={styles.ctaText}>
        Join thousands of students achieving their academic goals with Tutorrito
      </Text>
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => router.push('/(tabs)/search' as any)} // Cast for type safety with Expo Router
      >
        <Text style={styles.ctaButtonText}>Find a Tutor Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  ctaSection: {
    marginHorizontal: 24, // Match section padding
    marginTop: 16, // Space from previous section
    marginBottom: 32, // Space at the bottom of the scroll view
    padding: 32,
    backgroundColor: '#EEF2FF', // Light purple background
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
    backgroundColor: '#4F46E5', // Primary button color
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

export default CTASection;
