import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { withUniwind } from 'uniwind';
import { useAuthStore } from '../../stores/authStore';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemeToggle } from '@/components/theme-toggle';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledMaterialIcons = withUniwind(MaterialIcons);

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const colors = useThemeColor();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  const getInitials = (fullName: string, email: string) => {
    if (fullName) {
      return fullName.substring(0, 2).toUpperCase();
    }
    return email ? email.charAt(0).toUpperCase() : 'O';
  };

  return (
    <Container isScrollable={true} withTabBar className="bg-background pt-12">
      <StyledView className="flex-row justify-between items-center px-6 py-4 mt-2 mb-4">
        <StyledText className="text-3xl font-black text-on-surface tracking-tight">More</StyledText>
        <ThemeToggle />
      </StyledView>

      <StyledView className="px-6 pb-6" style={{ gap: 6 }}>
        <Surface variant="primary" className="flex-row items-center px-5 py-5">
          <StyledView className="w-16 h-16 rounded-full bg-primary justify-center items-center mr-4">
            <StyledText className="text-on-primary font-bold text-xl">
              {getInitials(user?.fullName || '', user?.email || '')}
            </StyledText>
          </StyledView>
          <StyledView className="flex-1">
            <StyledText className="text-xl font-bold text-on-surface mb-1">
              {user?.fullName || 'Seller'}
            </StyledText>
            <StyledText className="text-body-sm text-on-surface-variant mb-2">
              {user?.email || ''}
            </StyledText>
            {user?.businessName && (
              <StyledView className="flex-row items-center">
                <StyledMaterialIcons name="storefront" size={16} color={colors.primary} />
                <StyledText className="text-label-caps font-semibold text-primary ml-1.5">
                  {user.businessName}
                </StyledText>
              </StyledView>
            )}
          </StyledView>
        </Surface>

        <StyledText className="text-body font-bold text-on-surface mt-5 mb-1">Business</StyledText>
        <Surface variant="primary" className="p-0 overflow-hidden">
          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4 border-b border-outline-variant/50"
            onPress={() => {}}
          >
            <StyledView className="w-10 h-10 rounded-full bg-primary-container/15 justify-center items-center mr-4">
              <StyledMaterialIcons name="work" size={20} color={colors.primary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface">Business Profile</StyledText>
            <StyledMaterialIcons name="chevron-right" size={22} color={colors.outline} />
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4 border-b border-outline-variant/50"
            onPress={() => router.push('/analytics')}
          >
            <StyledView className="w-10 h-10 rounded-full bg-primary-container/15 justify-center items-center mr-4">
              <StyledMaterialIcons name="bar-chart" size={20} color={colors.primary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface">Analytics</StyledText>
            <StyledMaterialIcons name="chevron-right" size={22} color={colors.outline} />
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4 border-b border-outline-variant/50"
            onPress={() => router.push('/upgrade')}
          >
            <StyledView className="w-10 h-10 rounded-full bg-primary-container/15 justify-center items-center mr-4">
              <StyledMaterialIcons name="stars" size={20} color={colors.primary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface">Subscription Plan</StyledText>
            <StyledView className="bg-secondary-container px-2.5 py-0.5 rounded-md mr-1">
              <StyledText className="text-label-caps font-bold text-on-surface">Pro</StyledText>
            </StyledView>
            <StyledMaterialIcons name="chevron-right" size={22} color={colors.outline} />
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4"
            onPress={() => {}}
          >
            <StyledView className="w-10 h-10 rounded-full bg-primary-container/15 justify-center items-center mr-4 opacity-50">
              <StyledMaterialIcons name="people" size={20} color={colors.primary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface opacity-50">Staff Accounts</StyledText>
            <StyledText className='text-md font-medium opacity-50'>Coming Soon</StyledText>
            <StyledView className="border border-outline-variant rounded-md px-2 py-0.5 mr-1">
              <StyledText className="text-label-caps font-medium text-on-surface-variant">Free</StyledText>
            </StyledView>
            <StyledMaterialIcons name="chevron-right" size={22} color={colors.outline} />
          </StyledTouchableOpacity>
        </Surface>

        <StyledText className="text-body font-bold text-on-surface mt-5 mb-1">Support</StyledText>
        <Surface variant="primary" className="p-0 overflow-hidden">
          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4 border-b border-outline-variant/50"
            onPress={() => {}}
          >
            <StyledView className="w-10 h-10 rounded-full bg-primary-container/15 justify-center items-center mr-4">
              <StyledMaterialIcons name="help" size={20} color={colors.primary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface">Help & Support</StyledText>
            <StyledMaterialIcons name="chevron-right" size={22} color={colors.outline} />
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4"
            onPress={() => {}}
          >
            <StyledView className="w-10 h-10 rounded-full bg-primary-container/15 justify-center items-center mr-4">
              <StyledMaterialIcons name="description" size={20} color={colors.primary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface">Privacy Policy</StyledText>
            <StyledMaterialIcons name="chevron-right" size={22} color={colors.outline} />
          </StyledTouchableOpacity>
        </Surface>

        <StyledText className="text-body font-bold text-on-surface mt-5 mb-1">Account</StyledText>
        <Surface variant="primary" className="p-0 overflow-hidden">
          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4"
            onPress={handleLogout}
          >
            <StyledView className="w-10 h-10 rounded-full bg-error/10 justify-center items-center mr-4">
              <StyledMaterialIcons name="logout" size={20} color={colors.error} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-error">Logout</StyledText>
          </StyledTouchableOpacity>
        </Surface>
      </StyledView>
    </Container>
  );
}
