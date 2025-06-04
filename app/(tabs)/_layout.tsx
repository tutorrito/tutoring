import { Tabs } from 'expo-router';
import { Chrome as Home, Search, MessageSquare, Calendar, GraduationCap, Settings } from 'lucide-react-native';
import { Text } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import CustomTabBar from '@/components/CustomTabBar';

export default function TabLayout() {
  const { profile } = useAuth();
  const isTutor = profile?.role === 'tutor';
  const isStudent = profile?.role === 'student';

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Removed default tabBarStyle and related options as CustomTabBar will handle styling
      }}>
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Remove Home from tab bar
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
          href: isTutor ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="tutor-dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard', // Explicitly set the tab bar label
          tabBarIcon: ({ color, size }) => <GraduationCap size={size} color={color} />,
          href: isTutor ? undefined : null, // Show only for tutors
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          // tabBarIcon is handled by CustomTabBar, so not needed here
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
