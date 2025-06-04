import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router, useSegments, SplashScreen } from 'expo-router'; // Added router and useSegments
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '@/hooks/useAuth'; // Added useAuth

SplashScreen.preventAutoHideAsync();

// Component to handle navigation based on auth state
function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments(); // segments is string[] e.g. ['(auth)', 'sign-in'] or ['(tabs)', 'search'] or [] for root '/'

  useEffect(() => {
    if (loading) {
      return; // Wait until auth state is determined
    }

    // @ts-ignore - segments.length can be 0 for the root path
    const isRootPath = segments.length === 0; // True if current path is '/' (served by app/index.tsx)
    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (user) { // User is authenticated
      // If user is on the root path (app/index.tsx), in auth group, or on the old (tabs)/index, redirect to (tabs)/search
      // @ts-ignore - segments[1] can be 'index' if the route is /tabs/index
      if (isRootPath || inAuthGroup || (inTabsGroup && segments[1] === 'index')) {
        router.replace('/(tabs)/search');
      }
      // If user is already in (tabs) and not on (tabs)/index, they are likely on /search or another valid tab.
    } else { // User is not authenticated
      // If user is in a protected area (tabs or a specific chat page), redirect to the root/welcome screen
      if (inTabsGroup || (segments.length > 1 && segments[0] === 'chat' && segments[1]?.startsWith('['))) { // More robust check for chat/[id]
        router.replace('/'); // Redirect to root welcome screen (app/index.tsx)
      }
      // If user is already on root path or in auth group, they are in the correct place for unauthenticated users.
    }
  }, [user, loading, segments]);

  return null; // This component does not render anything itself
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (fontError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load application resources</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <AuthGate /> 
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Screen for individual chat */}
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      <StatusBar style="light" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontFamily: 'System',
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
  },
});
