import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Container isScrollable={false} className="justify-between px-4 py-10">
      <StyledView className="flex-1 items-center mt-16">
        <StyledView className="w-[120px] h-[120px] rounded-[30px] bg-primary justify-center items-center mb-6">
          <StyledText className="text-on-primary text-h1">OjaPaddi</StyledText>
        </StyledView>
        <StyledText className="text-display text-on-surface text-center mb-2 tracking-tight">Your Market Friend</StyledText>
        <StyledText className="text-body-lg text-on-surface-variant text-center">Manage, Sell & Grow Your Business.</StyledText>
      </StyledView>

      <StyledView className="gap-4 mb-5">
        <Button size="lg" variant="primary" onPress={() => router.push('/register')}>
          Get Started
        </Button>

        <Button size="lg" variant="secondary" className="border-0" onPress={() => router.push('/login')}>
          I already have an account
        </Button>
      </StyledView>
    </Container>
  );
}
