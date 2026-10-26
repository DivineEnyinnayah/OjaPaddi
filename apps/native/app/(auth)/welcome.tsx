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
import { ArrowRight } from 'phosphor-react-native';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { StyledView, StyledText, StyledImage, StyledTouchableOpacity } from '@/components/ui/styled';
import { ILLUSTRATIONS } from '@/constants/illustrations';
import { copy } from '@/constants/copy';
import { useThemeColor } from '@/hooks/useThemeColor';

type Slide = (typeof copy.welcome.slides)[number];

const SLIDES: readonly Slide[] = copy.welcome.slides;
const LAST_INDEX = SLIDES.length - 1;

/** Flick threshold in px / velocity for advancing a slide. */
const SWIPE_DISTANCE = 45;
const SWIPE_VELOCITY = 0.4;

/** How far the illustration drifts relative to the text, as a fraction of width. */
const PARALLAX = 0.22;

/** Fraction of the drag distance allowed past the first/last slide. */
const EDGE_RESISTANCE = 0.35;

/** Matches the stagger used on the onboarding screen so the two flows feel like one product. */
const STAGGER_STEP = 0.18;
const STAGGER_SPAN = 0.6;

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { width: screenWidth } = useWindowDimensions();

  const [index, setIndex] = useState(0);

  /** Fractional carousel position — 0, 1, 2 while idle, anything between while dragging. */
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
        // Horizontal intent only, so it never fights vertical scroll.
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
        onPanResponderMove: (_evt, gesture) => {
          const raw = indexRef.current - gesture.dx / screenWidth;
          // Rubber-band past the ends rather than letting the carousel run away.
          if (raw < 0) {
            position.setValue(raw * EDGE_RESISTANCE);
          } else if (raw > LAST_INDEX) {
            position.setValue(LAST_INDEX + (raw - LAST_INDEX) * EDGE_RESISTANCE);
          } else {
            position.setValue(raw);
          }
        },
        onPanResponderRelease: (_evt, gesture) => {
          const current = indexRef.current;
          let next = current;

          if (gesture.dx <= -SWIPE_DISTANCE || gesture.vx <= -SWIPE_VELOCITY) {
            next = current + 1;
          } else if (gesture.dx >= SWIPE_DISTANCE || gesture.vx >= SWIPE_VELOCITY) {
            next = current - 1;
          }

          goTo(next);
        },
      }),
    [goTo, position, screenWidth],
  );

  /** Fade + lift for the nth text block of the active slide. */
  const stagger = useCallback(
    (i: number) => {
      const start = i * STAGGER_STEP;
      const end = Math.min(start + STAGGER_SPAN, 1);
      return {
        opacity: entrance.interpolate({
          inputRange: [start, end],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
        transform: [
          {
            translateY: entrance.interpolate({
              inputRange: [start, end],
              outputRange: [20, 0],
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

  return (
    <Container isScrollable={false} withSafeAreaTop={true} className="px-6 py-4">
      {/* Compact brand lockup — always visible so the screen identifies itself as you swipe. */}
      <StyledView className="flex-row items-center gap-3">
        <StyledView className="w-11 h-11 rounded-2xl bg-primary-container items-center justify-center">
          <StyledImage
            source={require('@/assets/images/logo.png')}
            className="w-7 h-7"
            resizeMode="contain"
          />
        </StyledView>
        <StyledView className="flex-1">
          <StyledText className="text-body-lg font-bold text-on-surface">{copy.app.name}</StyledText>
          <StyledText className="text-label-bold text-on-surface-variant">{copy.app.tagline}</StyledText>
        </StyledView>
      </StyledView>

      {/* Carousel */}
      <StyledView className="flex-1 justify-center" {...panResponder.panHandlers}>
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
              className="items-center justify-center px-6"
              style={{ width: screenWidth }}
              accessibilityElementsHidden={i !== index}
              importantForAccessibility={i === index ? 'yes' : 'no-hide-descendants'}
            >
              <Animated.View style={{ transform: [{ translateX: illustrationTranslateX }] }}>
                <StyledView className="w-56 h-56 items-center justify-center mb-2">
                  <StyledImage
                    source={{ uri: ILLUSTRATIONS[slide.illustration] }}
                    style={{ width: 200, height: 200 }}
                    resizeMode="contain"
                  />
                </StyledView>
              </Animated.View>

              <Animated.View style={[{ alignItems: 'center' }, stagger(0)]}>
                <StyledText className="text-label-caps text-primary mb-3">
                  {copy.welcome.eyebrow}
                </StyledText>
                <StyledText className="text-h1 font-bold text-on-surface text-center text-balance">
                  {slide.title}
                </StyledText>
              </Animated.View>

              <Animated.View style={[stagger(1), { marginTop: 10 }]}>
                <StyledText className="text-body-lg text-on-surface-variant text-center text-pretty">
                  {slide.body}
                </StyledText>
              </Animated.View>
            </StyledView>
          ))}
        </Animated.View>
      </StyledView>

      {/* Progress dots — also the non-gesture way to move between slides. */}
      <StyledView className="flex-row items-center justify-center gap-2 mb-6">
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
                className={`h-2 rounded-full ${
                  isActive ? 'w-7 bg-primary' : 'w-2 bg-outline-variant'
                }`}
              />
            </StyledTouchableOpacity>
          );
        })}
      </StyledView>

      <StyledView className="gap-3">
        <Button size="lg" variant="primary" onPress={() => router.push('/register')}>
          <StyledView className="flex-row items-center gap-2">
            <StyledText className="text-h2 text-on-primary font-bold">{copy.welcome.getStarted}</StyledText>
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