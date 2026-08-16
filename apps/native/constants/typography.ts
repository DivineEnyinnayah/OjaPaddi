export const typography = {
  fontFamily: {
    headline: 'HankenGrotesk_700Bold',
    body: 'HankenGrotesk_400Regular',
    label: 'HankenGrotesk_500Medium',
  },
  fontSize: {
    xs: 11,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  scale: {
    display: {
      fontFamily: 'HankenGrotesk_700Bold',
      fontSize: 32,
      lineHeight: 38,
      fontWeight: '700' as const,
    },
    h1: {
      fontFamily: 'HankenGrotesk_700Bold',
      fontSize: 24,
      lineHeight: 31,
      fontWeight: '700' as const,
    },
    h2: {
      fontFamily: 'HankenGrotesk_600SemiBold',
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const,
    },
    bodyLg: {
      fontFamily: 'HankenGrotesk_400Regular',
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    bodySm: {
      fontFamily: 'HankenGrotesk_400Regular',
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '400' as const,
    },
    labelBold: {
      fontFamily: 'HankenGrotesk_600SemiBold',
      fontSize: 12,
      lineHeight: 15,
      letterSpacing: 0.24,
      fontWeight: '600' as const,
    },
    labelCaps: {
      fontFamily: 'HankenGrotesk_700Bold',
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.55,
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
    },
  },
} as const;

export type TypographyVariant = keyof typeof typography.scale;
