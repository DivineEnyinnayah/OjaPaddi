import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Storefront,
  Briefcase,
  CaretRight,
  ChartBar,
  Sparkle,
  Star,
  Users,
  Question,
  Receipt,
  FileText,
  SignOut,
} from 'phosphor-react-native';
import { withUniwind } from 'uniwind';
import { useAuthStore } from '../../stores/authStore';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { AlertDialog } from '../../components/ui/alert-dialog';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemeToggle } from '@/components/theme-toggle';
import { copy } from '@/constants/copy';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const colors = useThemeColor();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    logout();
    router.replace('/(auth)/welcome');
  };

  const getInitials = (fullName: string, email: string) => {
    if (fullName) {
      return fullName.substring(0, 2).toUpperCase();
    }
    return email ? email.charAt(0).toUpperCase() : 'O';
  };

  return (
    <Container isScrollable={true} withTabBar className="bg-background">
      <StyledView className="flex-row justify-between items-center px-6 py-4 mt-2 mb-4">
        <StyledText className="text-h2 font-black text-on-surface text-balance">More</StyledText>
        <ThemeToggle />
      </StyledView>

      <StyledView className="px-6 pb-6" style={{ gap: 6 }}>
        <Surface variant="primary" className="flex-row items-center px-5 py-5">
          <StyledView className="size-16 rounded-full bg-primary justify-center items-center mr-4">
            <StyledText className="text-on-primary font-bold text-xl">
              {getInitials(user?.fullName || '', user?.email || '')}
            </StyledText>
          </StyledView>
          <StyledView className="flex-1">
            <StyledText className="text-h2 font-bold text-on-surface mb-1 text-balance">
              {user?.fullName || 'Seller'}
            </StyledText>
            <StyledText className="text-body-sm text-on-surface-variant mb-2 text-pretty">
              {user?.email || ''}
            </StyledText>
            {user?.businessName && (
              <StyledView className="flex-row items-center">
                <Storefront size={16} color={colors.primary} />
                <StyledText className="text-label-caps font-semibold text-primary ml-1.5">
                  {user.businessName}
                </StyledText>
              </StyledView>
            )}
          </StyledView>
        </Surface>

        <StyledText className="font-h3 text-on-surface mt-5 mb-1">Business</StyledText>
        <Surface variant="primary" className="p-0 overflow-hidden">
          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4 border-b border-outline-variant/50"
            onPress={() => router.push('/business-profile')}
          >
            <StyledView className="size-10 rounded-full bg-primary-container/15 justify-center items-center mr-4">
              <Briefcase size={20} color={colors.primary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface text-balance">{copy.more.businessProfile}</StyledText>
            <CaretRight size={22} color={colors.outline} />
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4 border-b border-outline-variant/50"
            onPress={() => router.push('/analytics')}
          >
            <StyledView className="size-10 rounded-full bg-primary-container/15 justify-center items-center mr-4">
              <ChartBar size={20} color={colors.primary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface text-balance">Analytics</StyledText>
            <CaretRight size={22} color={colors.outline} />
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4 border-b border-outline-variant/50"
            onPress={() => router.push('/expenses')}
          >
            <StyledView className="size-10 rounded-full bg-primary-container/15 justify-center items-center mr-4">
              <Receipt size={20} color={colors.primary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface text-balance">Expenses</StyledText>
            <CaretRight size={22} color={colors.outline} />
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4 border-b border-outline-variant/50"
            onPress={() => router.push('/mba')}
          >
            <StyledView className="size-10 rounded-full bg-primary-container/15 justify-center items-center mr-4">
              <Sparkle size={20} color={colors.primary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface text-balance">Smart Recommendations</StyledText>
            <CaretRight size={22} color={colors.outline} />
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4 border-b border-outline-variant/50"
            onPress={() => router.push('/upgrade')}
          >
            <StyledView className="size-10 rounded-full bg-primary-container/15 justify-center items-center mr-4">
              <Star size={20} color={colors.primary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface text-balance">Subscription Plan</StyledText>
            <StyledView className="bg-secondary-container px-2.5 py-0.5 rounded-md mr-1">
              <StyledText className="text-label-caps font-bold text-on-surface uppercase">
                {user?.plan || 'Free'}
              </StyledText>
            </StyledView>
            <CaretRight size={22} color={colors.outline} />
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4"
            onPress={() => {}}
          >
            <StyledView className="size-10 rounded-full bg-primary-container/15 justify-center items-center mr-4 opacity-50">
              <Users size={20} color={colors.primary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface opacity-50 text-balance">Staff Accounts</StyledText>
            <StyledText className="text-md font-medium opacity-50">Coming Soon</StyledText>
            <StyledView className="border border-outline-variant rounded-md px-2 py-0.5 mr-1">
              <StyledText className="text-label-caps font-medium text-on-surface-variant">Free</StyledText>
            </StyledView>
            <CaretRight size={22} color={colors.outline} />
          </StyledTouchableOpacity>
        </Surface>

        <StyledText className="font-h3 text-on-surface mt-5 mb-1">Support</StyledText>
        <Surface variant="primary" className="p-0 overflow-hidden">
          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4 border-b border-outline-variant/50"
            onPress={() => {}}
          >
            <StyledView className="size-10 rounded-full bg-primary-container/15 justify-center items-center mr-4">
              <Question size={20} color={colors.primary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface text-balance">Help & Support</StyledText>
            <CaretRight size={22} color={colors.outline} />
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4"
            onPress={() => {}}
          >
            <StyledView className="size-10 rounded-full bg-primary-container/15 justify-center items-center mr-4">
              <FileText size={20} color={colors.primary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface text-balance">Privacy Policy</StyledText>
            <CaretRight size={22} color={colors.outline} />
          </StyledTouchableOpacity>
        </Surface>

        <StyledText className="font-h3 text-on-surface mt-5 mb-1">Account</StyledText>
        <Surface variant="primary" className="p-0 overflow-hidden">
          <StyledTouchableOpacity
            className="flex-row items-center px-5 py-4"
            onPress={handleLogout}
          >
            <StyledView className="size-10 rounded-full bg-error/10 justify-center items-center mr-4">
              <SignOut size={20} color={colors.error} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-error text-balance">Logout</StyledText>
          </StyledTouchableOpacity>
        </Surface>
      </StyledView>

      <AlertDialog
        visible={showLogoutDialog}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmLabel="Log Out"
        destructive
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </Container>
  );
}
