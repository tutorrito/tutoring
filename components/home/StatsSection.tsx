import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// TODO: Fetch these stats from an API or define them more dynamically
const statsData = [
  { number: '500+', label: 'Expert Tutors' },
  { number: '5000+', label: 'Students' },
  { number: '95%', label: 'Success Rate' },
];

const StatsSection: React.FC = () => {
  return (
    <View style={styles.statsContainer}>
      {statsData.map((stat, index) => (
        <React.Fragment key={index}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stat.number}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
          {index < statsData.length - 1 && <View style={styles.statDivider} />}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F9FAFB',
    marginTop: -20, // This is to overlap with the Hero section's curve if any
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
});

export default StatsSection;
