import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { withUniwind } from 'uniwind';
import { ILLUSTRATIONS } from '@/constants/illustrations';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledImage = withUniwind(Image);

const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'Your Market Friend',
    description: 'Easily manage your products, track sales, and keep your business organized in one place.',
    image: ILLUSTRATIONS.welcomeStore,
  },
  {
    id: '2',
    title: 'WhatsApp Native',
    description: 'Share your product catalog and individual items directly to your customers via WhatsApp.',
    image: ILLUSTRATIONS.welcomeChat,
  },
  {
    id: '3',
    title: 'Grow Smarter',
    description: 'Get clear insights into your best-selling products and business growth with simple analytics.',
    image: ILLUSTRATIONS.welcomeGrowth,
  },
  {
    id: '4',
    title: 'Free Forever',
    description: 'Start for free and grow. Our generous free tier is built for every Nigerian retail seller.',
    image: ILLUSTRATIONS.welcomeGift,
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);

  const slideWidth = screenWidth - 48; // Total width minus px-6 on both sides

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / slideWidth);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  return (
    <Container isScrollable={false} withSafeAreaTop={true} className="flex justify-between px-6 py-6">
      <StyledView className="flex-1 items-center justify-center">
        <StyledView style={{ width: slideWidth }} className="h-[380px]">
          <FlatList
            data={ONBOARDING_SLIDES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyExtractor={(item) => item.id}
            getItemLayout={(_, index) => ({
              length: slideWidth,
              offset: slideWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <StyledView style={{ width: slideWidth }} className="items-center justify-center px-4">
                <StyledView className="w-[140px] h-[140px] rounded-[40px] bg-primary-container/20 justify-center items-center mb-6">
                  <StyledImage
                    source={{ uri: item.image }}
                    className="w-[100px] h-[100px]"
                    resizeMode="contain"
                  />
                </StyledView>
                <StyledText className="text-[26px] text-on-surface text-center mb-3 font-bold tracking-tight">
                  {item.title}
                </StyledText>
                <StyledText className="text-body-lg text-on-surface-variant text-center leading-6 px-2">
                  {item.description}
                </StyledText>
              </StyledView>
            )}
          />
        </StyledView>

        <StyledView className="flex-row gap-2 mt-4">
          {ONBOARDING_SLIDES.map((_, index) => (
            <StyledView
              key={index}
              className={`h-2 rounded-full transition-all duration-200 ${
                index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-outline-variant'
              }`}
            />
          ))}
        </StyledView>
      </StyledView>

      <StyledView className="gap-3 mb-4 mt-6">
        <Button size="lg" variant="primary" onPress={() => router.push('/register')}>
          Get Started
        </Button>

        <TouchableOpacity
          className="items-center py-2.5"
          onPress={() => router.push('/login')}
          activeOpacity={0.7}
        >
          <StyledText className="text-body-lg text-primary font-semibold">
            I already have an account
          </StyledText>
        </TouchableOpacity>
      </StyledView>
    </Container>
  );
}
