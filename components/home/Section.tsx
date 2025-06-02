import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  seeAllLink?: string | (() => void); // Optional: path for "See All" or a custom function
  seeAllParams?: Record<string, any>; // Optional: params for "See All" link
  hideSeeAll?: boolean; // Optional: to hide "See All" button
}

const Section: React.FC<SectionProps> = ({ title, children, seeAllLink, seeAllParams, hideSeeAll }) => {
  const handleSeeAllPress = () => {
    if (typeof seeAllLink === 'function') {
      seeAllLink();
    } else if (typeof seeAllLink === 'string') {
      router.push({ pathname: seeAllLink as any, params: seeAllParams });
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!hideSeeAll && seeAllLink && (
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={handleSeeAllPress}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <ArrowRight size={16} color="#4F46E5" />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24, // Keep horizontal padding
    paddingVertical: 16, // Adjust vertical padding as needed
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
});

export default Section;
