import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Clock, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const sessions = [
  {
    id: 1,
    subject: 'Advanced Calculus',
    tutor: 'Dr. Sarah Ahmed',
    datetime: 'Today, 3:00 PM',
    duration: '1 hour',
    location: 'Qatar University',
    status: 'upcoming',
  },
  {
    id: 2,
    subject: 'Quantum Physics',
    tutor: 'Prof. Mohammed Ali',
    datetime: 'Tomorrow, 2:00 PM',
    duration: '2 hours',
    location: 'Education City',
    status: 'upcoming',
  },
  {
    id: 3,
    subject: 'Organic Chemistry',
    tutor: 'Ms. Fatima Hassan',
    datetime: 'Yesterday, 4:00 PM',
    duration: '1.5 hours',
    location: 'Qatar National Library',
    status: 'completed',
  },
  {
    id: 4,
    subject: 'Linear Algebra',
    tutor: 'Dr. Ahmed Khan',
    datetime: '20 Feb, 2:00 PM',
    duration: '1 hour',
    location: 'Qatar University',
    status: 'completed',
  },
  {
    id: 5,
    subject: 'Biology',
    tutor: 'Dr. Layla Mohammed',
    datetime: '18 Feb, 11:00 AM',
    duration: '2 hours',
    location: 'Education City',
    status: 'completed',
  }
];

export default function SessionsScreen() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  const filteredSessions = sessions.filter(session => session.status === activeTab);

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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

      <View style={styles.sessionsContainer}>
        {filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              No {activeTab} sessions
            </Text>
            <Text style={styles.emptyStateMessage}>
              {activeTab === 'upcoming' 
                ? "You don't have any upcoming sessions scheduled"
                : "You haven't completed any sessions yet"}
            </Text>
          </View>
        ) : (
          filteredSessions.map((session) => (
            <TouchableOpacity key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionSubject}>{session.subject}</Text>
                <View style={[
                  styles.statusBadge,
                  session.status === 'upcoming' ? styles.upcomingBadge : styles.completedBadge
                ]}>
                  <Text style={[
                    styles.statusText,
                    session.status === 'upcoming' ? styles.upcomingText : styles.completedText
                  ]}>
                    {session.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.tutorName}>{session.tutor}</Text>
              <View style={styles.sessionMetaContainer}>
                <View style={styles.sessionMeta}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.sessionMetaText}>{session.datetime}</Text>
                </View>
                <View style={styles.sessionMeta}>
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.sessionMetaText}>{session.location}</Text>
                </View>
              </View>
              {session.status === 'upcoming' && (
                <TouchableOpacity style={styles.soonButton}>
                  <Text style={styles.soonButtonText}>Soon</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1F2937',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  sessionsContainer: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionSubject: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingBadge: {
    backgroundColor: '#EEF2FF',
  },
  completedBadge: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  upcomingText: {
    color: '#4F46E5',
  },
  completedText: {
    color: '#6B7280',
  },
  tutorName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 12,
  },
  sessionMetaContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  sessionMetaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  soonButton: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  soonButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#6B7280',
  },
});