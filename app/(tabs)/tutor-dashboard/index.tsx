import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Calendar, Clock, Bell, Users, ChevronRight, CircleAlert as AlertCircle, BookOpen, ListChecks, History as HistoryIcon } from 'lucide-react-native'; // Added ListChecks, HistoryIcon
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// Define types for the new data
interface Subject {
  id: string;
  name: string;
}

interface Session {
  id: string;
  start_time: string;
  status: string;
  // Assuming student_profile is populated correctly
  student_profile?: { full_name: string; id: string } | null; 
  // Add other relevant session fields if needed, e.g., subject_name, price
  [key: string]: any; // Allow other properties
}


export default function TutorDashboardScreen() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Summary Stats
  const [upcomingSessions, setUpcomingSessions] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [earnings, setEarnings] = useState(0);

  // New state variables for additional features
  const [assignedSubjects, setAssignedSubjects] = useState<Subject[]>([]);
  const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
  const [todaysSchedule, setTodaysSchedule] = useState<Session[]>([]);
  // Recent Activity might be derived from sessionHistory or new bookings

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setError('User authentication issue. Please try logging out and back in.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (profile?.role === 'tutor') {
        const tutorId = user.id;

        // --- Summary Statistics (Direct Queries) ---

        // 1. Upcoming Sessions Count
        const { count: upcomingSessionsCount, error: upcomingSessionsError } = await supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .eq('tutor_id', tutorId)
          .gt('start_time', new Date().toISOString())
          .eq('status', 'confirmed');

        if (upcomingSessionsError) throw new Error(`Upcoming Sessions Count Error: ${upcomingSessionsError.message}`);
        setUpcomingSessions(upcomingSessionsCount ?? 0);

        // 2. Active Students Count (Distinct students from confirmed sessions)
        const { data: activeStudentsData, error: activeStudentsError } = await supabase
          .from('sessions')
          .select('student_id') // Corrected from user_id to student_id
          .eq('tutor_id', tutorId)
          .eq('status', 'confirmed'); // Consider a broader definition of "active" if needed

        if (activeStudentsError) throw new Error(`Active Students Error: ${activeStudentsError.message}`);
        const distinctStudentIds = new Set(activeStudentsData?.map(s => s.student_id).filter(Boolean)); // Corrected from s.user_id
        setTotalStudents(distinctStudentIds.size);

        // 3. Monthly Earnings (Sum of 'price' from 'completed' sessions this month)
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        // Ensure lastDayOfMonth correctly captures the very end of the month
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();


        const { data: earningsData, error: earningsError } = await supabase
          .from('sessions')
          .select('duration, start_time') // Select duration and start_time
          .eq('tutor_id', tutorId)
          .eq('status', 'completed')
          .gte('start_time', firstDayOfMonth)
          .lte('start_time', lastDayOfMonth);

        if (earningsError) throw new Error(`Earnings Error: ${earningsError.message}`);
        
        const tutorHourlyRate = profile?.hourly_rate || 0;
        let calculatedEarnings = 0;
        if (earningsData) {
          calculatedEarnings = earningsData.reduce((sum, session) => {
            const sessionDurationHours = (session.duration || 0) / 60.0;
            return sum + (tutorHourlyRate * sessionDurationHours);
          }, 0);
        }
        setEarnings(calculatedEarnings);

        // --- Additional Features Data ---

        // 4. Assigned Subjects
        const { data: tutorSubjectsData, error: tutorSubjectsError } = await supabase
          .from('tutor_subjects')
          .select('subjects (id, name)') // Fetches related subject details
          .eq('tutor_id', tutorId);

        if (tutorSubjectsError) throw new Error(`Assigned Subjects Error: ${tutorSubjectsError.message}`);
        // Ensure subjects is not null before mapping
        // If ts.subjects is Subject[], flatMap is needed.
        // If ts.subjects is Subject|null, map was fine, but TS error suggests nesting.
        setAssignedSubjects(
          tutorSubjectsData
            ?.flatMap(ts => ts.subjects ?? []) // Use flatMap, and handle if ts.subjects itself could be null/undefined
            .filter((s): s is Subject => !!s) // Filter out any null/undefined subjects after flattening
            ?? []
        );


        // 5. Session History (e.g., last 5 completed/cancelled sessions)
        // Explicitly define the join for student_profile using student_id
        const { data: historyData, error: historyError } = await supabase
          .from('sessions')
          .select('*, student_profile:profiles!student_id (full_name, id)')
          .eq('tutor_id', tutorId)
          .in('status', ['completed', 'cancelled'])
          .order('start_time', { ascending: false })
          .limit(5);

        if (historyError) throw new Error(`Session History Error: ${historyError.message}`);
        setSessionHistory(historyData as Session[] ?? []);

        // 6. Today's Schedule
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { data: todaysSessionsData, error: todaysSessionsError } = await supabase
          .from('sessions')
          .select('*, student_profile:profiles!student_id (full_name, id)')
          .eq('tutor_id', tutorId)
          .gte('start_time', todayStart.toISOString())
          .lte('start_time', todayEnd.toISOString())
          .in('status', ['confirmed']) // Only show confirmed sessions for today
          .order('start_time', { ascending: true });

        if (todaysSessionsError) throw new Error(`Today's Schedule Error: ${todaysSessionsError.message}`);
        setTodaysSchedule(todaysSessionsData as Session[] ?? []);

      } else {
        // Non-tutors get zeros/empty for tutor-specific stats
        setUpcomingSessions(0);
        setTotalStudents(0);
        setEarnings(0);
        setAssignedSubjects([]);
        setSessionHistory([]);
        setTodaysSchedule([]);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      // Check if error is from Supabase and has a more specific message
      const message = err.details || err.message || 'Please try again later.';
      setError(`Failed to load dashboard data. ${message}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  type QuickAction = {
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    route: '/(tabs)/tutor-dashboard/manage-courses' | 
          '/(tabs)/tutor-dashboard/availability' | 
          '/(tabs)/tutor-dashboard/notifications' | 
          '/(tabs)/search' | 
          '/(tabs)/sessions' | 
          '/(tabs)/settings' |
          '/(tabs)/tutor-dashboard/manage-subjects' | // For actual courses page
          '/(tabs)/tutor-dashboard/manage-tutor-subjects'; // For tutor's teaching subjects
  };

  const tutorActions: QuickAction[] = [
    {
      title: 'Manage Courses',
      description: 'Add, edit, or remove your course offerings',
      icon: BookOpen, // This was the original icon for courses
      route: '/(tabs)/tutor-dashboard/manage-subjects' as const, // manage-subjects is now the courses screen
    },
    {
      title: 'Manage My Teaching Subjects',
      description: 'Select the subjects you teach',
      icon: ListChecks, // Using ListChecks for subject selection
      route: '/(tabs)/tutor-dashboard/manage-tutor-subjects' as const,
    },
    {
      title: 'Set Availability',
      description: 'Update your teaching schedule',
      icon: Clock,
      route: '/(tabs)/tutor-dashboard/availability' as const,
    },
    {
      title: 'Student Notifications',
      description: 'Send updates to your students',
      icon: Bell,
      route: '/(tabs)/tutor-dashboard/notifications' as const,
    }
  ];

  const studentActions: QuickAction[] = [
    {
      title: 'Browse Courses',
      description: 'Find courses you might be interested in',
      icon: BookOpen,
      route: '/(tabs)/search' as const,
    },
    {
      title: 'My Sessions',
      description: 'View your upcoming learning sessions',
      icon: Calendar,
      route: '/(tabs)/sessions' as const,
    },
    {
      title: 'Find Tutors',
      description: 'Discover tutors for your subjects',
      icon: Users,
      route: '/(tabs)/search' as const,
    },
    {
      title: 'Settings',
      description: 'Update your preferences',
      icon: Bell,
      route: '/(tabs)/settings' as const,
    }
  ];

  const quickActions = profile?.role === 'tutor' ? tutorActions : studentActions;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#DC2626" />
        <Text style={styles.errorTitle}>Oops! Something went wrong.</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
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
          <Text style={styles.statValue}>{earnings.toFixed(2)} QAR</Text>
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
                onPress={() => router.push(action.route as any)}
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

      {/* Assigned Subjects Section */}
      {profile?.role === 'tutor' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Subjects</Text>
          {assignedSubjects.length > 0 ? (
            <View style={styles.listCard}>
              {assignedSubjects.map((subject) => (
                <View key={subject.id} style={styles.listItem}>
                  <ListChecks size={20} color="#4F46E5" style={styles.listItemIcon} />
                  <Text style={styles.listItemText}>{subject.name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <BookOpen size={48} color="#9CA3AF" />
              <Text style={styles.emptyCardTitle}>No Subjects Assigned</Text>
              <Text style={styles.emptyCardText}>
                Your assigned subjects will appear here.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Today's Schedule Section */}
      {profile?.role === 'tutor' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          {todaysSchedule.length > 0 ? (
            <View style={styles.listCard}>
              {todaysSchedule.map((session) => (
                <View key={session.id} style={styles.listItem}>
                  <Calendar size={20} color="#4F46E5" style={styles.listItemIcon} />
                  <View style={styles.sessionItemDetails}>
                    <Text style={styles.listItemTextStrong}>
                      {formatTime(session.start_time)}
                      {session.student_profile?.full_name ? ` with ${session.student_profile.full_name}` : ''}
                    </Text>
                    <Text style={styles.listItemText}>{session.subject_name || 'General Session'}</Text> 
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Calendar size={48} color="#9CA3AF" />
              <Text style={styles.emptyCardTitle}>No Sessions Today</Text>
              <Text style={styles.emptyCardText}>
                You have no tutoring sessions scheduled for today.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Session History Section (Replaces Recent Activity) */}
      {profile?.role === 'tutor' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Session History</Text>
          {sessionHistory.length > 0 ? (
            <View style={styles.listCard}>
              {sessionHistory.map((session) => (
                <View key={session.id} style={styles.listItem}>
                  <HistoryIcon size={20} color={session.status === 'completed' ? '#10B981' : '#EF4444'} style={styles.listItemIcon} />
                  <View style={styles.sessionItemDetails}>
                    <Text style={styles.listItemTextStrong}>
                      {formatDateTime(session.start_time)}
                      {session.student_profile?.full_name ? ` with ${session.student_profile.full_name}` : ''}
                    </Text>
                    <Text style={styles.listItemText}>
                      Status: <Text style={{ color: session.status === 'completed' ? '#10B981' : '#EF4444' }}>{session.status}</Text>
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <HistoryIcon size={48} color="#9CA3AF" />
              <Text style={styles.emptyCardTitle}>No Session History</Text>
              <Text style={styles.emptyCardText}>
                Your past sessions will appear here.
              </Text>
            </View>
          )}
        </View>
      )}

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
    backgroundColor: '#FFFFFF', // Changed from #F3F4F6 to #FFFFFF
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  errorTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
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
  // Styles for new sections
  listCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  listItemIcon: {
    marginRight: 12,
  },
  listItemText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  listItemTextStrong: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 2,
  },
  sessionItemDetails: {
    flex: 1,
  },
  emptyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    minHeight: 150, // Adjusted minHeight
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyCardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCardText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

// Helper functions for date/time formatting
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + formatTime(dateString);
};
