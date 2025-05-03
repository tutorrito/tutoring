import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard } from 'lucide-react-native';
import { supabase } from '@/lib/supabase'; // Import supabase client
// Removed import for local sendEmail helper
import { templates } from '@/lib/emailTemplates'; // Import templates

export default function ConfirmBookingScreen() {
  const params = useLocalSearchParams<{ 
    studentName: string; 
    studentEmail: string; 
    studentPhone: string; 
    tutorName: string; 
    tutorEmail: string; 
    subject: string; 
    date: string; 
    time: string; 
    location: string; 
    price: string; 
  }>();

  // Removed old sendBookingEmails function that called Supabase function

  const handleConfirm = async () => {
    // Validate required params (basic check)
    if (!params.studentEmail || !params.tutorEmail || !params.studentName || !params.tutorName || !params.subject || !params.date || !params.time || !params.location || !params.price) {
      Alert.alert('Error', 'Missing booking details. Cannot send confirmation.');
      return;
    }

    // Send emails using the send-email Supabase Edge Function
    console.log('Invoking send-email function for booking confirmations...');

    // Prepare email payloads
    const studentEmailPayload = {
      to: params.studentEmail,
      subject: `Booking Confirmed: ${params.subject} with ${params.tutorName}`,
      html: templates.studentBookingConfirmation(
        params.studentName,
        params.tutorName,
        params.subject,
        params.date,
        params.time,
        params.location,
        params.price
      ),
    };
    const tutorEmailPayload = {
      to: params.tutorEmail,
      subject: `New Booking: ${params.subject} with ${params.studentName}`,
      html: templates.tutorBookingConfirmation(
        params.tutorName,
        params.studentName,
        params.subject,
        params.date,
        params.time,
        params.location
      ),
    };

    // Invoke the function for both emails
    const functionInvokePromises = [
      supabase.functions.invoke('send-email', { body: studentEmailPayload }),
      supabase.functions.invoke('send-email', { body: tutorEmailPayload })
    ];

    const results = await Promise.allSettled(functionInvokePromises);
    let emailError = false;

    // Log results/errors from function invocations
    results.forEach((result, index) => {
      const recipient = index === 0 ? 'student' : 'tutor';
      if (result.status === 'rejected') {
        console.error(`Error invoking send-email function for ${recipient} booking:`, result.reason);
        emailError = true;
      } else {
        if (result.value.error) {
          console.error(`Error returned from send-email function for ${recipient} booking:`, result.value.error);
          emailError = true;
        } else if (result.value.data?.success === false) {
           console.error(`send-email function reported failure for ${recipient} booking:`, result.value.data.error);
           emailError = true;
        } else {
          console.log(`send-email function successfully invoked for ${recipient} booking. Resend ID: ${result.value.data?.resend_id}`);
        }
      }
    });

    if (emailError) {
      // Optionally inform user, but proceed with navigation as booking might be logically complete
      Alert.alert('Warning', 'Could not send one or more confirmation emails. Please check your bookings.');
    }

    // TODO: Add actual payment processing logic here if needed

    // Navigate to main app after attempting emails (and potential payment)
    router.replace('/(tabs)'); 
  };

  // --- Keep existing JSX and styles --- 
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Confirm Your Booking</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Review your session details before confirming
        </Text>

        <View style={styles.tutorCard}>
          <View style={styles.tutorInfo}>
            <Text style={styles.tutorName}>{params.tutorName}</Text>
            <Text style={styles.tutorSubject}>{params.subject} Specialist</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{params.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{params.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>1 hour</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Subject:</Text>
            <Text style={styles.detailValue}>{params.subject}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{params.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Points to earn:</Text>
            <Text style={styles.detailValue}>10 points</Text>
          </View>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity style={styles.paymentOption}>
            <CreditCard size={24} color="#4F46E5" />
            <Text style={styles.paymentText}>Credit Card</Text>
          </TouchableOpacity>

          <View style={styles.priceContainer}>
            <Text style={styles.totalLabel}>Total Price:</Text>
            <Text style={styles.totalPrice}>QAR {params.price}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Confirm and Pay</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backLink}
          onPress={() => router.push('/book-session/contact-info')}
        >
          <Text style={styles.backLinkText}>Back to Contact Information</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#1F2937',
  },
  content: {
    padding: 24,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  tutorCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  tutorInfo: {
    alignItems: 'center',
  },
  tutorName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 4,
  },
  tutorSubject: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
  },
  detailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
  },
  detailValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#1F2937',
  },
  paymentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  paymentText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    color: '#1F2937',
  },
  totalPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#059669',
  },
  confirmButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  backLink: {
    alignItems: 'center',
  },
  backLinkText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
});

