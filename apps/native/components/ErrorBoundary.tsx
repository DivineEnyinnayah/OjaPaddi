import React, { Component, ErrorInfo, ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { colorTokens } from "@/constants/tokens";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

// This boundary renders above the theme provider, so it resolves the light
// token values directly rather than through a hook.
const DANGER = colorTokens.danger.light;
const CARD = colorTokens.card.light;

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
 * This sits *above* the theme provider, so it must not depend on it: it is
 * styled with FigCraft token classes only (no hook, no hardcoded palette).
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
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <StyledView className="flex-1 items-center justify-center bg-background p-6">
          <StyledView className="w-full max-w-[360px] items-center rounded-card bg-card p-8">
            <StyledView className="mb-5 h-20 w-20 items-center justify-center rounded-pill bg-danger-soft">
              <Ionicons name="warning-outline" size={48} color={DANGER} />
            </StyledView>

            <StyledText className="mb-3 text-center font-title text-card-title text-ink">
              Something went wrong
            </StyledText>

            <StyledText className="mb-6 text-center font-body text-body-sm text-muted">
              The app encountered an unexpected error.{"\n"}
              Tap the button below to try again.
            </StyledText>

            {__DEV__ && this.state.error ? (
              <StyledText
                className="mb-5 w-full rounded-input bg-danger-soft p-3 font-ledger text-micro text-danger"
                numberOfLines={6}
              >
                {this.state.error.message}
              </StyledText>
            ) : null}

            <StyledTouchableOpacity
              onPress={this.handleRetry}
              accessibilityRole="button"
              accessibilityLabel="Try again"
              className="min-h-14 flex-row items-center gap-2 rounded-button bg-brand px-7"
            >
              <Ionicons name="refresh-outline" size={20} color={CARD} />
              <StyledText className="font-label text-body text-card">Try Again</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      );
    }

    return this.props.children;
  }
}
