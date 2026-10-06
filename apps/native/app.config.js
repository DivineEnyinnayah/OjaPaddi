import 'dotenv/config';

export default {
  expo: {
    scheme: 'ojapaddi',
    userInterfaceStyle: 'automatic',
    orientation: 'portrait',
    icon: './assets/images/iconi.png',
    newArchEnabled: false,
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.ojapaddi.app',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#FFFBF5',
      },
      package: 'com.ojapaddi.app',
      permissions: ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
    },
    web: {
      bundler: 'metro',
      favicon: './assets/images/favicon.png',
    },
    name: 'OjaPaddi',
    owner: 'iamdivine',
    slug: 'ojapaddi',
    plugins: [
      'expo-font',
      'expo-router',
      'expo-web-browser',
      'expo-secure-store',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '01e04008-fa62-4bf6-ab0d-15726beab31f',
      },
      // Embedded at build time for native builds
      EXPO_PUBLIC_SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL,
      EXPO_PUBLIC_DEV_MODE: process.env.EXPO_PUBLIC_DEV_MODE === 'true',
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};