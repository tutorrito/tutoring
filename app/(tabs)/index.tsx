import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function TabIndexRedirect() {
  useEffect(() => {
    // Redirect to the search tab as the new default landing page for the (tabs) group
    router.replace('/(tabs)/search');
  }, []);

  // Optionally, render a loading spinner or null while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Or your app's background color
  },
});
