import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import { withUniwind } from 'uniwind';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemeToggle } from '@/components/theme-toggle';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

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
          }
        }
      ]
    );
  };

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : 'O';
  };

  return (
    <Container isScrollable={true} className="bg-background pt-12">
      <StyledView className="flex-row justify-between items-center px-6 py-4 mt-2 mb-4">
        <StyledText className="text-3xl font-black text-on-surface tracking-tight">More</StyledText>
        <ThemeToggle />
      </StyledView>

      <StyledView className="px-6 pb-24">
        <Surface variant="outline" className="flex-row items-center p-4 mb-6">
          <StyledView className="w-16 h-16 rounded-full bg-primary justify-center items-center mr-4">
            <StyledText className="text-on-primary font-bold text-xl">{getInitials(user?.fullName || '')}</StyledText>
          </StyledView>
          <StyledView className="flex-1">
            <StyledText className="text-xl font-bold text-on-surface mb-1">{user?.fullName || 'Seller'}</StyledText>
            <StyledText className="text-body-sm text-on-surface-variant mb-1">{user?.email || ''}</StyledText>
            {user?.businessName && (
              <StyledView className="bg-secondary-container self-start px-2 py-1 rounded-md mt-1">
                <StyledText className="text-label-caps font-semibold text-on-secondary-container">{user.businessName}</StyledText>
              </StyledView>
            )}
          </StyledView>
        </Surface>

        <StyledText className="text-lg font-bold text-on-surface mb-3 mt-2">Business</StyledText>
        <Surface variant="outline" className="p-0 overflow-hidden mb-6">
          <StyledTouchableOpacity className="flex-row items-center p-4 border-b border-surface-variant" onPress={() => {/* router.push('/settings/business') */}}>
            <StyledView className="w-10 h-10 rounded-full bg-surface-variant justify-center items-center mr-4">
              <Ionicons name="briefcase-outline" size={20} color={colors.onSurface} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface">Business Profile</StyledText>
            <Ionicons name="chevron-forward" size={20} color={colors.outline} />
          </StyledTouchableOpacity>
          <StyledTouchableOpacity className="flex-row items-center p-4 border-b border-surface-variant" onPress={() => {/* router.push('/settings/staff') */}}>
            <StyledView className="w-10 h-10 rounded-full bg-surface-variant justify-center items-center mr-4">
              <Ionicons name="people-outline" size={20} color={colors.onSurface} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface">Staff Accounts</StyledText>
            <Ionicons name="chevron-forward" size={20} color={colors.outline} />
          </StyledTouchableOpacity>
          <StyledTouchableOpacity className="flex-row items-center p-4 border-b border-surface-variant" onPress={() => {/* router.push('/analytics') */}}>
            <StyledView className="w-10 h-10 rounded-full bg-surface-variant justify-center items-center mr-4">
              <Ionicons name="stats-chart-outline" size={20} color={colors.onSurface} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface">Analytics</StyledText>
            <Ionicons name="chevron-forward" size={20} color={colors.outline} />
          </StyledTouchableOpacity>
          <StyledTouchableOpacity className="flex-row items-center p-4" onPress={() => {/* router.push('/settings/plan') */}}>
            <StyledView className="w-10 h-10 rounded-full bg-secondary-container/20 justify-center items-center mr-4">
              <Ionicons name="star-outline" size={20} color={colors.secondary} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface">Subscription Plan</StyledText>
            <StyledView className="bg-secondary-container/20 border border-secondary-container px-2 py-1 rounded-md mr-2">
              <StyledText className="text-label-caps font-bold text-secondary">PRO</StyledText>
            </StyledView>
            <Ionicons name="chevron-forward" size={20} color={colors.outline} />
          </StyledTouchableOpacity>
        </Surface>

        <StyledText className="text-lg font-bold text-on-surface mb-3">Support & Settings</StyledText>
        <Surface variant="outline" className="p-0 overflow-hidden mb-8">
          <StyledTouchableOpacity className="flex-row items-center p-4 border-b border-surface-variant">
            <StyledView className="w-10 h-10 rounded-full bg-surface-variant justify-center items-center mr-4">
              <Ionicons name="help-circle-outline" size={20} color={colors.onSurface} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface">Help & Support</StyledText>
            <Ionicons name="chevron-forward" size={20} color={colors.outline} />
          </StyledTouchableOpacity>
          <StyledTouchableOpacity className="flex-row items-center p-4">
            <StyledView className="w-10 h-10 rounded-full bg-surface-variant justify-center items-center mr-4">
              <Ionicons name="document-text-outline" size={20} color={colors.onSurface} />
            </StyledView>
            <StyledText className="flex-1 text-body-lg font-semibold text-on-surface">Terms & Privacy</StyledText>
            <Ionicons name="chevron-forward" size={20} color={colors.outline} />
          </StyledTouchableOpacity>
        </Surface>

        <Button variant="secondary" onPress={handleLogout} className="bg-error-container border-0">
          <StyledText className="text-error font-bold">Log Out</StyledText>
        </Button>
      </StyledView>
    </Container>
  );
}
