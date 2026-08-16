import "../global.css"
import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState, type Href } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../stores/authStore';
import { AppThemeProvider, useAppTheme } from '@/contexts/app-theme-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ERROR_MESSAGES } from '@/constants/errorMessages';


function RootLayoutInner() {
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { isInitialized, accessToken, sessionExpired } = useAuthStore();
  const lastRedirect = useRef<Href | null>(null);
  const toast = useToast();
  const { isDark } = useAppTheme();
  const colors = useThemeColor();

  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
  });


  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);


  useEffect(() => {
    if (!isInitialized || !navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isAuthed = Boolean(accessToken);

    // Decide the correct route for the current auth state. Null = we're
    // already where we belong (authenticated outside auth group, or
    // unauthenticated inside it), so nothing to do.
    let target: Href | null = null;
    if (isAuthed && inAuthGroup) {
      target = '/';
    } else if (!isAuthed && !inAuthGroup) {
      // Expired/invalid session goes straight to sign-in; otherwise welcome.
      target = sessionExpired ? '/login' : '/welcome';
    }

    // Only act when the decided route actually changes — this replaces the
    // old one-shot `hasRedirected` guard while still allowing mid-session
    // redirects (e.g. token expiry while using the app).
    if (target && target !== lastRedirect.current) {
      lastRedirect.current = target;
      if (target === '/login') {
        toast.error(ERROR_MESSAGES.SESSION_EXPIRED, 'Session Expired');
      }
      router.replace(target);
    } else if (!target) {
      lastRedirect.current = null;
    }
  }, [isInitialized, accessToken, sessionExpired, navigationState?.key, segments?.[0]]);

  if (!isInitialized || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
          <View className="w-10 h-10 rounded-full bg-primary/20 animate-pulse" />
        </View>
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
        <Stack.Screen name="business-profile" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <ErrorBoundary>
          <ToastProvider>
            <RootLayoutInner />
          </ToastProvider>
        </ErrorBoundary>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
