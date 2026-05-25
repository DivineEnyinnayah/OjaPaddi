import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { AppThemeProvider } from '@/contexts/app-theme-context';


export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { isInitialized, accessToken } = useAuthStore();
  const hasRedirected = useRef(false);


  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);


  useEffect(() => {
    if (!isInitialized || !navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!accessToken && !inAuthGroup) {
      if (hasRedirected.current) return;
      hasRedirected.current = true;
      router.replace('/welcome');
    } else if (accessToken && inAuthGroup) {
      if (hasRedirected.current) return;
      hasRedirected.current = true;
      router.replace('/');
    }
  }, [isInitialized, accessToken, navigationState?.key, segments?.[0]]);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A6B3C" />
      </View>
    );
  }

  return (
    <AppThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AppThemeProvider>
  );
}
