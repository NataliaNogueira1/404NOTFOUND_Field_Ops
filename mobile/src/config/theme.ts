export const Colors = {
  primary: '#2563EB',
  primaryLight: '#C2DCFE',
  primaryDark: '#1D4ED8',
  success: '#16A34A',
  successLight: '#86EFB2',
  successDark: '#00792D',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#EA6200',
  danger: '#DC2626',
  dangerLight: '#FF8282',
  dangerDark: '#B10000',
  white: '#FFFFFF',
  black: '#000000',
  text: '#0F172A',
  textSecondary: '#64748B',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  background: '#F2F7FF',
  surface: '#FFFFFF',
  border: '#C1CDDD',
  mutedSurface: '#F8FAFC',
} as const;

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const FontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 30 } as const;
export const FontWeight = { regular: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const };
export const BorderRadius = { sm: 4, md: 8, lg: 10, xl: 16, card: 12, full: 9999 } as const;
export const Shadow = {
  sm: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  md: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 3 },
  lg: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 30, elevation: 6 },
} as const;
