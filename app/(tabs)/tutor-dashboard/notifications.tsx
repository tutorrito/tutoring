import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Send, Clock, User } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
// import { sendEmail } from '@/lib/sendEmail'; // Removed as it's unused
import { templates } from '@/lib/emailTemplates';

interface Student {
  id: string;
  email: string;
  full_name: string;
}

export default function NotificationsScreen() {
  const { profile, user } = useAuth();
  const [message, setMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [sending, setSending] = useState(false);
  const [studentsWithSessions, setStudentsWithSessions] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.id) return;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          student:student_id(
            id,
            email,
            full_name
          )
        `)
        .eq('tutor_id', user.id)
        .eq('status', 'confirmed')
        .gte('start_time', todayStart.toISOString())
        .lte('start_time', todayEnd.toISOString())
        .order('start_time');

      if (error) {
        console.error('Error fetching students for notification:', error);
        Alert.alert('Error', 'Could not load students for notification.');
      } else if (data) {
        // Filter out null students and ensure unique students if a student has multiple sessions
        const uniqueStudents = data.reduce((acc: Student[], session: any) => {
          if (session.student && !acc.find(s => s.id === session.student.id)) {
            // Ensure student object matches Student interface
            const studentData: Student = {
              id: session.student.id,
              email: session.student.email,
              full_name: session.student.full_name,
            };
            acc.push(studentData);
          }
          return acc;
        }, [] as Student[]);
        setStudentsWithSessions(uniqueStudents);
        if (uniqueStudents.length > 0) {
          setSelectedStudentId(uniqueStudents[0].id); // Default to first student
        }
      }
    };

    fetchStudents();
  }, [user?.id]);

  const handleSendNotification = async () => {
    if (!selectedStudentId) {
      Alert.alert('Error', 'Please select a student to notify.');
      return;
    }
    if (!message) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'Authentication error. Cannot send notification.');
      return;
    }

    const student = studentsWithSessions.find(s => s.id === selectedStudentId);
    if (!student) {
      Alert.alert('Error', 'Selected student not found. Please refresh.');
      return;
    }

    try {
      setSending(true);

      const tutorFullName = profile?.full_name || 'Your Tutor';

      // Call Supabase Edge Function
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke(
        'send-arrival-notification', // Name of the Edge Function
        {
          body: {
            studentId: selectedStudentId,
            tutorFullName: tutorFullName,
            message: message,
            estimatedTime: estimatedTime,
          },
        }
      );

      if (functionError) {
        console.error('Error invoking Supabase function:', functionError);
        throw new Error(functionError.message || 'Failed to send notification via function.');
      }
      
      if (functionResponse?.error) {
        console.error('Supabase function returned an error:', functionResponse.error);
        throw new Error(functionResponse.error || 'The notification function returned an error.');
      }


      // The database insertion is now handled by the Edge Function.
      // If we reach here, the function call was successful (which includes DB insertion).

      Alert.alert('Success', 'Notification sent successfully');
      setMessage('');
      setEstimatedTime('');
    } catch (error: any) {
      console.error('Error sending notification:', error.message);
      Alert.alert('Error', `Failed to send notification: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Student Notifications</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Send Arrival Update</Text>
          <Text style={styles.cardDescription}>
            Notify a student with a session today about your arrival status
          </Text>

          {studentsWithSessions.length > 0 ? (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Student</Text>
              <View style={styles.pickerContainer}>
                <User size={20} color="#6B7280" style={styles.pickerIcon} />
                <Picker
                  selectedValue={selectedStudentId}
                  onValueChange={(itemValue) => setSelectedStudentId(itemValue)}
                  style={styles.picker}
                >
                  {studentsWithSessions.map((s) => (
                    <Picker.Item key={s.id} label={s.full_name} value={s.id} />
                  ))}
                </Picker>
              </View>
            </View>
          ) : (
            <Text style={styles.noStudentsText}>No students with sessions today.</Text>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="e.g., I'm on my way, running 5 mins late"
              multiline
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Estimated Arrival Time (Optional)</Text>
            <View style={styles.timeInput}>
              <Clock size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                value={estimatedTime}
                onChangeText={setEstimatedTime}
                placeholder="e.g., 10 minutes, 4:15 PM"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.sendButton, sending && styles.sendingButton]}
            onPress={handleSendNotification}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Send size={20} color="#FFFFFF" />
            )}
            <Text style={styles.sendButtonText}>
              {sending ? 'Sending...' : 'Send Notification to Selected Student'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Important Note</Text>
          <Text style={styles.infoText}>
            This will send a notification to the selected student who has a session scheduled with you today.
            The student will receive your notification via email and in-app notification.
          </Text>
        </View>
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
    fontSize: 20, // Matched to existing title style
    color: '#1F2937', // Matched to existing title style
    marginLeft: 16, // Matched to existing title style
  },
  content: {
    padding: 24, // Matched to existing content style
  },
  card: {
    backgroundColor: '#F9FAFB', // Matched to existing card style
    borderRadius: 16, // Matched to existing card style
    padding: 24, // Matched to existing card style
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold', // Matched to existing cardTitle style
    fontSize: 18, // Matched to existing cardTitle style
    color: '#1F2937', // Matched to existing cardTitle style
    marginBottom: 8, // Matched to existing cardTitle style
  },
  cardDescription: {
    fontFamily: 'Inter_400Regular', // Matched to existing cardDescription style
    fontSize: 14, // Matched to existing cardDescription style
    color: '#6B7280', // Matched to existing cardDescription style
    marginBottom: 24, // Matched to existing cardDescription style
  },
  inputContainer: {
    marginBottom: 20, // Matched to existing inputContainer style
  },
  label: {
    fontFamily: 'Inter_500Medium', // Matched to existing label style
    fontSize: 14, // Matched to existing label style
    color: '#4B5563', // Matched to existing label style
    marginBottom: 8, // Matched to existing label style
  },
  input: {
    flex: 1, // Matched to existing input style
    fontFamily: 'Inter_400Regular', // Matched to existing input style
    fontSize: 16, // Matched to existing input style
    color: '#1F2937', // Matched to existing input style
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    height: 48, // Adjusted height for picker
    paddingHorizontal: 12,
  },
  pickerIcon: {
    marginRight: 8,
  },
  picker: {
    flex: 1,
    height: 48, // Ensure picker takes full height of container
    // Styling for Picker text might need platform-specific adjustments or a custom component
    // For basic styling, color can sometimes be applied:
    // color: '#1F2937', // This might not work consistently across platforms for Picker items
  },
  noStudentsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 20,
  },
  messageInput: {
    backgroundColor: '#FFFFFF', // Matched to existing messageInput style
    borderWidth: 1, // Matched to existing messageInput style
    borderColor: '#E5E7EB', // Matched to existing messageInput style
    borderRadius: 8, // Matched to existing messageInput style
    padding: 12, // Matched to existing messageInput style
    height: 100, // Matched to existing messageInput style
    textAlignVertical: 'top', // Matched to existing messageInput style
  },
  timeInput: {
    flexDirection: 'row', // Matched to existing timeInput style
    alignItems: 'center', // Matched to existing timeInput style
    backgroundColor: '#FFFFFF', // Matched to existing timeInput style
    borderWidth: 1, // Matched to existing timeInput style
    borderColor: '#E5E7EB', // Matched to existing timeInput style
    borderRadius: 8, // Matched to existing timeInput style
    paddingHorizontal: 12, // Matched to existing timeInput style
    height: 44, // Matched to existing timeInput style
    gap: 8, // Matched to existing timeInput style
  },
  sendButton: {
    flexDirection: 'row', // Matched to existing sendButton style
    alignItems: 'center', // Matched to existing sendButton style
    justifyContent: 'center', // Matched to existing sendButton style
    backgroundColor: '#4F46E5', // Matched to existing sendButton style
    padding: 16, // Matched to existing sendButton style
    borderRadius: 12, // Matched to existing sendButton style
    gap: 8, // Matched to existing sendButton style
  },
  sendingButton: {
    backgroundColor: '#818CF8', // Matched to existing sendingButton style
  },
  sendButtonText: {
    fontFamily: 'Inter_600SemiBold', // Matched to existing sendButtonText style
    fontSize: 16, // Matched to existing sendButtonText style
    color: '#FFFFFF', // Matched to existing sendButtonText style
  },
  infoCard: {
    marginTop: 24, // Matched to existing infoCard style
    backgroundColor: '#EEF2FF', // Matched to existing infoCard style
    borderRadius: 12, // Matched to existing infoCard style
    padding: 16, // Matched to existing infoCard style
  },
  infoTitle: {
    fontFamily: 'Inter_600SemiBold', // Matched to existing infoTitle style
    fontSize: 16, // Matched to existing infoTitle style
    color: '#4F46E5', // Matched to existing infoTitle style
    marginBottom: 8, // Matched to existing infoTitle style
  },
  infoText: {
    fontFamily: 'Inter_400Regular', // Matched to existing infoText style
    fontSize: 14, // Matched to existing infoText style
    color: '#4B5563', // Matched to existing infoText style
    lineHeight: 20, // Matched to existing infoText style
  },
});
