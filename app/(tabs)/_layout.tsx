import { Tabs } from 'expo-router';
import { Chrome as Home, Search, Calendar, GraduationCap, Settings } from 'lucide-react-native'; // Keep Settings import
import { Text } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const { profile } = useAuth();
  const isTutor = profile?.role === 'tutor';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarLabel: ({ children, color }) => (
          <Text style={{ color, fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 4 }}>
            {children}
          </Text>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
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
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      {isTutor && (
        <Tabs.Screen
          name="tutor-dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <GraduationCap size={size} color={color} />,
          }}
        />
      )}
      {/* Add the settings tab back */}
      <Tabs.Screen
        name="settings" // Correct name for the settings screen file
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

