import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, GraduationCap, Star, Languages } from 'lucide-react-native';
import { useState } from 'react';

const timeSlots = [
  '9:00 AM - 10:00 AM',
  '11:00 AM - 12:00 PM',
  '2:00 PM - 3:00 PM',
  '4:00 PM - 5:00 PM'
];

export default function BookSessionScreen() {
  const { id } = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Mock tutor data - in a real app, fetch this based on the ID
  const tutor = {
    name: 'Dr. Fatima Al-Thani',
    title: 'Physics Specialist',
    rating: 4.8,
    reviews: 93,
    location: 'Al Rayyan, Qatar',
    education: 'PhD in Physics, Imperial College London',
    languages: ['Arabic', 'English'],
    price: 200,
    subjects: ['Physics', 'Chemistry'],
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop'
  };

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      router.push({
        pathname: '/book-session/contact-info',
        params: {
          tutorName: tutor.name,
          subject: tutor.subjects[0],
          date: selectedDate,
          time: selectedTime,
          price: tutor.price
        }
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Top Rated!</Text>
        </View>
      </View>

      <View style={styles.tutorInfo}>
        <Image source={{ uri: tutor.image }} style={styles.tutorImage} />
        <Text style={styles.tutorName}>{tutor.name}</Text>
        <Text style={styles.tutorTitle}>{tutor.title}</Text>
        
        <View style={styles.ratingContainer}>
          <Star size={16} color="#FFB800" fill="#FFB800" />
          <Text style={styles.rating}>{tutor.rating}</Text>
          <Text style={styles.reviews}>({tutor.reviews} reviews)</Text>
        </View>

        <View style={styles.tags}>
          {tutor.subjects.map((subject, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{subject}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoRow}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.infoText}>{tutor.location}</Text>
        </View>

        <View style={styles.infoRow}>
          <GraduationCap size={16} color="#6B7280" />
          <Text style={styles.infoText}>{tutor.education}</Text>
        </View>

        <View style={styles.infoRow}>
          <Languages size={16} color="#6B7280" />
          <Text style={styles.infoText}>{tutor.languages.join(', ')}</Text>
        </View>

        <Text style={styles.price}>QAR {tutor.price} / hour</Text>
      </View>

      <View style={styles.bookingSection}>
        <Text style={styles.sectionTitle}>Book a Session</Text>
        <Text style={styles.sectionSubtitle}>Select a date and time that works for you</Text>

        <Text style={styles.label}>1. Select a Date</Text>
        {/* In a real app, implement a proper calendar component */}
        <View style={styles.dateSelection}>
          {['Tue, Apr 1', 'Thu, Apr 3', 'Sat, Apr 5', 'Tue, Apr 8'].map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dateButton, selectedDate === date && styles.selectedDate]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dateText, selectedDate === date && styles.selectedDateText]}>
                {date}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>2. Select a Time Slot</Text>
        <View style={styles.timeSelection}>
          {timeSlots.map((time, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.timeButton, selectedTime === time && styles.selectedTime]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[styles.timeText, selectedTime === time && styles.selectedTimeText]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.continueButton, (!selectedDate || !selectedTime) && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!selectedDate || !selectedTime}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
  header: {
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    color: '#D97706',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  tutorInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  tutorImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  tutorName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 4,
  },
  tutorTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rating: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 4,
  },
  reviews: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  tags: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4F46E5',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#059669',
    marginTop: 16,
  },
  bookingSection: {
    padding: 24,
    marginTop: 24,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  dateSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedDate: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  dateText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1F2937',
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  timeSelection: {
    gap: 12,
    marginBottom: 32,
  },
  timeButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedTime: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  timeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
  },
  selectedTimeText: {
    color: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  continueButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});