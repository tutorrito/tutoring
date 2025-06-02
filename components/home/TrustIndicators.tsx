import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, Shield } from 'lucide-react-native';

// TODO: This data could also be fetched or made more dynamic
const trustData = [
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    text: 'Book sessions at your convenience',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    text: 'Verified tutors and secure payments',
  },
];

const TrustIndicators: React.FC = () => {
  return (
    <View style={styles.trustSection}>
      {trustData.map((item, index) => {
        const Icon = item.icon;
        return (
          <View key={index} style={styles.trustItem}>
            <Icon size={24} color="#4F46E5" />
            <Text style={styles.trustTitle}>{item.title}</Text>
            <Text style={styles.trustText}>{item.text}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Or 'space-around' if more items
    paddingHorizontal: 24, // Match section padding
    paddingVertical: 24,   // Match section padding
    backgroundColor: '#F3F4F6', // Light background for this section
  },
  trustItem: {
    flex: 1, // Each item takes equal space
    alignItems: 'center',
    paddingHorizontal: 8, // Add some horizontal padding between items
  },
  trustTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  trustText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default TrustIndicators;
