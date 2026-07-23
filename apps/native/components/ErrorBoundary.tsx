import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary that catches JavaScript errors in the component tree,
 * renders a fallback UI with a retry button, and prevents the app from crashing.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In production you'd log this to a crash reporting service
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="warning-outline" size={48} color="#BA1A1A" />
            </View>

            <Text style={styles.title}>Something went wrong</Text>

            <Text style={styles.message}>
              The app encountered an unexpected error.{'\n'}
              Tap the button below to try again.
            </Text>

            {__DEV__ && this.state.error && (
              <Text style={styles.debugInfo} numberOfLines={6}>
                {this.state.error.message}
              </Text>
            )}

            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7faf3',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    maxWidth: 360,
    width: '100%',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#181d19',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#404940',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  debugInfo: {
    fontSize: 11,
    color: '#BA1A1A',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    width: '100%',
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A6B3C',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    gap: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
