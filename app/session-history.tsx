import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Clock, MapPin, CircleAlert as AlertCircle, Calendar, User } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

type Session = {
  id: string;
  subject: {
    name: string;
  };
  tutor: {
    full_name: string;
  };
  student: {
    full_name: string;
  };
  start_time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};

type TabType = 'upcoming' | 'completed';

export default function SessionHistoryScreen() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [activeTab]);

  const fetchSessions = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      setError(null);

      const isUpcoming = activeTab === 'upcoming';
      const query = supabase
        .from('sessions')
        .select(`
          id,
          subject:subject_id(name),
          tutor:tutor_id(full_name),
          student:student_id(full_name),
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
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
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

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Please sign in to view your sessions</Text>
        <TouchableOpacity 
          style={styles.signInButton}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Session History</Text>
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
          <AlertCircle size={20} color="#DC2626" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : sessions.length === 0 ? (
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
        <ScrollView 
          style={styles.sessionsList}
          contentContainerStyle={styles.sessionsListContent}
          showsVerticalScrollIndicator={false}
        >
          {sessions.map((session) => {
            const { date, time } = formatDateTime(session.start_time);
            const isStudent = session.student.full_name === profile.full_name;

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
                      {isStudent ? `Tutor: ${session.tutor.full_name}` : `Student: ${session.student.full_name}`}
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
                  <TouchableOpacity style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>Join Session</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
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
  errorBannerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    borderRadius: 8,
  },
  findTutorButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  sessionsList: {
    flex: 1,
  },
  sessionsListContent: {
    padding: 24,
    gap: 16,
  },
  sessionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  joinButton: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  joinButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  signInButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  signInButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});