import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { withUniwind } from 'uniwind';
import { useAuthStore } from '@/stores/authStore';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { useThemeColor } from '@/hooks/useThemeColor';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledMaterialIcons = withUniwind(MaterialIcons);

const PLAN_DATA = {
  free: {
    name: 'Free Plan',
    price: '₦0 / mo',
    features: [
      'Up to 50 products',
      'Up to 100 customers',
      'Basic sales recording',
      'Daily analytics',
      'WhatsApp sharing',
    ],
    limitations: [
      'Advanced reports',
      'Staff accounts',
      'Smart Recommendations (MBA)',
      'Priority support',
    ],
  },
  pro: {
    name: 'Pro Plan',
    price: '₦2,500 / mo',
    features: [
      'Unlimited products',
      'Unlimited customers',
      'Advanced sales reporting',
      'Full analytics suite',
      'WhatsApp sharing',
      'Priority support',
      'Basic MBA recommendations',
    ],
    limitations: [
      'Unlimited staff accounts',
      'Enterprise-grade API access',
    ],
  },
  growth: {
    name: 'Growth Plan',
    price: '₦7,500 / mo',
    features: [
      'Everything in Pro',
      'Unlimited staff accounts',
      'Advanced MBA recommendations',
      'Priority 24/7 support',
      'Custom business reporting',
      'Dedicated account manager',
    ],
    limitations: [],
  },
};

export default function UpgradeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColor();
  const currentPlan = user?.plan || 'free';

  const isFree = currentPlan === 'free';

  return (
    <Container isScrollable={true} withTabBar className="bg-background pt-12">
      <StyledView className="flex-row items-center px-6 py-4 mb-6">
        <StyledTouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-primary-container/20 justify-center items-center mr-4"
        >
          <StyledMaterialIcons name="arrow-back" size={20} color={colors.primary} />
        </StyledTouchableOpacity>
        <StyledText className="text-3xl font-black text-on-surface tracking-tight">
          {isFree ? 'Upgrade' : 'Subscription'}
        </StyledText>
      </StyledView>

      <StyledView className="px-6 pb-12" style={{ gap: 24 }}>
        {/* Plan Header Card */}
        <Surface variant="primary" className="p-6 rounded-3xl overflow-hidden relative">
          <StyledView className="z-10">
            <StyledText className="text-label-caps font-bold text-on-primary opacity-80 mb-1">
              {isFree ? 'Current Plan' : 'Your Active Plan'}
            </StyledText>
            <StyledText className="text-4xl font-black text-on-primary mb-2">
              {PLAN_DATA[currentPlan].name}
            </StyledText>
            <StyledText className="text-body-lg text-on-primary opacity-90">
              {isFree ? 'Start growing your business today' : `Enjoying the full power of ${PLAN_DATA[currentPlan].name}`}
            </StyledText>
          </StyledView>
          
          {/* Background Decor */}
          <StyledView 
            className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/10" 
            style={{ transform: [{ scale: 1.5 }] }} 
          />
        </Surface>

        {/* Feature List */}
        <StyledView style={{ gap: 16 }}>
          <StyledText className="text-xl font-bold text-on-surface">
            {isFree ? 'What you get with Pro' : 'Your Plan Features'}
          </StyledText>
          
          <Surface variant="primary" className="p-0 overflow-hidden rounded-2xl">
            {PLAN_DATA[isFree ? 'pro' : currentPlan].features.map((feature, index) => (
              <StyledView 
                key={index} 
                className="flex-row items-center px-5 py-4 border-b border-outline-variant/50 last:border-b-0"
              >
                <StyledMaterialIcons name="check-circle" size={20} color={colors.primary} />
                <StyledText className="flex-1 text-body-lg text-on-surface ml-3">
                  {feature}
                </StyledText>
              </StyledView>
            ))}
          </Surface>
        </StyledView>

        {/* Bottom Action */}
        {isFree ? (
          <StyledView style={{ gap: 12 }} className="mt-4">
            <StyledView className="flex-row justify-between items-center px-2">
              <StyledText className="text-body-sm text-on-surface-variant">
                Billed monthly. Cancel anytime.
              </StyledText>
              <StyledText className="text-xl font-bold text-primary">
                {PLAN_DATA.pro.price}
              </StyledText>
            </StyledView>
            
            <StyledTouchableOpacity
              className="bg-primary py-4 rounded-2xl items-center justify-center"
              onPress={() => {
                Alert.alert(
                  'Upgrade to Pro',
                  'Payment integration is coming soon. We will notify you once you can upgrade!',
                  [{ text: 'Got it' }]
                );
              }}
            >
              <StyledText className="text-on-primary font-bold text-lg">Upgrade Now</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        ) : (
          <StyledView style={{ gap: 12 }} className="mt-4">
            <StyledTouchableOpacity
              className="bg-outline-variant/30 py-4 rounded-2xl items-center justify-center border border-outline-variant/50"
              onPress={() => {}}
            >
              <StyledText className="text-on-surface-variant font-semibold text-body-lg">Manage Subscription</StyledText>
            </StyledTouchableOpacity>
            
            {currentPlan !== 'growth' && (
              <StyledTouchableOpacity
                className="bg-primary py-4 rounded-2xl items-center justify-center"
                onPress={() => {
                  Alert.alert('Coming Soon', 'Growth plan options are coming soon!');
                }}
              >
                <StyledText className="text-on-primary font-bold text-lg">Explore Growth Plan</StyledText>
              </StyledTouchableOpacity>
            )}
          </StyledView>
        )}
      </StyledView>
    </Container>
  );
}
