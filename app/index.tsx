import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { GraduationCap, User } from 'lucide-react-native';

export default function WelcomePage() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Tutorrito</Text>
        <Text style={styles.subtitle}>
          Get instant homework help, connect with expert tutors, and achieve your academic goals!
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/(auth)/sign-up?role=student')}
          >
            <User size={24} color="#4F46E5" />
            <Text style={styles.buttonText}>I'm a Student</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/(auth)/sign-up?role=tutor')}
          >
            <GraduationCap size={24} color="#4F46E5" />
            <Text style={styles.buttonText}>I'm a Tutor</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.signInLink}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    backgroundImage: 'linear-gradient(180deg, #93C5FD 0%, #3B82F6 100%)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    maxWidth: Platform.OS === 'web' ? 480 : '100%',
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#F3F4F6',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 28,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
  },
  signInLink: {
    marginTop: 24,
    padding: 16,
  },
  signInText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#F3F4F6',
  },
  signInTextBold: {
    fontFamily: 'Inter_600SemiBold',
    textDecorationLine: 'underline',
  },
});