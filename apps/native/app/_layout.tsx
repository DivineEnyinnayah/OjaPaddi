import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { isInitialized, accessToken } = useAuthStore();

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!accessToken && !inAuthGroup) {
      // Not logged in, redirect to welcome
      router.replace('/(auth)/welcome');
    } else if (accessToken && inAuthGroup) {
      // Logged in, redirect to tabs
      router.replace('/(tabs)');
    }
  }, [isInitialized, accessToken, segments]);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
