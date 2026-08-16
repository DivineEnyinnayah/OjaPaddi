import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendUp, Handshake, ArrowRight } from 'phosphor-react-native';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { StyledView, StyledText, StyledImage } from '@/components/ui/styled';
import { ILLUSTRATIONS } from '@/constants/illustrations';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColor();

  return (
    <Container isScrollable={false} withSafeAreaTop={true} className="flex justify-between px-4 py-6">
      <StyledView className="flex-1 items-center justify-center">
        <StyledView className="w-32 h-32 rounded-full bg-surface-container items-center justify-center p-4 mb-6">
          <StyledImage
            source={require('@/assets/images/logo.png')}
            className="w-full h-full"
            resizeMode="contain"
          />
        </StyledView>
        <StyledText className="text-display font-bold text-primary mb-2">
          OjaPaddi
        </StyledText>
        <StyledText className="text-h2 text-on-surface-variant" style={{ fontStyle: 'italic' }}>
          "Your Market Friend"
        </StyledText>
      </StyledView>

      <StyledView className="flex-row gap-4 my-6">
        <StyledView className="flex-1 h-40 bg-surface-container rounded-xl overflow-hidden border border-outline-variant/20 items-center justify-center p-3">
          <StyledImage
            source={{ uri: ILLUSTRATIONS.welcomeStore }}
            className="w-full h-full"
            resizeMode="contain"
          />
        </StyledView>
        <StyledView className="flex-1 gap-4">
          <StyledView className="flex-1 bg-surface-container-high rounded-xl border border-outline-variant/30 items-center justify-center">
            <TrendUp size={24} color={colors.primary} />
            <StyledText className="text-label-bold text-primary mt-1">Growth</StyledText>
          </StyledView>
          <StyledView className="flex-1 bg-surface-container-high rounded-xl border border-outline-variant/30 items-center justify-center">
            <Handshake size={24} color={colors.secondary} />
            <StyledText className="text-label-bold text-secondary mt-1">Trust</StyledText>
          </StyledView>
        </StyledView>
      </StyledView>

      <StyledView className="gap-4 mb-4">
        <Button size="lg" variant="primary" onPress={() => router.push('/register')} className="w-full">
          <StyledView className="flex-row items-center gap-2">
            <StyledText className="text-h1 text-on-primary font-bold">Get Started</StyledText>
            <ArrowRight size={22} color={colors.onPrimary} />
          </StyledView>
        </Button>

        <TouchableOpacity
          className="items-center justify-center h-12"
          onPress={() => router.push('/login')}
          activeOpacity={0.7}
        >
          <StyledText className="text-label-bold text-primary">I have an account</StyledText>
        </TouchableOpacity>
      </StyledView>

      <StyledText className="text-label-caps text-on-surface-variant text-center opacity-70">
        Empowering Retail Entrepreneurs Everywhere
      </StyledText>
    </Container>
  );
}