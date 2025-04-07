import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard } from 'lucide-react-native';

export default function ConfirmBookingScreen() {
  const params = useLocalSearchParams();

  const sendBookingEmails = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-booking-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          studentName: params.studentName,
          studentEmail: params.studentEmail,
          studentPhone: params.studentPhone,
          tutorName: params.tutorName,
          tutorEmail: params.tutorEmail,
          subject: params.subject,
          date: params.date,
          time: params.time,
          location: params.location,
          price: params.price,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send booking emails');
      }
    } catch (error) {
      console.error('Error sending booking emails:', error);
      Alert.alert(
        'Error',
        'Failed to send booking confirmation emails. Please contact support.',
      );
    }
  };

  const handleConfirm = async () => {
    await sendBookingEmails();
    router.replace('/(tabs)');
  };

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