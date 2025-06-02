import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function TutorAgreementScreen() {
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  const handleContinue = () => {
    router.push('/tutor-form');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Tutor Agreement</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Please review and accept our terms before continuing</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Rules and Responsibilities</Text>
          
          <Text style={styles.subsectionTitle}>1.1. Payment Terms</Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletText}>• Hourly Rate: Tutors will charge students no more than 200 QAR per hour for each tutoring session.</Text>
            <Text style={styles.bulletText}>• Payment Split: Tutorrito will retain 50 QAR per session, and the Tutor will receive 150 QAR per hour worked.</Text>
            <Text style={styles.bulletText}>• Payment Processing: Payments will be processed securely through the Tutorrito platform and tutors will receive payments after the completion of each session.</Text>
            <Text style={styles.bulletText}>• Invoicing: Tutorrito will handle all invoicing for the sessions.</Text>
          </View>

          <Text style={styles.subsectionTitle}>1.2. Tutor Responsibilities</Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletText}>• Session Availability: Tutors must keep their availability up to date in the Tutorrito app and ensure they are ready to tutor during the scheduled time.</Text>
            <Text style={styles.bulletText}>• Student Interaction: Tutors must maintain a professional and friendly demeanor during all tutoring sessions, providing a respectful and educational environment.</Text>
            <Text style={styles.bulletText}>• Content Delivery: Tutors must ensure tutoring content is accurate, clear, and meets the student's educational needs.</Text>
            <Text style={styles.bulletText}>• Punctuality: Tutors must be punctual and inform students of any delays.</Text>
            <Text style={styles.bulletText}>• Communication: Tutors must maintain regular communication with students and Tutorrito staff when necessary. Any issues must be reported promptly.</Text>
          </View>

          <Text style={styles.subsectionTitle}>1.3. Tutor Verification</Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletText}>• Tutors must provide valid proof of qualifications and background during the application process.</Text>
            <Text style={styles.bulletText}>• Tutorrito reserves the right to review, approve, or reject tutor applications at its discretion.</Text>
          </View>

          <Text style={styles.subsectionTitle}>1.4. Termination of Agreement</Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletText}>• Voluntary Termination: Tutors can stop providing services by notifying Tutorrito.</Text>
            <Text style={styles.bulletText}>• Termination by Tutorrito: Tutorrito can terminate or suspend access if tutors violate the terms, fail to meet quality standards, or engage in unprofessional behavior.</Text>
          </View>

          <Text style={styles.subsectionTitle}>1.5. Confidentiality</Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletText}>• Student Information: Tutors must maintain confidentiality regarding student information and not disclose or misuse it.</Text>
            <Text style={styles.bulletText}>• Tutorrito's Information: Tutors agree not to disclose or misuse any proprietary information belonging to Tutorrito.</Text>
          </View>

          <Text style={styles.subsectionTitle}>1.6. Dispute Resolution</Text>
          <Text style={styles.paragraphText}>
            Disputes between tutors and students will be addressed through the Tutorrito platform. If unresolved, Tutorrito will mediate the dispute.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={() => setAgreementAccepted(!agreementAccepted)}
        >
          <View style={[styles.checkbox, agreementAccepted && styles.checkboxChecked]} />
          <Text style={styles.checkboxLabel}>I have read and agree to the Tutorrito Terms and Conditions</Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.continueButton, !agreementAccepted && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!agreementAccepted}
          >
            <Text style={styles.continueButtonText}>Continue to Application</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#047857',
  },
  content: {
    padding: 24,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 24,
  },
  subsectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
  },
  bulletPoints: {
    marginBottom: 16,
  },
  bulletText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 8,
  },
  paragraphText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  checkboxLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#047857',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  continueButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#6B7280',
  },
});