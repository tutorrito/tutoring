import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeatureCardProps {
  feature: Feature;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
  const Icon = feature.icon;
  return (
    <View style={styles.featureCard}>
      <Icon size={32} color="#4F46E5" />
      <Text style={styles.featureTitle}>{feature.title}</Text>
      <Text style={styles.featureDescription}>{feature.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  featureCard: {
    width: '47%', // Approximately half width for a 2-column layout, adjust as needed
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 16,
    alignItems: 'flex-start', // Align icon and text to the start
    marginBottom: 16, // Add some margin for spacing if used in a list/grid
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
});

export default FeatureCard;
