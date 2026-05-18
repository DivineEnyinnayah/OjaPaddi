import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>OjaPaddi</Text>
          </View>
          <Text style={styles.title}>Your Market Friend</Text>
          <Text style={styles.subtitle}>Manage, Sell & Grow Your Business.</Text>
        </View>

        <View style={styles.actions}>
          <Button
            size="lg"
            style={styles.primaryButton}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Button>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAF3', // Updated to Market Core background
  },
  content: {
    flex: 1,
    paddingHorizontal: 16, // Changed to 16px to match standard margin
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 30, // Could be adjusted but leaving for logo
    backgroundColor: '#1A6B3C', // Primary Green
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#181D19', // on-surface
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#404940', // on-surface-variant
    textAlign: 'center',
  },
  actions: {
    gap: 16,
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 12, // Changed from 16px to 12px
    height: 56,
    backgroundColor: '#1A6B3C',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'center',
  },
  secondaryButton: {
    paddingVertical: 16,  
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#1A6B3C', // Primary Green
    fontWeight: '600',
  },
});
