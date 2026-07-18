import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { Input } from '@/components/ui/input';
import { withUniwind } from 'uniwind';
import { ILLUSTRATIONS } from '@/constants/illustrations';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

const FEATURES = [
  'Unlimited products',
  'Unlimited customers',
  'Custom analytics date range',
  'Up to 3 staff accounts',
  'Up to 5 product images',
];

const COMPARISON_ROWS = [
  { label: 'Products', free: '50', pro: 'Unlimited' },
  { label: 'Customers', free: '100', pro: 'Unlimited' },
  { label: 'Analytics Range', free: '30 days', pro: 'Custom' },
  { label: 'Staff Accounts', free: '0', pro: '3' },
  { label: 'Product Images', free: '1', pro: '5' },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNotify = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    Alert.alert(
      "You're on the list!",
      'We will notify you at ' + email.trim() + ' when billing is ready.'
    );
    setEmail('');
  };

  return (
    <Container isScrollable className="bg-background">
      <StyledView className="px-6 pt-14">
        <StyledView className="flex-row items-center mb-6">
          <StyledTouchableOpacity onPress={() => router.back()} className="w-12 h-12 mr-2 justify-center">
            <Ionicons name="arrow-back" size={26} color={colors.onSurface} />
          </StyledTouchableOpacity>
          <StyledText className="text-2xl font-bold text-on-surface flex-1">Upgrade to Pro</StyledText>
        </StyledView>

        <StyledView className="items-center mb-8">
          <Image
            source={{ uri: ILLUSTRATIONS.upgradeCrown }}
            style={{ width: 72, height: 72 }}
            resizeMode="contain"
          />
          <StyledView className="bg-primary rounded-full px-6 py-2 mb-4 mt-3">
            <StyledText className="text-lg font-bold text-on-primary">PRO</StyledText>
          </StyledView>
          <StyledText className="text-[28px] font-black text-on-surface text-center tracking-tight leading-9">
            Unlock your business{'\n'}potential
          </StyledText>
          <StyledText className="text-base text-on-surface-variant text-center mt-3 max-w-[320px]">
            Get unlimited everything and grow your business without limits.
          </StyledText>
        </StyledView>

        <StyledView className="mb-8">
          {FEATURES.map((feature, index) => (
            <StyledView key={index} className="flex-row items-center mb-3">
              <StyledView className="w-6 h-6 rounded-full bg-primary-container items-center justify-center mr-3">
                <MaterialIcons name="check" size={16} color={colors.primary} />
              </StyledView>
              <StyledText className="text-base text-on-surface">{feature}</StyledText>
            </StyledView>
          ))}
        </StyledView>

        <StyledText className="text-lg font-bold text-on-surface mb-4">Choose your plan</StyledText>

        <StyledTouchableOpacity
          className={`rounded-card p-5 mb-3 border-2 ${
            selectedPlan === 'monthly'
              ? 'bg-primary-container border-primary'
              : 'bg-surface-container-lowest border-outline-variant'
          }`}
          onPress={() => setSelectedPlan('monthly')}
          activeOpacity={0.7}
        >
          <StyledView className="flex-row justify-between items-center">
            <StyledView className="flex-1 mr-4">
              <StyledText className={`text-lg font-bold ${selectedPlan === 'monthly' ? 'text-primary' : 'text-on-surface'}`}>
                Monthly
              </StyledText>
              <StyledText className="text-3xl font-black text-on-surface mt-1">₦3,500<StyledText className="text-body-sm text-on-surface-variant font-normal">/mo</StyledText></StyledText>
            </StyledView>
            <StyledView className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              selectedPlan === 'monthly' ? 'border-primary' : 'border-outline'
            }`}>
              {selectedPlan === 'monthly' && (
                <StyledView className="w-3.5 h-3.5 rounded-full bg-primary" />
              )}
            </StyledView>
          </StyledView>
        </StyledTouchableOpacity>

        <StyledTouchableOpacity
          className={`rounded-card p-5 mb-6 border-2 ${
            selectedPlan === 'yearly'
              ? 'bg-primary-container border-primary'
              : 'bg-surface-container-lowest border-outline-variant'
          }`}
          onPress={() => setSelectedPlan('yearly')}
          activeOpacity={0.7}
        >
          <StyledView className="flex-row justify-between items-center">
            <StyledView className="flex-1 mr-4">
              <StyledView className="flex-row items-center gap-2">
                <StyledText className={`text-lg font-bold ${selectedPlan === 'yearly' ? 'text-primary' : 'text-on-surface'}`}>
                  Yearly
                </StyledText>
                <StyledView className="bg-secondary-container rounded-full px-2.5 py-0.5">
                  <StyledText className="text-label-caps font-bold text-on-secondary-container">Save 29%</StyledText>
                </StyledView>
              </StyledView>
              <StyledText className="text-3xl font-black text-on-surface mt-1">₦30,000<StyledText className="text-body-sm text-on-surface-variant font-normal">/yr</StyledText></StyledText>
              <StyledText className="text-body-sm text-on-surface-variant mt-0.5">₦2,500/month when paid yearly</StyledText>
            </StyledView>
            <StyledView className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              selectedPlan === 'yearly' ? 'border-primary' : 'border-outline'
            }`}>
              {selectedPlan === 'yearly' && (
                <StyledView className="w-3.5 h-3.5 rounded-full bg-primary" />
              )}
            </StyledView>
          </StyledView>
        </StyledTouchableOpacity>

        <Surface variant="warning" className="p-4 mb-8">
          <StyledView className="flex-row items-start">
            <MaterialIcons name="info-outline" size={20} color={colors.onSurface} />
            <StyledView className="flex-1 ml-3">
              <StyledText className="text-base font-semibold text-on-surface mb-1">Coming Soon</StyledText>
              <StyledText className="text-body-sm text-on-surface-variant leading-5">
                Payments are not yet available. Leave your email and we'll notify you when billing is ready.
              </StyledText>
            </StyledView>
          </StyledView>
        </Surface>

        <Input
          label="Email Address"
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          size="lg"
          className="mb-8"
          isDisabled={isSubmitting}
          onPress={handleNotify}
        >
          {isSubmitting ? 'Submitting...' : 'Notify Me'}
        </Button>

        <StyledText className="text-lg font-bold text-on-surface mb-4">Compare Plans</StyledText>

        <Surface variant="outline" className="p-0 mb-10 overflow-hidden">
          <StyledView className="flex-row border-b border-outline-variant/30">
            <StyledView className="flex-[2] px-4 py-3">
              <StyledText className="text-label-caps font-bold text-outline">Feature</StyledText>
            </StyledView>
            <StyledView className="flex-1 px-3 py-3 items-center border-l border-outline-variant/30">
              <StyledText className="text-label-caps font-bold text-outline">Free</StyledText>
            </StyledView>
            <StyledView className="flex-1 px-3 py-3 items-center border-l border-outline-variant/30 bg-primary-container/30">
              <StyledText className="text-label-caps font-bold text-primary">Pro</StyledText>
            </StyledView>
          </StyledView>

          {COMPARISON_ROWS.map((row, index) => (
            <StyledView
              key={row.label}
              className={`flex-row items-center ${
                index < COMPARISON_ROWS.length - 1 ? 'border-b border-outline-variant/10' : ''
              }`}
            >
              <StyledView className="flex-[2] px-4 py-3.5">
                <StyledText className="text-body-sm text-on-surface">{row.label}</StyledText>
              </StyledView>
              <StyledView className="flex-1 px-3 py-3.5 items-center border-l border-outline-variant/10">
                <StyledText className="text-body-sm text-on-surface-variant">{row.free}</StyledText>
              </StyledView>
              <StyledView className="flex-1 px-3 py-3.5 items-center border-l border-outline-variant/10 bg-primary-container/20">
                <StyledText className="text-body-sm font-semibold text-primary">{row.pro}</StyledText>
              </StyledView>
            </StyledView>
          ))}
        </Surface>
      </StyledView>
    </Container>
  );
}
