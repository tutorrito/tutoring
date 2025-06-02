import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard } from 'lucide-react-native';
import { supabase } from '@/lib/supabase'; // Import supabase client
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
// Removed import for local sendEmail helper
import { templates } from '@/lib/emailTemplates'; // Import templates

export default function ConfirmBookingScreen() {
  const { user: authUser } = useAuth(); // Get authenticated user
  const params = useLocalSearchParams<{
    // Params from [id].tsx passed through contact-info.tsx
    tutorName: string;
    tutorEmail: string; // Now passed from contact-info
    courseTitle: string; // Not directly used in emails, but good to have
    subjectName: string; // This is the actual subject name
    date: string;
    time: string;
    price: string;
    courseId: string;
    tutorId: string;
    availabilitySlotId: string;
    subjectId: string; // Add subjectId
    // Params from contact-info.tsx
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    studentAddress: string; // Used as 'location'
    additionalNotes?: string;
    // Mapped params for clarity, `subject` and `location` are expected by email templates
    subject: string; // This will be params.subjectName
    location: string; // This will be params.studentAddress
  }>();

  const handleConfirm = async () => {
    console.log('handleConfirm called on confirm.tsx');
    console.log('Received params:', JSON.stringify(params, null, 2));

    if (!authUser) {
      Alert.alert('Authentication Error', 'You must be logged in to confirm a booking.');
      console.error('[ConfirmBookingScreen] User not authenticated.');
      return;
    }

    // Validate required params for session creation and email sending
    const requiredParams = [
      params.studentEmail, params.tutorEmail, params.studentName, params.tutorName,
      params.subject, params.date, params.time, params.location, params.price,
      params.courseId, params.tutorId, params.availabilitySlotId, params.subjectId, authUser.id
    ];

    if (requiredParams.some(p => !p)) {
      Alert.alert('Error', 'Missing critical booking details. Please go back and check your input.');
      console.error('[ConfirmBookingScreen] Validation failed. Missing params:', params, { studentId: authUser.id });
      return;
    }
    
    console.log('[ConfirmBookingScreen] All required parameters for session creation and email are present.');

    // 1. Create the session in the database
    try {
      console.log('[ConfirmBookingScreen] Attempting to create session in database...');
      const startTimeString = params.time!.split(' - ')[0]; // "09:00"
      const [hours, minutes] = startTimeString.split(':').map(Number);
      
      const startDate = new Date(params.date!); // "2025-06-01"
      startDate.setHours(hours, minutes, 0, 0); // Set time in local timezone
      const startTimeISO = startDate.toISOString(); // Convert to ISO string for Supabase

      // Assuming duration is 1 hour as per UI. For more dynamic duration, this needs to be passed or calculated.
      const duration = 1; 

      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          course_id: params.courseId,
          tutor_id: params.tutorId,
          student_id: authUser.id,
          subject_id: params.subjectId,
          availability_slot_id: params.availabilitySlotId,
          start_time: startTimeISO,
          duration: duration, // Assuming 1 hour duration
          status: 'confirmed', // Default status for a new booking
          notes: params.additionalNotes || null,
          // price_at_booking: parseFloat(params.price!), // If you have a price_at_booking field
        })
        .select()
        .single();

      if (sessionError) {
        console.error('[ConfirmBookingScreen] Error creating session:', sessionError);
        Alert.alert('Booking Error', `Could not save your booking (DB Error: ${sessionError.code}). Please try again or contact support.`);
        return;
      }
      console.log('[ConfirmBookingScreen] Session created successfully:', sessionData);

      // 3. Create a conversation for this session
      if (sessionData && sessionData.id) {
        console.log('[ConfirmBookingScreen] Attempting to create conversation...');
        const { error: conversationError } = await supabase
          .from('conversations')
          .insert({
            session_id: sessionData.id,
            student_id: authUser.id, // authUser is already checked for null
            tutor_id: params.tutorId!, // tutorId is checked in requiredParams
          });

        if (conversationError) {
          console.error('[ConfirmBookingScreen] Error creating conversation:', conversationError);
          // Non-critical error, so we can just log it and proceed.
          // Alert.alert('Conversation Error', 'Could not initiate a chat for this booking. Please contact support.');
        } else {
          console.log('[ConfirmBookingScreen] Conversation created successfully for session:', sessionData.id);
        }
      } else {
        console.warn('[ConfirmBookingScreen] Session data or ID missing, skipping conversation creation.');
      }

    } catch (dbError: any) {
      console.error('[ConfirmBookingScreen] Unexpected error during session creation or conversation setup:', dbError);
      Alert.alert('Booking Error', 'An unexpected error occurred while finalizing your booking. Please try again.');
      return;
    }

    // 2. Send emails using the send-email Supabase Edge Function
    console.log('[ConfirmBookingScreen] Invoking send-email function for booking confirmations...');

    // Prepare email payloads
    const studentEmailPayload = {
      to: params.studentEmail,
      subject: `Booking Confirmed: ${params.subject} with ${params.tutorName}`,
      html: templates.studentBookingConfirmation(
        params.studentName!, // Add non-null assertion as it's checked
        params.tutorName!,   // Add non-null assertion
        params.subject!,     // Add non-null assertion
        params.date!,        // Add non-null assertion
        params.time!,        // Add non-null assertion
        params.location!,    // Add non-null assertion
        params.price!        // Add non-null assertion
      ),
    };
    const tutorEmailPayload = {
      to: params.tutorEmail,
      subject: `New Booking: ${params.subject} with ${params.studentName}`,
      html: templates.tutorBookingConfirmation(
        params.tutorName!,   // Add non-null assertion
        params.studentName!, // Add non-null assertion
        params.subject!,     // Add non-null assertion
        params.date!,        // Add non-null assertion
        params.time!,        // Add non-null assertion
        params.location!     // Add non-null assertion
      ),
    };

    console.log('Student email payload:', JSON.stringify(studentEmailPayload, null, 2));
    console.log('Tutor email payload:', JSON.stringify(tutorEmailPayload, null, 2));

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
