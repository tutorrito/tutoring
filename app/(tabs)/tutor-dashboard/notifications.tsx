import { useState, useEffect } from 'react'; // Added useEffect
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import { router } from 'expo-router';
import { ArrowLeft, Send, Clock } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/sendEmail'; // Import sendEmail helper
import { templates } from '@/lib/emailTemplates'; // Import templates

// Define type for session data (adjust based on your actual table structure)
interface Session {
  id: string;
  student_id: string;
  session_time: string; // Assuming ISO 8601 format
  // Add other relevant fields if needed
}

// Define type for profile data
interface Profile {
  id: string;
  full_name: string;
  email: string; // Assuming email is stored in profiles table
}

export default function NotificationsScreen() {
  const { profile, user } = useAuth(); // Get user for tutor ID
  const [message, setMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendNotification = async () => {
    if (!message) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'Authentication error. Cannot send notification.');
      return;
    }

    try {
      setSending(true);

      // --- Fetch Students with Upcoming Sessions Today --- 
      // WARNING: This logic is complex for frontend and might be inefficient.
      // It assumes sessions table has student_id and session_time.
      // It also assumes profiles table has email linked to student_id.
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions') // Replace 'sessions' with your actual sessions table name
        .select('student_id')
        .eq('tutor_id', user.id)
        .gte('session_time', todayStart.toISOString())
        .lte('session_time', todayEnd.toISOString());

      if (sessionsError) {
        throw new Error(`Failed to fetch student sessions: ${sessionsError.message}`);
      }

      if (!sessions || sessions.length === 0) {
        Alert.alert('Info', 'No students found with sessions today to notify.');
        setSending(false);
        return;
      }

      // Get unique student IDs
      const studentIds = [...new Set(sessions.map(s => s.student_id))];

      // Fetch student profiles (including email)
      const { data: studentProfiles, error: profilesError } = await supabase
        .from('profiles') // Replace 'profiles' with your actual profiles table name
        .select('id, full_name, email')
        .in('id', studentIds);

      if (profilesError) {
        throw new Error(`Failed to fetch student profiles: ${profilesError.message}`);
      }

      if (!studentProfiles || studentProfiles.length === 0) {
        throw new Error('Could not find profile information for students.');
      }
      // --- End Fetch Students --- 

      // --- Send Emails via Resend --- 
      const emailPromises = studentProfiles.map(student => 
        sendEmail({
          to: student.email, // Assuming email is in the profile
          subject: `Update from your tutor ${profile?.full_name || ''}`,
          html: templates.arrivalUpdateNotification(
            student.full_name || 'Student', // Use student name from profile
            profile?.full_name || 'Your Tutor',
            message,
            estimatedTime || undefined // Pass estimatedTime if provided
          ),
        })
      );

      const results = await Promise.allSettled(emailPromises);
      let emailErrorCount = 0;
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Error sending arrival update to ${studentProfiles[index].email}:`, result.reason);
          emailErrorCount++;
        } else if (result.value.success === false) {
           console.error(`Failed sending arrival update to ${studentProfiles[index].email}:`, result.value.error);
           emailErrorCount++;
        }
      });
      // --- End Send Emails --- 

      if (emailErrorCount > 0) {
        Alert.alert('Warning', `Failed to send notification to ${emailErrorCount} out of ${studentProfiles.length} students.`);
      } else {
        Alert.alert('Success', `Notification sent successfully to ${studentProfiles.length} student(s).`);
      }

      setMessage('');
      setEstimatedTime('');

    } catch (error: any) {
      console.error('Error in handleSendNotification:', error);
      Alert.alert('Error', `Failed to send notification: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  // --- Keep existing JSX and styles --- 
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
            Notify students with sessions today about your arrival status
          </Text>

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
              {sending ? 'Sending...' : 'Send Notification to Today\'s Students'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Important Note</Text>
          <Text style={styles.infoText}>
            This will attempt to send an email notification to all students who have a session scheduled with you today. Ensure your Resend API key is correctly configured in `lib/sendEmail.ts` (Warning: Insecure). Students will receive your notification via email.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// --- Keep existing styles --- 
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
  content: {
    padding: 24,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 8,
  },
  cardDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1F2937',
  },
  messageInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendingButton: {
    backgroundColor: '#818CF8',
  },
  sendButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  infoCard: {
    marginTop: 24,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#4F46E5',
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});

