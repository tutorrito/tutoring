import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator, Alert } from 'react-native'; // Added Alert
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Camera, Upload, GraduationCap, User } from 'lucide-react-native';
// Removed import for local sendEmail helper
import { templates } from '@/lib/emailTemplates'; // Import templates

type UserRole = 'student' | 'tutor';

const ADMIN_EMAIL = "alkbysyfysl499@gmail.com"; // Define admin email

export default function SignUp() {
  // ... (keep existing state variables)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [education, setEducation] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSignUp = async () => {
    try {
      setLoading(true);
      setError(null);

      // --- Input validation (keep existing) ---
      if (!name || !email || !password) {
        throw new Error('Please fill in all required fields');
      }
      if (role === 'tutor' && !education) {
        throw new Error('Please provide your educational background');
      }
      if (role === 'tutor' && !hourlyRate) {
        throw new Error('Please set your hourly rate');
      }
      // --- End Input validation ---

      // Create user with auto-confirmation
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
          },
          emailRedirectTo: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/callback`
        }
      });

      if (signUpError) {
        console.error('SignUp Error Details:', signUpError);
        throw signUpError;
      }

      if (user) {
        // Update profile
        const profileData = {
          education: role === 'tutor' ? education : null,
          hourly_rate: role === 'tutor' ? parseFloat(hourlyRate) : null,
          bio: bio || null,
        };
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);
        if (profileError) throw profileError;

        // Force confirm by signing in immediately
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) {
          console.error('SignIn Error:', signInError);
          throw new Error("Failed to confirm user");
        }
        // --- End Update Profile ---

        // --- Send Email Notifications via Supabase Edge Function ---
        console.log('Invoking send-email function for admin and user notifications...');

        // Prepare email payloads
        const adminEmailPayload = {
          to: ADMIN_EMAIL,
          subject: `New ${role} Signup: ${name}`,
          html: templates.adminNewUser(name, email, role),
        };
        const userEmailPayload = {
          to: email,
          subject: `Welcome to Tutorrito, ${name}!`,
          html: templates.welcomeUser(name, role),
        };

        // Try sending emails but don't block signup if it fails
        try {
          const sendEmail = async (payload: any) => {
            const url = 'https://yuyntfqmarmjwolrwqkf.supabase.co/functions/v1/send-email';
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify(payload)
            });
            return response.json();
          };

          // Run in background without blocking
          Promise.allSettled([
            sendEmail(adminEmailPayload),
            sendEmail(userEmailPayload)
          ]).then(results => {
            results.forEach((result, index) => {
              const recipient = index === 0 ? 'admin' : 'user';
              if (result.status === 'rejected') {
                console.error(`Email send failed for ${recipient}:`, result.reason);
              } else if (!result.value.success) {
                console.error(`Email send failed for ${recipient}:`, result.value.error);
              } else {
                console.log(`Email sent to ${recipient}`);
              }
            });
          });
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
        }
        // --- End Send Email Notifications ---

        // --- Remove old Supabase function call for admin notification ---
        // try {
        //   const { error: functionError } = await supabase.functions.invoke(...);
        //   if (functionError) { console.error(...); }
        // } catch (notificationError) { console.error(...); }
        // --- End Remove old call ---

        // Show success message and redirect to home
        Alert.alert(
          'Account Created',
          'Your account has been created successfully!'
        );
        router.replace('/(tabs)');
      } else {
        // Handle case where user is null after signup (should not happen ideally)
        throw new Error("Sign up completed but user data is missing.");
      }

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ... (keep existing JSX and styles)
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1000&auto=format&fit=crop' }}
          style={styles.headerImage}
        />
        <View style={styles.overlay} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Tutorrito today</Text>
        </View>
      </View>

      <View style={styles.form}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'student' && styles.roleButtonSelected]}
            onPress={() => setRole('student')}
          >
            <User size={24} color={role === 'student' ? '#4F46E5' : '#64748B'} />
            <Text style={[styles.roleText, role === 'student' && styles.roleTextSelected]}>
              Student
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, role === 'tutor' && styles.roleButtonSelected]}
            onPress={() => setRole('tutor')}
          >
            <GraduationCap size={24} color={role === 'tutor' ? '#4F46E5' : '#64748B'} />
            <Text style={[styles.roleText, role === 'tutor' && styles.roleTextSelected]}>
              Tutor
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor="#64748B"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#64748B"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            placeholderTextColor="#64748B"
            secureTextEntry
          />
        </View>

        {role === 'tutor' && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Education</Text>
              <TextInput
                style={styles.input}
                value={education}
                onChangeText={setEducation}
                placeholder="Your highest education qualification"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Hourly Rate (QAR)</Text>
              <TextInput
                style={styles.input}
                value={hourlyRate}
                onChangeText={setHourlyRate}
                placeholder="Your hourly rate"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell students about yourself and your teaching experience"
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
              />
            </View>
          </>
        )}

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => router.push('/sign-in')}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ... (keep existing styles)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
  },
  headerContent: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#E2E8F0',
  },
  form: {
    flex: 1,
    padding: 24,
    marginTop: -20,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  roleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  roleButtonSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  roleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#64748B',
  },
  roleTextSelected: {
    color: '#4F46E5',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#3B82F6',
  },
  linkTextBold: {
    fontFamily: 'Inter_600SemiBold',
  },
});
