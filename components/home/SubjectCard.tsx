import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';

export interface Subject {
  name: string;
  image: string;
  count: string;
}

interface SubjectCardProps {
  subject: Subject;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  return (
    <TouchableOpacity
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
  );
};

const styles = StyleSheet.create({
  subjectCard: {
    width: 280,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    // Shadow for iOS
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3, // Elevation for Android
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }
    }),
    backgroundColor: '#FFFFFF', // Needed for shadow to show on Android
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
});

export default SubjectCard;
