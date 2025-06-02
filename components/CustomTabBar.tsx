import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/types/supabase';
import {
  Chrome as Home,
  Search,
  MessageSquare,
  Calendar,
  GraduationCap,
  Settings,
  User, // Default/fallback icon
  Bell // Notification icon
} from 'lucide-react-native';
import { ParamListBase, EventArg } from '@react-navigation/native';
import React from 'react';

type Notification = Tables<'notifications'>;

// Define CustomTabBarProps as 'any' to bypass all type checking for props
type CustomTabBarProps = any;

const iconMap: { [key: string]: React.ElementType } = {
  index: Home,
  search: Search,
  messages: MessageSquare,
  sessions: Calendar,
  notifications: Bell, // Added notification icon
  'tutor-dashboard': GraduationCap, // Keep as string if route name has hyphen
  settings: Settings,
  // Add other routes if necessary or a default
};

// Use the custom props type
export default function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread notification count:', error);
      setUnreadCount(0);
    } else {
      setUnreadCount(count || 0);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUnreadCount();

    if (!user?.id) return;

    const channel = supabase
      .channel(`custom-tab-bar-notifications:${user.id}`)
      .on<Notification>(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Notification change detected in CustomTabBar:', payload.eventType);
          // Refetch count on any change to ensure accuracy
          fetchUnreadCount();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`CustomTabBar subscribed to notifications for user ${user.id}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('CustomTabBar notification channel error:', err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      console.log(`CustomTabBar unsubscribed from notifications for user ${user.id}`);
    };
  }, [user?.id, fetchUnreadCount]);
  
  interface MappedRoute {
    key: string;
    name: string;
    params?: object;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route: MappedRoute, index: number) => {
          const isFocused = state.index === index;
          const Icon = iconMap[route.name] || User; // Fallback to User icon

          const onPress = () => {
            const event: EventArg<"tabPress", true, undefined> = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.tab, isFocused && styles.activeTab]}
            >
              <View>
                <Icon
                  size={24}
                  color={isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)'}
                  style={[
                    styles.icon,
                    isFocused && styles.activeIcon
                  ]}
                />
                {route.name === 'notifications' && unreadCount > 0 && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16, // Reverted to fixed horizontal padding
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1B85DB',
    borderRadius: 10,
    height: 40,
    width: '90%', // Make width responsive
    maxWidth: 500, // Add a max width for larger screens
    alignItems: 'center',
    justifyContent: 'space-around',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.35), 5px 10px 15px rgba(27, 133, 219, 0.5)',
      }
    }),
  },
  tab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    transform: [{translateY: -3}],
  },
  icon: {
    // Removed problematic transition property
  },
  activeIcon: {
    transform: [{scale: 1.1}],
  },
  badgeContainer: {
    position: 'absolute',
    right: -8, // Adjust as needed
    top: -4,    // Adjust as needed
    backgroundColor: '#FF3B30', // Standard iOS red badge color
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1B85DB', // Match tab bar background for a "cutout" effect
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
