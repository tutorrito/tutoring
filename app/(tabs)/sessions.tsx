import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import { Clock, Calendar, User, CircleAlert, Video, MessageCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import ErrorScreen from '@/components/ErrorScreen';
import LoadingScreen from '@/components/LoadingScreen';

type Session = {
  id: string;
  subject: {
    name: string;
  };
  tutor: {
    full_name: string;
    avatar_url: string | null;
  };
  student: {
    full_name: string;
    avatar_url: string | null;
  };
  start_time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};

type TabType = 'upcoming' | 'completed';

export default function SessionsScreen() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async (showLoading = true) => {
    if (!profile) return;

    try {
      if (showLoading) setLoading(true);
      setError(null);

      const isUpcoming = activeTab === 'upcoming';
      const query = supabase
        .from('sessions')
        .select(`
          id,
          subject:subject_id(name),
          tutor:tutor_id(full_name, avatar_url),
          student:student_id(full_name, avatar_url),
          start_time,
          duration,
          status
        `)
        .or(`tutor_id.eq.${profile.id},student_id.eq.${profile.id}`);

      if (isUpcoming) {
        query
          .gte('start_time', new Date().toISOString())
          .in('status', ['pending', 'confirmed']);
      } else {
        query
          .lt('start_time', new Date().toISOString())
          .eq('status', 'completed');
      }

      query.order('start_time', { ascending: isUpcoming });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [activeTab, profile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions(false);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'pending':
        return '#FCD34D';
      case 'confirmed':
        return '#34D399';
      case 'completed':
        return '#60A5FA';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const handleJoinSession = (sessionId: string) => {
    // TODO: Implement video call integration
    router.push(`/session/${sessionId}`);
  };

  const handleContactParticipant = (participantId: string) => {
    router.push(`/messages/${participantId}`);
  };

  if (!profile) {
    return (
      <ErrorScreen 
        title="Sign in Required"
        message="Please sign in to view your sessions"
        onRetry={() => router.push('/(auth)/sign-in')}
      />
    );
  }

  if (loading) {
    return <LoadingScreen message="Loading your sessions..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Sessions</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <CircleAlert size={20} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchSessions()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.sessionsList}
        contentContainerStyle={styles.sessionsListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>
              No {activeTab} sessions
            </Text>
            <Text style={styles.emptyStateText}>
              {activeTab === 'upcoming' 
                ? "You don't have any upcoming sessions scheduled"
                : "You haven't completed any sessions yet"}
            </Text>
            {activeTab === 'upcoming' && (
              <TouchableOpacity 
                style={styles.findTutorButton}
                onPress={() => router.push('/(tabs)/search')}
              >
                <Text style={styles.findTutorButtonText}>Find a Tutor</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          sessions.map((session) => {
            const { date, time } = formatDateTime(session.start_time);
            const isStudent = session.student.full_name === profile.full_name;
            const otherParticipant = isStudent ? session.tutor : session.student;

            return (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.subjectName}>{session.subject.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}>
                    <Text style={styles.statusText}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.sessionInfo}>
                  <View style={styles.infoRow}>
                    <User size={16} color="#6B7280" />
                    <Text style={styles.infoText}>
                      {isStudent ? `Tutor: ${otherParticipant.full_name}` : `Student: ${otherParticipant.full_name}`}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={styles.infoText}>{date}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Clock size={16} color="#6B7280" />
                    <Text style={styles.infoText}>
                      {time} ({session.duration} hour{session.duration > 1 ? 's' : ''})
                    </Text>
                  </View>
                </View>

                {session.status === 'confirmed' && activeTab === 'upcoming' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.joinButton]}
                      onPress={() => handleJoinSession(session.id)}
                    >
                      <Video size={20} color="#FFFFFF" />
                      <Text style={styles.joinButtonText}>Join Session</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, styles.messageButton]}
                      onPress={() => handleContactParticipant(otherParticipant.full_name)}
                    >
                      <MessageCircle size={20} color="#4F46E5" />
                      <Text style={styles.messageButtonText}>Message</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 24,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  sessionsList: {
    flex: 1,
  },
  sessionsListContent: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 120 : 90, // Extra padding for bottom tab bar
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  findTutorButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  findTutorButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  sessionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subjectName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  sessionInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4B5563',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  joinButton: {
    backgroundColor: '#4F46E5',
  },
  joinButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  messageButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  messageButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#4F46E5',
  },
});