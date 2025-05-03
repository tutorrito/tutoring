import { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert, Button } from 'react-native'; // Import Button
import { router } from 'expo-router';
import { Calendar, Clock, Bell, Users, ChevronRight, CircleAlert as AlertCircle, BookOpen, RefreshCw } from 'lucide-react-native'; // Import RefreshCw for retry
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase'; // Import Supabase client

export default function TutorDashboardScreen() {
  const { profile, user } = useAuth(); // Get user for ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [earnings, setEarnings] = useState(0);

  // Wrap data fetching in useCallback to allow retry
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setError('User authentication issue. Please try logging out and back in.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tutorId = user.id; // Assuming user.id is the tutor's ID

      // Fetch data using RPC calls
      const [sessionsCountRes, studentsCountRes, earningsRes] = await Promise.all([
        supabase.rpc('get_tutor_upcoming_sessions_count', { tutor_id: tutorId }),
        supabase.rpc('get_tutor_active_students_count', { tutor_id: tutorId }),
        supabase.rpc('get_tutor_monthly_earnings', { tutor_id: tutorId })
      ]);

      // Check for errors in responses
      if (sessionsCountRes.error) throw new Error(`Sessions Count Error: ${sessionsCountRes.error.message}`);
      if (studentsCountRes.error) throw new Error(`Students Count Error: ${studentsCountRes.error.message}`);
      if (earningsRes.error) throw new Error(`Earnings Error: ${earningsRes.error.message}`);

      // Update state with fetched data
      setUpcomingSessions(sessionsCountRes.data ?? 0);
      setTotalStudents(studentsCountRes.data ?? 0);
      setEarnings(earningsRes.data ?? 0);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(`Failed to load dashboard data. ${err.message || 'Please try again later.'}`);
      // Optionally show an alert to the user
      // Alert.alert('Error', 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Dependency on user.id

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Run fetchDashboardData when it changes (or on mount)

  const quickActions = [
    {
      title: 'Manage Courses',
      description: 'Add, edit, or remove your course offerings',
      icon: BookOpen,
      route: '/tutor-dashboard/manage-courses',
    },
    {
      title: 'Manage Sessions',
      description: 'View and manage your upcoming sessions',
      icon: Calendar,
      route: '/tutor-dashboard/sessions', // Assuming this route exists or will be created
    },
    {
      title: 'Set Availability',
      description: 'Update your teaching schedule',
      icon: Clock,
      route: '/tutor-dashboard/availability',
    },
    {
      title: 'Student Notifications',
      description: 'Send updates to your students',
      icon: Bell,
      route: '/tutor-dashboard/notifications',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  // Enhanced error display with retry button
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#DC2626" />
        <Text style={styles.errorTitle}>Oops! Something went wrong.</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
          <RefreshCw size={16} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.tutorName}>{profile?.full_name || 'Tutor'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{upcomingSessions}</Text>
          <Text style={styles.statLabel}>Upcoming Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalStudents}</Text>
          <Text style={styles.statLabel}>Active Students</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{earnings.toFixed(2)} QAR</Text> {/* Format earnings */}
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={() => router.push(action.route)}
              >
                <View style={styles.actionIcon}>
                  <Icon size={24} color="#4F46E5" />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>
                <ChevronRight size={20} color="#6B7280" style={styles.actionArrow} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Sections for Today's Schedule and Recent Activity can be implemented similarly */}
      {/* using functions like get_tutor_today_schedule and get_tutor_recent_sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        <View style={styles.scheduleCard}>
          <View style={styles.emptySchedule}>
            <Calendar size={48} color="#9CA3AF" />
            <Text style={styles.emptyScheduleTitle}>No Sessions Today</Text>
            <Text style={styles.emptyScheduleText}>
              You have no tutoring sessions scheduled for today
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.emptyActivity}>
            <Users size={48} color="#9CA3AF" />
            <Text style={styles.emptyActivityTitle}>No Recent Activity</Text>
            <Text style={styles.emptyActivityText}>
              Your recent student interactions will appear here
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.alertSection}>
        <AlertCircle size={20} color="#DC2626" />
        <Text style={styles.alertText}>
          Remember to update your availability regularly to ensure students can book sessions with you.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: { // Style for error display
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  errorTitle: { // Style for error title
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: { // Style for error text
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#B91C1C', // Darker red for text
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: { // Style for retry button
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: { // Style for retry button text
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    backgroundColor: '#4F46E5',
  },
  welcomeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#E0E7FF',
    marginBottom: 4,
  },
  tutorName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginTop: -20,
    marginHorizontal: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    padding: 24,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 16,
  },
  actionsGrid: {
    gap: 16,
  },
  actionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  actionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  actionDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  actionArrow: {
    marginLeft: 'auto',
  },
  scheduleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptySchedule: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyScheduleTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyScheduleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyActivityTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyActivityText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  alertSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  alertText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
  },
});

