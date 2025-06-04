import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, Button } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
  const [dateForPicker, setDateForPicker] = useState(new Date()); // For the picker's internal date
  const [selectedDate, setSelectedDate] = useState(''); // Stores date as YYYY-MM-DD string
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const onChangeDate = (event: DateTimePickerEvent, newDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS until dismissal
    if (newDate) {
      setDateForPicker(newDate);
      // Format date to YYYY-MM-DD for Supabase and display
      const year = newDate.getFullYear();
      const month = (newDate.getMonth() + 1).toString().padStart(2, '0');
      const day = newDate.getDate().toString().padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };


  useEffect(() => {
    const fetchUnavailableDays = async () => {
      if (!profile?.id) {
        // It's possible profile is not yet loaded, or user is not logged in.
        // We might want to show a message or handle this case more gracefully.
        // For now, if no profile.id, we can't fetch data.
        setIsLoading(false); 
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('tutor_availability')
          .select('id, date, reason')
          .eq('tutor_id', profile.id) // profile.id is now guaranteed by the check above
          .eq('is_available', false);

        if (error) throw error;

        if (data) {
          setUnavailableDays(data.map(day => ({
            id: day.id,
            date: day.date, 
            reason: day.reason || '', // Ensure reason is always a string
          })));
        }
      } catch (error) {
        console.error('Error fetching unavailable days:', error);
        Alert.alert('Error', 'Failed to load unavailable days.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnavailableDays();
  }, [profile?.id]);

  const handleAddUnavailableDay = async () => {
    if (!profile?.id) {
      Alert.alert('Error', 'User profile not found. Please try again.');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tutor_availability')
        .insert({
          tutor_id: profile.id, // profile.id is now guaranteed by the check above
          date: selectedDate,
          is_available: false,
          reason: reason || 'Unavailable', // Ensure reason is a string
        })
        .select()
        .single();

      if (error) throw error;

      // Ensure data and its properties exist before using them
      if (data && data.id && data.date) {
        setUnavailableDays([...unavailableDays, {
          id: data.id,
          date: data.date,
          reason: data.reason || '', // Ensure reason is always a string
        }]);
      } else {
        // Handle case where data might not be as expected, though select().single() should return it
        console.error('Error adding unavailable day: Inserted data is incomplete', data);
        Alert.alert('Error', 'Failed to update availability: Incomplete data received.');
      }
      
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
            <TouchableOpacity onPress={showDatepicker} style={styles.dateDisplay}>
              <Text style={styles.dateDisplayText}>
                {selectedDate || 'YYYY-MM-DD'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={dateForPicker}
                mode="date"
                display="default"
                onChange={onChangeDate}
                minimumDate={new Date()} // Optional: prevent selecting past dates
              />
            )}
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
        {isLoading ? (
          <Text style={styles.loadingText}>Loading unavailable days...</Text>
        ) : unavailableDays.length === 0 ? (
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
  dateDisplay: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  dateDisplayText: {
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
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
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
