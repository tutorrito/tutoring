import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Clock, Calendar, User, CircleAlert, Video, MessageCircle, CheckCircle, XCircle } from 'lucide-react-native'; // Added CheckCircle, XCircle
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import ErrorScreen from '@/components/ErrorScreen';
import LoadingScreen from '@/components/LoadingScreen';

// Define a type for profiles that will include the avatar public URL
type ProfileWithAvatar = {
  id: string; // ID is needed to fetch the avatar from profile_images
  full_name: string;
  avatar_public_url?: string | null; // To store the fetched public URL for the avatar
};

type Session = {
  id: string;
  subject: {
    name: string;
  };
  tutor: ProfileWithAvatar; // Use the new type
  student: ProfileWithAvatar; // Use the new type
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
          tutor:tutor_id(id, full_name),
          student:student_id(id, full_name),
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

      if (data) {
        const sessionsWithAvatars = await Promise.all(
          data.map(async (sessionItem) => {
            // Assert type for modification, as 'data' from query might not exactly match Session yet
            const typedSessionItem = sessionItem as unknown as Session;
            const updatedSession = { ...typedSessionItem };

            // Fetch tutor avatar
            if (updatedSession.tutor && updatedSession.tutor.id) {
              try {
                const { data: tutorImageData, error: tutorImageError } = await supabase
                  .from('profile_images')
                  .select('image_path')
                  .eq('user_id', updatedSession.tutor.id)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();

                if (tutorImageError && tutorImageError.code !== 'PGRST116') { // PGRST116: No rows found
                  console.warn(`[SessionsScreen] Error fetching tutor avatar for ${updatedSession.tutor.id}:`, tutorImageError.message);
                } else if (tutorImageData && tutorImageData.image_path) {
                  const { data: publicUrlData } = supabase
                    .storage
                    .from('avatars') // Assuming 'avatars' is your bucket name
                    .getPublicUrl(tutorImageData.image_path);
                  
                  if (updatedSession.tutor) { // Ensure tutor object exists
                    updatedSession.tutor.avatar_public_url = publicUrlData?.publicUrl;
                  }
                }
              } catch (e) {
                console.warn(`[SessionsScreen] Exception fetching tutor avatar for ${updatedSession.tutor.id}:`, e);
              }
            }

            // Fetch student avatar
            if (updatedSession.student && updatedSession.student.id) {
              try {
                const { data: studentImageData, error: studentImageError } = await supabase
                  .from('profile_images')
                  .select('image_path')
                  .eq('user_id', updatedSession.student.id)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();

                if (studentImageError && studentImageError.code !== 'PGRST116') { // PGRST116: No rows found
                  console.warn(`[SessionsScreen] Error fetching student avatar for ${updatedSession.student.id}:`, studentImageError.message);
                } else if (studentImageData && studentImageData.image_path) {
                  const { data: publicUrlData } = supabase
                    .storage
                    .from('avatars') // Assuming 'avatars' is your bucket name
                    .getPublicUrl(studentImageData.image_path);

                  if (updatedSession.student) { // Ensure student object exists
                    updatedSession.student.avatar_public_url = publicUrlData?.publicUrl;
                  }
                }
              } catch (e) {
                console.warn(`[SessionsScreen] Exception fetching student avatar for ${updatedSession.student.id}:`, e);
              }
            }
            return updatedSession;
          })
        );
        setSessions(sessionsWithAvatars);
      } else {
        setSessions([]);
      }
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
    router.push(`/session/${sessionId}` as any);
  };

  const handleContactParticipant = async (sessionId: string) => {
    if (!sessionId) {
      console.error("No session ID provided to handleContactParticipant");
      Alert.alert("Error", "Cannot open chat, session information is missing.");
      return;
    }
    try {
      // Find the conversation associated with this session
      const { data: conversationData, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      if (convError) {
        if (convError.code === 'PGRST116') { // No rows found
          // This case should ideally not happen if a conversation is created upon session booking.
          // For robustness, we could try to create one here, or guide the user.
          console.warn(`No conversation found for session ${sessionId}. A conversation should have been created at booking.`);
          Alert.alert("Chat Not Found", "No chat found for this session. It might not have been set up correctly.");
          // Optionally, attempt to create a conversation here if appropriate for the app flow
        } else {
          throw convError;
        }
        return;
      }

      if (conversationData && conversationData.id) {
        router.push(`/chat/${conversationData.id}` as any);
      } else {
        // Fallback if conversationData is null/undefined despite no error (shouldn't happen with .single() if no error)
         Alert.alert("Error", "Could not find the chat for this session.");
      }
    } catch (error) {
      console.error('Error navigating to chat:', error);
      Alert.alert("Error", "An error occurred while trying to open the chat.");
    }
  };

  const handleMarkAsCompleted = async (sessionId: string) => {
    if (!profile || profile.role !== 'tutor') return;

    Alert.alert(
      "Confirm Completion",
      "Are you sure you want to mark this session as completed?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Mark Completed",
          onPress: async () => {
            // Optimistically update UI or show loading state
            // For simplicity, we'll refetch after update
            setLoading(true); 
            try {
              const { error: updateError } = await supabase
                .from('sessions')
                .update({ status: 'completed' })
                .eq('id', sessionId)
                .eq('tutor_id', profile.id); // Ensure tutor can only update their own session

              if (updateError) throw updateError;

              Alert.alert("Success", "Session marked as completed.");
              fetchSessions(false); // Refetch sessions to reflect the change
            } catch (err) {
              console.error('Error marking session as completed:', err);
              Alert.alert("Error", "Could not mark session as completed. Please try again.");
              setError('Failed to update session. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!profile || profile.role !== 'tutor') return;

    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this session? This action cannot be undone.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel Session",
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error: updateError } = await supabase
                .from('sessions')
                .update({ status: 'cancelled' })
                .eq('id', sessionId)
                .eq('tutor_id', profile.id); // Ensure tutor can only update their own session

              if (updateError) throw updateError;

              Alert.alert("Success", "Session has been cancelled.");
              fetchSessions(false); // Refetch sessions
            } catch (err) {
              console.error('Error cancelling session:', err);
              Alert.alert("Error", "Could not cancel session. Please try again.");
              setError('Failed to cancel session. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
            {activeTab === 'upcoming' && profile?.role !== 'tutor' && (
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
                      style={[styles.actionButton, styles.messageButton]}
                      onPress={() => handleContactParticipant(session.id)} // Pass session.id
                    >
                      <MessageCircle size={20} color="#4F46E5" />
                      <Text style={styles.messageButtonText}>Message</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Tutor-specific actions */}
                {profile?.role === 'tutor' && session.tutor.id === profile.id && activeTab === 'upcoming' && (session.status === 'confirmed' || session.status === 'pending') && (
                  <View style={styles.tutorActionsContainer}>
                    {session.status === 'confirmed' && (
                       <TouchableOpacity
                        style={[styles.actionButton, styles.markCompleteButton]}
                        onPress={() => handleMarkAsCompleted(session.id)}
                      >
                        <CheckCircle size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Mark Completed</Text>
                      </TouchableOpacity>
                    )}
                    {(session.status === 'pending' || session.status === 'confirmed') && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => handleCancelSession(session.id)}
                      >
                        <XCircle size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Cancel Session</Text>
                      </TouchableOpacity>
                    )}
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
  tutorActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  actionButtonText: { // Generic text for new action buttons
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  markCompleteButton: {
    backgroundColor: '#10B981', // Green
  },
  cancelButton: {
    backgroundColor: '#EF4444', // Red
  },
});
