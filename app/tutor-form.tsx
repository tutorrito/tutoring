import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, X } from 'lucide-react-native';

type FormStep = 'personal' | 'professional' | 'availability' | 'payment';
type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface TimeSlot {
  day: WeekDay;
  startTime: string;
  endTime: string;
}

const DAYS: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TutorFormScreen() {
  const [currentStep, setCurrentStep] = useState<FormStep>('personal');
  const [formData, setFormData] = useState({
    // Personal Info
    fullName: '',
    email: '',
    phone: '',
    location: '',
    
    // Professional Info
    subjectSpecialty: '',
    teachingExperience: '',
    profilePhotoLink: '',
    cvLink: '',
    
    // Availability Info
    timeSlots: [] as TimeSlot[],
    
    // Payment Info
    bankName: '',
    accountHolderName: '',
    ibanNumber: '',
    swiftCode: '',
    additionalInfo: '',
  });

  const updateFormData = (field: string, value: string | TimeSlot[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00'
    };
    updateFormData('timeSlots', [...formData.timeSlots, newSlot]);
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const updatedSlots = [...formData.timeSlots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    updateFormData('timeSlots', updatedSlots);
  };

  const removeTimeSlot = (index: number) => {
    const updatedSlots = formData.timeSlots.filter((_, i) => i !== index);
    updateFormData('timeSlots', updatedSlots);
  };

  const handleNext = () => {
    if (currentStep === 'personal') setCurrentStep('professional');
    else if (currentStep === 'professional') setCurrentStep('availability');
    else if (currentStep === 'availability') setCurrentStep('payment');
    else handleSubmit();
  };

  const handleBack = () => {
    if (currentStep === 'professional') setCurrentStep('personal');
    else if (currentStep === 'availability') setCurrentStep('professional');
    else if (currentStep === 'payment') setCurrentStep('availability');
    else router.back();
  };

  const handleSubmit = () => {
    // TODO: Implement form submission with availability data
    console.log('Form submitted:', formData);
    router.replace('/(tabs)');
  };

  const renderPersonalInfo = () => (
    <View style={styles.formSection}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Your full name"
          value={formData.fullName}
          onChangeText={(value) => updateFormData('fullName', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Your email address"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(value) => updateFormData('email', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Your phone number"
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(value) => updateFormData('phone', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Doha, Al Rayyan"
          value={formData.location}
          onChangeText={(value) => updateFormData('location', value)}
        />
      </View>
    </View>
  );

  const renderProfessionalInfo = () => (
    <View style={styles.formSection}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Subject Specialty <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Mathematics, Physics"
          value={formData.subjectSpecialty}
          onChangeText={(value) => updateFormData('subjectSpecialty', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Teaching Experience <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell us about your teaching experience and qualifications"
          multiline
          numberOfLines={4}
          value={formData.teachingExperience}
          onChangeText={(value) => updateFormData('teachingExperience', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Profile Photo (Google Drive Link) <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="https://drive.google.com/file/d/..."
          autoCapitalize="none"
          value={formData.profilePhotoLink}
          onChangeText={(value) => updateFormData('profilePhotoLink', value)}
        />
        <Text style={styles.helperText}>Please provide a Google Drive link to a professional photo of yourself</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>CV/Resume (Google Drive Link) <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="https://drive.google.com/file/d/..."
          autoCapitalize="none"
          value={formData.cvLink}
          onChangeText={(value) => updateFormData('cvLink', value)}
        />
        <Text style={styles.helperText}>Please provide a Google Drive link to your CV or resume</Text>
      </View>
    </View>
  );

  const renderAvailability = () => (
    <View style={styles.formSection}>
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Set Your Availability</Text>
        <Text style={styles.infoText}>
          Add your available time slots for tutoring sessions. Students will be able to book sessions during these times.
        </Text>
      </View>

      {formData.timeSlots.map((slot, index) => (
        <View key={index} style={styles.timeSlotContainer}>
          <View style={styles.timeSlotHeader}>
            <Text style={styles.timeSlotTitle}>Time Slot {index + 1}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeTimeSlot(index)}
            >
              <X size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Day</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.daysContainer}
            >
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    slot.day === day && styles.dayButtonSelected
                  ]}
                  onPress={() => updateTimeSlot(index, 'day', day)}
                >
                  <Text style={[
                    styles.dayButtonText,
                    slot.day === day && styles.dayButtonTextSelected
                  ]}>
                    {day.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.timeInputsRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Start Time</Text>
              <TextInput
                style={styles.input}
                placeholder="09:00"
                value={slot.startTime}
                onChangeText={(value) => updateTimeSlot(index, 'startTime', value)}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>End Time</Text>
              <TextInput
                style={styles.input}
                placeholder="10:00"
                value={slot.endTime}
                onChangeText={(value) => updateTimeSlot(index, 'endTime', value)}
              />
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity 
        style={styles.addButton}
        onPress={addTimeSlot}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Time Slot</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPaymentInfo = () => (
    <View style={styles.formSection}>
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Payment Information</Text>
        <Text style={styles.infoText}>
          Please provide your banking details so we can process your payments. Your information is
          secure and encrypted.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bank Name <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Qatar National Bank"
          value={formData.bankName}
          onChangeText={(value) => updateFormData('bankName', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Account Holder Name <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Name as it appears on your bank account"
          value={formData.accountHolderName}
          onChangeText={(value) => updateFormData('accountHolderName', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>IBAN Number <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. QA12QNBA000000000000000000000"
          autoCapitalize="characters"
          value={formData.ibanNumber}
          onChangeText={(value) => updateFormData('ibanNumber', value)}
        />
        <Text style={styles.helperText}>Your International Bank Account Number (IBAN) - this is required for receiving payments</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>SWIFT/BIC Code</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. QNBAAQAQ"
          autoCapitalize="characters"
          value={formData.swiftCode}
          onChangeText={(value) => updateFormData('swiftCode', value)}
        />
        <Text style={styles.helperText}>Bank Identifier Code (optional, but recommended for international payments)</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Additional Payment Information</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any additional information regarding your payment preferences"
          multiline
          numberOfLines={4}
          value={formData.additionalInfo}
          onChangeText={(value) => updateFormData('additionalInfo', value)}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Become a Tutor</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Share your knowledge and earn competitive rates teaching students in Qatar
        </Text>

        <View style={styles.progressBar}>
          <TouchableOpacity 
            style={[styles.progressStep, currentStep === 'personal' && styles.activeStep]}
            onPress={() => setCurrentStep('personal')}
          >
            <Text style={[styles.progressText, currentStep === 'personal' && styles.activeText]}>
              Personal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.progressStep, currentStep === 'professional' && styles.activeStep]}
            onPress={() => setCurrentStep('professional')}
          >
            <Text style={[styles.progressText, currentStep === 'professional' && styles.activeText]}>
              Professional
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.progressStep, currentStep === 'availability' && styles.activeStep]}
            onPress={() => setCurrentStep('availability')}
          >
            <Text style={[styles.progressText, currentStep === 'availability' && styles.activeText]}>
              Availability
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.progressStep, currentStep === 'payment' && styles.activeStep]}
            onPress={() => setCurrentStep('payment')}
          >
            <Text style={[styles.progressText, currentStep === 'payment' && styles.activeText]}>
              Payment
            </Text>
          </TouchableOpacity>
        </View>

        {currentStep === 'personal' && renderPersonalInfo()}
        {currentStep === 'professional' && renderProfessionalInfo()}
        {currentStep === 'availability' && renderAvailability()}
        {currentStep === 'payment' && renderPaymentInfo()}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === 'payment' ? 'Submit Application' : 'Next'}
            </Text>
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
    textAlign: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  progressStep: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeStep: {
    backgroundColor: '#047857',
  },
  progressText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  activeText: {
    color: '#FFFFFF',
  },
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#DC2626',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#047857',
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
  timeSlotContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeSlotTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1F2937',
  },
  removeButton: {
    padding: 4,
  },
  daysContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  dayButtonSelected: {
    backgroundColor: '#047857',
  },
  dayButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047857',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#047857',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  backButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#6B7280',
  },
});