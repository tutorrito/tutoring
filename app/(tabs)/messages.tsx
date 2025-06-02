import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native'; // Added Image
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth'; // Ensure useAuth is imported
import { Database } from '@/types/supabase';
import { MessageCircle } from 'lucide-react-native'; // Icon for messages

// Custom profile type for conversations to include avatar URL
type ProfileForConversation = Database['public']['Tables']['profiles']['Row'] & {
  avatar_public_url?: string | null;
};

type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  tutor_profiles: ProfileForConversation | null;
  student_profiles: ProfileForConversation | null;
  sessions: (Database['public']['Tables']['sessions']['Row'] & {
    courses: (Database['public']['Tables']['courses']['Row'] & {
      subjects: Database['public']['Tables']['subjects']['Row'] | null;
    }) | null;
  }) | null;
  messages: { count: number }[] | null; // For unread count, simplified for now
};

export default function MessagesScreen() {
  const { user, profile } = useAuth(); // Destructure profile from useAuth
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          tutor_profiles:profiles!conversations_tutor_id_fkey (id, full_name),
          student_profiles:profiles!conversations_student_id_fkey (id, full_name),
          sessions (
            id,
            start_time,
            courses (
              id,
              title,
              subjects (id, name)
            )
          ),
          messages (count)
        `)
        .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error; // Re-throw to be caught by outer catch
      } 
      
      if (data) {
        const conversationsWithAvatars = await Promise.all(
          data.map(async (convo) => {
            const enrichedConvo = { ...convo } as Conversation; // Cast to ensure type safety

            // Fetch tutor avatar
            if (enrichedConvo.tutor_profiles && enrichedConvo.tutor_profiles.id) {
              try {
                const { data: tutorImageData, error: tutorImageError } = await supabase
                  .from('profile_images')
                  .select('image_path')
                  .eq('user_id', enrichedConvo.tutor_profiles.id)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();

                if (tutorImageError && tutorImageError.code !== 'PGRST116') {
                  console.warn(`[MessagesScreen] Error fetching tutor avatar for ${enrichedConvo.tutor_profiles.id}:`, tutorImageError.message);
                } else if (tutorImageData?.image_path && enrichedConvo.tutor_profiles) {
                  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(tutorImageData.image_path);
                  enrichedConvo.tutor_profiles.avatar_public_url = publicUrlData?.publicUrl;
                }
              } catch (e) {
                console.warn(`[MessagesScreen] Exception fetching tutor avatar for ${enrichedConvo.tutor_profiles.id}:`, e);
              }
            }

            // Fetch student avatar
            if (enrichedConvo.student_profiles && enrichedConvo.student_profiles.id) {
              try {
                const { data: studentImageData, error: studentImageError } = await supabase
                  .from('profile_images')
                  .select('image_path')
                  .eq('user_id', enrichedConvo.student_profiles.id)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();

                if (studentImageError && studentImageError.code !== 'PGRST116') {
                  console.warn(`[MessagesScreen] Error fetching student avatar for ${enrichedConvo.student_profiles.id}:`, studentImageError.message);
                } else if (studentImageData?.image_path && enrichedConvo.student_profiles) {
                  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(studentImageData.image_path);
                  enrichedConvo.student_profiles.avatar_public_url = publicUrlData?.publicUrl;
                }
              } catch (e) {
                console.warn(`[MessagesScreen] Exception fetching student avatar for ${enrichedConvo.student_profiles.id}:`, e);
              }
            }
            return enrichedConvo;
          })
        );
        setConversations(conversationsWithAvatars);
      } else {
        setConversations([]);
      }
    } catch (e) {
      console.error('Unexpected error fetching conversations:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const renderItem = ({ item }: { item: Conversation }) => {
    const otherUser = user?.id === item.student_id ? item.tutor_profiles : item.student_profiles;
    const courseName = item.sessions?.courses?.title || 'Course details unavailable';
    const subjectName = item.sessions?.courses?.subjects?.name || 'N/A';
    // const unreadCount = item.messages?.[0]?.count || 0; // Placeholder for unread logic

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => router.push(`/chat/${item.id}` as any)}
      >
        {otherUser?.avatar_public_url ? (
          <Image source={{ uri: otherUser.avatar_public_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {otherUser?.full_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.conversationDetails}>
          <Text style={styles.userName}>{otherUser?.full_name || 'Unknown User'}</Text>
          <Text style={styles.courseName}>{courseName} - {subjectName}</Text>
          <Text style={styles.lastMessagePreview} numberOfLines={1}>
            {/* Placeholder for last message preview */}
            Tap to view messages...
          </Text>
        </View>
        {/* {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )} */}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MessageCircle size={48} color="#D1D5DB" />
        <Text style={styles.emptyStateText}>Please log in to view your messages.</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/sign-in')}>
            <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (conversations.length === 0) {
    // Check if the user is a tutor
    if (profile?.role === 'tutor') {
      return (
        <View style={[styles.container, styles.centered]}>
          <MessageCircle size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>No student conversations yet.</Text>
          <Text style={styles.emptyStateSubText}>
            Your profile is visible to students. Once a student books a session with you, a conversation will appear here.
          </Text>
          {/* Optionally, add a button to go to their dashboard or manage courses */}
          <TouchableOpacity style={styles.findTutorButton} onPress={() => router.push('/(tabs)/tutor-dashboard')}>
            <Text style={styles.findTutorButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      // Default message for students or users with other roles
      return (
        <View style={[styles.container, styles.centered]}>
          <MessageCircle size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>No conversations yet.</Text>
          <Text style={styles.emptyStateSubText}>Book a session to start chatting with a tutor.</Text>
          <TouchableOpacity style={styles.findTutorButton} onPress={() => router.push('/(tabs)/search')}>
            <Text style={styles.findTutorButtonText}>Find a Tutor</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  return (
    <View style={styles.container}>
       <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F46E5"]} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light gray background
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 60, // Adjust for status bar
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#1F2937',
  },
  listContentContainer: {
    paddingVertical: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB', // Placeholder color
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#4B5563',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  conversationDetails: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 2,
  },
  courseName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  lastMessagePreview: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  unreadBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
  },
  emptyStateText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    marginTop: 24,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  loginButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  findTutorButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  findTutorButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
