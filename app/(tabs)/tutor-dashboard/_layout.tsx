import { Stack } from 'expo-router';

export default function TutorDashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="availability" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="manage-subjects" />
      <Stack.Screen name="manage-tutor-subjects" />
    </Stack>
  );
}
