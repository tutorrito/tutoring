import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function TutorDashboardLayout() {
  const { profile } = useAuth();
  
  useEffect(() => {
    if (profile && profile.role !== 'tutor') {
      router.replace('/(tabs)');
    }
  }, [profile]);

  if (profile?.role !== 'tutor') {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="availability" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="manage-courses" />
    </Stack>
  );
}