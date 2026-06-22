import "../global.css"
import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../stores/authStore';
import { AppThemeProvider, useAppTheme } from '@/contexts/app-theme-context';
import { useThemeColor } from '@/hooks/useThemeColor';


function RootLayoutInner() {
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { isInitialized, accessToken } = useAuthStore();
  const hasRedirected = useRef(false);
  const { isDark } = useAppTheme();
  const colors = useThemeColor();


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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="receipt" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <RootLayoutInner />
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
