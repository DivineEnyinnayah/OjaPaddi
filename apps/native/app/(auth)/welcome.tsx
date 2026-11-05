import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  useWindowDimensions,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, ChatCircleDots, Storefront, TrendUp } from 'phosphor-react-native';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { StyledView, StyledText, StyledImage, StyledTouchableOpacity } from '@/components/ui/styled';
import { copy } from '@/constants/copy';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useResponsive } from '@/lib/responsive';

type Slide = (typeof copy.welcome.slides)[number];
const SLIDES: readonly Slide[] = copy.welcome.slides;
const LAST_INDEX = SLIDES.length - 1;
const SWIPE_DISTANCE = 45;
const SWIPE_VELOCITY = 0.4;
const PARALLAX = 0.18;
const EDGE_RESISTANCE = 0.3;
const STAGGER_STEP = 0.18;
const STAGGER_SPAN = 0.6;

function SlideIcon({ index, colors }: { index: number; colors: ReturnType<typeof useThemeColor> }) {
  const size = useResponsive().scale(96);
  if (index === 0) return <Storefront size={size} color={colors.primary} weight="duotone" />;
  if (index === 1) return <ChatCircleDots size={size} color={colors.secondary} weight="duotone" />;
  return <TrendUp size={size} color={colors.primary} weight="duotone" />;
}

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { width: screenWidth } = useWindowDimensions();
  const responsive = useResponsive();

  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.Value(0)).current;
  const entrance = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);
  indexRef.current = index;

  const playEntrance = useCallback(() => {
    entrance.setValue(0);
    Animated.timing(entrance, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    playEntrance();
  }, [playEntrance]);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(LAST_INDEX, next));
      if (clamped === indexRef.current) {
        position.setValue(clamped);
        return;
      }
      setIndex(clamped);
      playEntrance();
      if (Platform.OS === 'ios' || Platform.OS === 'android') Vibration.vibrate(8);
      Animated.spring(position, {
        toValue: clamped,
        useNativeDriver: true,
        damping: 26,
        stiffness: 260,
        mass: 0.8,
      }).start();
    },
    [position, playEntrance],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
        onPanResponderMove: (_evt, gesture) => {
          const raw = indexRef.current - gesture.dx / screenWidth;
          if (raw < 0) position.setValue(raw * EDGE_RESISTANCE);
          else if (raw > LAST_INDEX) position.setValue(LAST_INDEX + (raw - LAST_INDEX) * EDGE_RESISTANCE);
          else position.setValue(raw);
        },
        onPanResponderRelease: (_evt, gesture) => {
          let next = indexRef.current;
          if (gesture.dx <= -SWIPE_DISTANCE || gesture.vx <= -SWIPE_VELOCITY) next = indexRef.current + 1;
          else if (gesture.dx >= SWIPE_DISTANCE || gesture.vx >= SWIPE_VELOCITY) next = indexRef.current - 1;
          goTo(next);
        },
      }),
    [goTo, position, screenWidth],
  );

  const stagger = useCallback(
    (i: number) => {
      const start = i * STAGGER_STEP;
      const end = Math.min(start + STAGGER_SPAN, 1);
      return {
        opacity: entrance.interpolate({ inputRange: [start, end], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [
          {
            translateY: entrance.interpolate({
              inputRange: [start, end],
              outputRange: [18, 0],
              extrapolate: 'clamp',
            }),
          },
        ],
      };
    },
    [entrance],
  );

  const trackRange = useMemo(() => [0, LAST_INDEX], []);
  const slideTranslateX = position.interpolate({
    inputRange: trackRange,
    outputRange: [0, -screenWidth * LAST_INDEX],
    extrapolate: 'clamp',
  });
  const illustrationTranslateX = position.interpolate({
    inputRange: trackRange,
    outputRange: [screenWidth * PARALLAX, -screenWidth * PARALLAX],
    extrapolate: 'clamp',
  });

  const heroSize = Math.round(Math.min(Math.max(screenWidth * 0.58, 176), 244));

  return (
    <Container isScrollable={false} withSafeAreaTop={true} className="px-6 py-4 bg-background">
      {/* Brand lockup — never use remote assets when the app already ships the logo. */}
      <StyledView className="flex-row items-center">
        <StyledImage
          source={require('@/assets/images/logo-lockup.png')}
          resizeMode="contain"
          style={{ width: responsive.scale(172), height: responsive.scale(44) }}
          accessibilityLabel="OjaPaddi"
        />
      </StyledView>

      <Animated.View style={{ marginTop: 10 }} {...panResponder.panHandlers}>
        <Animated.View
          style={{
            width: screenWidth * SLIDES.length,
            flexDirection: 'row',
            transform: [{ translateX: slideTranslateX }],
          }}
        >
          {SLIDES.map((slide, i) => (
            <StyledView
              key={slide.title}
              style={{ width: screenWidth }}
              className="items-center justify-center px-6"
              accessibilityElementsHidden={i !== index}
              importantForAccessibility={i === index ? 'yes' : 'no-hide-descendants'}
            >
              <Animated.View style={{ transform: [{ translateX: illustrationTranslateX }] }}>
                <StyledView
                  style={{ width: heroSize, height: heroSize }}
                  className="mb-4 rounded-[28px] bg-surface-container-lowest border border-outline-variant items-center justify-center shadow-sm"
                >
                  <StyledView className="absolute right-4 top-4 size-4 rounded-full bg-secondary" />
                  <SlideIcon index={i} colors={colors} />
                </StyledView>
              </Animated.View>

              <Animated.View style={[{ alignItems: 'center' }, stagger(0)]}>
                <StyledText className="text-label-caps text-primary mb-3">
                  {copy.welcome.eyebrow}
                </StyledText>
                <StyledText className="text-h1 font-extrabold text-on-surface text-center text-balance tracking-tight">
                  {slide.title}
                </StyledText>
              </Animated.View>

              <Animated.View style={[stagger(1), { marginTop: 12 }]}>
                <StyledText className="text-body-lg text-on-surface-variant text-center text-pretty leading-6">
                  {slide.body}
                </StyledText>
              </Animated.View>
            </StyledView>
          ))}
        </Animated.View>
      </Animated.View>

      {/* Progress dots — also the non-gesture way to move between slides. */}
      <StyledView className="flex-row items-center justify-center gap-2 my-5">
        {SLIDES.map((slide, i) => {
          const isActive = i === index;
          return (
            <StyledTouchableOpacity
              key={slide.title}
              onPress={() => goTo(i)}
              accessibilityRole="button"
              accessibilityLabel={copy.welcome.slideLabel.replace('{current}', String(i + 1)).replace('{total}', String(SLIDES.length))}
              accessibilityState={{ selected: isActive }}
              hitSlop={12}
            >
              <StyledView
                className={`h-2 rounded-full ${isActive ? 'w-8 bg-primary' : 'w-2 bg-outline-variant'}`}
              />
            </StyledTouchableOpacity>
          );
        })}
      </StyledView>

      <StyledView className="flex-row flex-wrap gap-2 justify-center mb-4 opacity-90">
        {['Live ledger', 'WhatsApp receipt', 'Offline-ready'].map((label) => (
          <StyledView key={label} className="rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5">
            <StyledText className="text-label-sm font-label text-on-surface-variant">{label}</StyledText>
          </StyledView>
        ))}
      </StyledView>

      <StyledView className="gap-3">
        <Button size="lg" variant="primary" onPress={() => router.push('/register')}>
          <StyledView className="flex-row items-center gap-2">
            <StyledText className="text-h3 text-on-primary font-extrabold">{copy.welcome.getStarted}</StyledText>
            <ArrowRight size={22} color={colors.onPrimary} weight="bold" />
          </StyledView>
        </Button>

        <StyledTouchableOpacity
          className="items-center justify-center h-12"
          onPress={() => router.push('/login')}
          accessibilityRole="button"
        >
          <StyledText className="text-body-lg text-on-surface-variant">{copy.welcome.signIn}</StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      <StyledText className="text-label-caps text-on-surface-variant text-center opacity-70 mt-6">
        {copy.welcome.footer}
      </StyledText>
    </Container>
  );
}
