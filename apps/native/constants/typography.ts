export const typography = {
  fontFamily: {
    headline: '"Hanken Grotesk", sans-serif',
    body: '"Hanken Grotesk", sans-serif',
    label: '"Hanken Grotesk", sans-serif',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
} as const;
