import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, X } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

type TimeSlot = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
};

type UnavailableDay = {
  id: string;
  date: string;
  reason: string;
};

export default function AvailabilityScreen() {
  const { profile } = useAuth();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [unavailableDays, setUnavailableDays] = useState<UnavailableDay[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');

  const handleAddUnavailableDay = async () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tutor_availability')
        .insert({
          tutor_id: profile?.id,
          date: selectedDate,
          is_available: false,
          reason: reason || 'Unavailable',
        })
        .select()
        .single();

      if (error) throw error;

      setUnavailableDays([...unavailableDays, {
        id: data.id,
        date: data.date,
        reason: data.reason,
      }]);
      
      setSelectedDate('');
      setReason('');
    } catch (error) {
      console.error('Error adding unavailable day:', error);
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const handleRemoveUnavailableDay = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tutor_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUnavailableDays(unavailableDays.filter(day => day.id !== id));
    } catch (error) {
      console.error('Error removing unavailable day:', error);
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Availability</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mark Days as Unavailable</Text>
        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Select Date</Text>
            <TextInput
              style={styles.input}
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Reason (Optional)</Text>
            <TextInput
              style={[styles.input, styles.reasonInput]}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g., Sick leave, Personal day"
              multiline
            />
          </View>

          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddUnavailableDay}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Mark as Unavailable</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unavailable Days</Text>
        {unavailableDays.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Unavailable Days</Text>
            <Text style={styles.emptyStateText}>
              Days you mark as unavailable will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.unavailableDaysList}>
            {unavailableDays.map((day) => (
              <View key={day.id} style={styles.unavailableDayCard}>
                <View style={styles.unavailableDayInfo}>
                  <Text style={styles.unavailableDayDate}>{day.date}</Text>
                  <Text style={styles.unavailableDayReason}>{day.reason}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveUnavailableDay(day.id)}
                >
                  <X size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1F2937',
    marginLeft: 16,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1F2937',
  },
  reasonInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  unavailableDaysList: {
    gap: 12,
  },
  unavailableDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  unavailableDayInfo: {
    flex: 1,
  },
  unavailableDayDate: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  unavailableDayReason: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  removeButton: {
    padding: 8,
  },
});