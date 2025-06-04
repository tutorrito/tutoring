import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { User, Bell, Shield, Mail, Phone, CircleHelp as HelpCircle, FileText, ExternalLink, ChevronRight, LogOut } from 'lucide-react-native';

export default function SettingsScreen() {
  const { signOut, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (type: 'email' | 'phone') => {
    switch (type) {
      case 'email':
        // Use appropriate linking method for React Native if needed
        // For web, this works
        if (typeof window !== 'undefined') window.location.href = 'mailto:support@tutorrito.com';
        break;
      case 'phone':
        if (typeof window !== 'undefined') window.location.href = 'tel:+97430451695';
        break;
    }
  };

  const sections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'My Profile',
          onPress: () => router.push('/(tabs)/profile'), // Navigate to the profile tab screen
        },
        {
          icon: Bell,
          label: 'Push Notifications',
          right: (
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
              thumbColor={notifications ? '#4F46E5' : '#F3F4F6'}
            />
          ),
        },
        {
          icon: Mail,
          label: 'Email Notifications',
          right: (
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
              thumbColor={emailNotifications ? '#4F46E5' : '#F3F4F6'}
            />
          ),
        },
        {
          icon: Shield,
          label: 'Privacy & Security',
          onPress: () => router.push('/privacy-settings' as any),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help Center',
          onPress: () => router.push('/help' as any),
        },
        {
          icon: Mail,
          label: 'Contact Support',
          onPress: () => handleContact('email'),
        },
        {
          icon: Phone,
          label: 'Call Us',
          onPress: () => handleContact('phone'),
          right: <Text style={styles.phoneNumber}>+974 3045 1695</Text>,
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon: FileText,
          label: 'Terms of Service',
          onPress: () => router.push('/terms' as any),
          showExternalIcon: true,
        },
        {
          icon: Shield,
          label: 'Privacy Policy',
          onPress: () => router.push('/privacy' as any),
          showExternalIcon: true,
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {sections.map((section, sectionIndex) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    itemIndex === section.items.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={typeof item.onPress === 'function' ? item.onPress : undefined}
                  disabled={!('onPress' in item && typeof item.onPress === 'function') && !('right' in item && item.right)} // Disable if no onPress and no right element (like Switch)
                >
                  <View style={styles.menuItemLeft}>
                    <Icon size={20} color="#4B5563" />
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    {('right' in item && item.right) || ( // Check for item.right before item.onPress logic
                      (typeof item.onPress === 'function') && (
                        <>
                          {('showExternalIcon' in item && item.showExternalIcon) ? (
                            <ExternalLink size={16} color="#6B7280" />
                          ) : (
                            <ChevronRight size={16} color="#6B7280" />
                          )}
                        </>
                      )
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#DC2626" />
        ) : (
          <>
            <LogOut size={20} color="#DC2626" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </>
        )}
      </TouchableOpacity>

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
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#1F2937',
  },
  section: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#1F2937',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneNumber: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  signOutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#DC2626',
  },
  version: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
  },
});
