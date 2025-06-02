import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, CheckCheck, Clock, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/supabase';
import { formatDistanceToNowStrict } from 'date-fns';

type Notification = Tables<'notifications'>;

export default function NotificationsScreen() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        Alert.alert('Error', 'Could not load notifications.');
      } else {
        setNotifications(data || []);
      }
    } catch (err) {
      console.error('Catch Error fetching notifications:', err);
      Alert.alert('Error', 'An unexpected error occurred while fetching notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();

    // Real-time subscription for new notifications
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on<Notification>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New notification received:', payload.new);
          setNotifications((prevNotifications) => {
            // Avoid duplicates if fetchNotifications runs close to a real-time event
            if (prevNotifications.find(n => n.id === payload.new.id)) {
              return prevNotifications;
            }
            // Add new notification to the top of the list
            return [payload.new, ...prevNotifications]; 
          });
          // Here you might also want to trigger a global state update for a badge count
        }
      )
      .on<Notification>( // Also listen for updates, e.g., if a notification is marked as read elsewhere
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Notification updated:', payload.new);
          setNotifications((prevNotifications) =>
            prevNotifications.map((n) =>
              n.id === payload.new.id ? { ...n, ...payload.new } : n
            )
          );
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to notifications channel for user ${user.id}`);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Notification channel error:', err);
          // Potentially try to resubscribe or inform the user
        }
      });

    return () => {
      supabase.removeChannel(channel);
      console.log(`Unsubscribed from notifications channel for user ${user.id}`);
    };
  }, [fetchNotifications, user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        Alert.alert('Error', 'Could not mark notification as read.');
      } else {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!user?.id || notifications.every(n => n.is_read)) return;

    const unreadNotificationIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadNotificationIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .in('id', unreadNotificationIds);

      if (error) {
        Alert.alert('Error', 'Could not mark all notifications as read.');
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        Alert.alert('Success', 'All notifications marked as read.');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred while marking all as read.');
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'arrival_update':
        return <Clock size={20} color="#4F46E5" />;
      case 'new_message':
        return <Bell size={20} color="#10B981" />;
      case 'session_reminder':
        return <Clock size={20} color="#F59E0B" />;
      case 'booking_confirmed':
        return <CheckCheck size={20} color="#10B981" />;
      case 'booking_cancelled':
        return <AlertCircle size={20} color="#EF4444" />;
      default:
        return <Bell size={20} color="#6B7280" />;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F46E5"]} />}
    >
      <View style={styles.header}>
        {/* Assuming this screen is part of a tab navigator, a back button might not be standard.
            If it can be pushed onto a stack, then router.back() is fine.
            For now, let's keep it simple. A title is sufficient. */}
        <Text style={styles.title}>Notifications</Text>
        {notifications.some(n => !n.is_read) && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllReadButton}>
            <Text style={styles.markAllReadText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.centered}>
          <Bell size={48} color="#D1D5DB" />
          <Text style={styles.noNotificationsText}>You have no notifications yet.</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {notifications.map(notification => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.is_read && styles.unreadCard,
              ]}
              onPress={() => !notification.is_read && handleMarkAsRead(notification.id)}
              // Optionally, navigate to a relevant screen based on notification type/metadata
              // onPress={() => router.push(`/some-detail-screen/${notification.metadata?.related_id}`)}
            >
              <View style={styles.notificationIcon}>
                {getIconForType(notification.type)}
              </View>
              <View style={styles.notificationTextContainer}>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                {notification.metadata && (notification.metadata as any).tutor_name && (
                  <Text style={styles.notificationMeta}>
                    From: {(notification.metadata as any).tutor_name}
                  </Text>
                )}
                {notification.metadata && (notification.metadata as any).estimated_time && (
                  <Text style={styles.notificationMeta}>
                    ETA: {(notification.metadata as any).estimated_time}
                  </Text>
                )}
                <Text style={styles.notificationTime}>
                  {formatDistanceToNowStrict(new Date(notification.created_at), { addSuffix: true })}
                </Text>
              </View>
              {!notification.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light background for the page
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1F2937',
  },
  markAllReadButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
  },
  markAllReadText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#4F46E5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  noNotificationsText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent', // Default for read
  },
  unreadCard: {
    borderLeftColor: '#4F46E5', // Accent color for unread
    backgroundColor: '#EEF2FF', // Slightly different background for unread
  },
  notificationIcon: {
    marginRight: 12,
    padding: 8,
    backgroundColor: '#E0E7FF', // Light background for icon container
    borderRadius: 20, // Circular background for icon
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationMessage: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  notificationTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
    marginLeft: 10,
  },
});
