import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, LogOut, Mail, Phone, Info } from 'lucide-react-native';

export default function SettingsScreen() {
  const handleSignOut = () => {
    // TODO: Implement sign out logic with Supabase
    router.replace('/(auth)/sign-in');
  };

  const handleContact = (type: 'email' | 'phone') => {
    switch (type) {
      case 'email':
        Linking.openURL('mailto:tutorritoservices@gmail.com');
        break;
      case 'phone':
        Linking.openURL('tel:+97430451695');
        break;
    }
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
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Info size={20} color="#4F46E5" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>About Tutorrito</Text>
              <Text style={styles.infoText}>
                Your trusted platform for finding qualified tutors in Qatar. We connect students with expert educators for personalized learning experiences.
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.infoRow}
            onPress={() => handleContact('email')}
          >
            <Mail size={20} color="#4F46E5" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoText}>tutorritoservices@gmail.com</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.infoRow}
            onPress={() => handleContact('phone')}
          >
            <Phone size={20} color="#4F46E5" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoText}>+974 3045 1695</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
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
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1F2937',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
  },
  signOutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 12,
  },
  version: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginVertical: 24,
  },
});