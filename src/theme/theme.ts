// Theme constants for Lunar Log app

export const colors = {
  // Primary palette
  primary: '#3B5F8A', // Deep blue - main brand color
  primaryLight: '#4F7CAD', // Lighter blue for highlights
  primaryDark: '#2A4365', // Darker blue for backgrounds

  // Secondary palette
  secondary: '#8A3B5F', // Deep purple-pink - accent color
  secondaryLight: '#AD4F7C', // Lighter purple for highlights
  secondaryDark: '#652A43', // Darker purple for contrast elements

  // Background gradients
  bgGradientStart: '#0A1A2F', // Dark blue night sky start
  bgGradientEnd: '#1E3A5F', // Medium blue night sky end

  // UI elements
  surface: 'rgba(30, 40, 60, 0.85)', // Card/container background
  surfaceLight: 'rgba(50, 65, 95, 0.85)', // Lighter surface for interactive elements

  // Text
  textPrimary: '#FFFFFF', // Primary text (white)
  textSecondary: '#E0E0E0', // Secondary text (light gray)
  textMuted: '#A0A0A0', // Muted text (medium gray)

  // Status colors
  success: '#4CAF50', // Green for success states
  warning: '#FFC107', // Amber for warning states
  error: '#E53935', // Red for error states
  info: '#2196F3', // Blue for info states

  // Calendar specific
  calendarBorder: '#4F7CAD', // Calendar cell border
  calendarToday: 'rgba(79, 124, 173, 0.5)', // Today highlight
  calendarSelected: 'rgba(79, 124, 173, 0.8)', // Selected day
  calendarSelectedBorder: '#FFFFFF', // Selected day border
  calendarHover: 'rgba(79, 124, 173, 0.3)', // Hover state
  calendarGhost: 'rgba(0, 0, 0, 0)', // Transparent ghost cells

  // Misc
  divider: 'rgba(255, 255, 255, 0.2)', // Divider lines
  overlay: 'rgba(0, 0, 0, 0.5)', // Overlay background
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999, // For circular elements
};

export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  fontWeights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
  },
};

export const animations = {
  durations: {
    short: 200,
    medium: 500,
    long: 1000,
  },
};

// Common style mixins
export const commonStyles = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.small,
  },
  button: {
    primary: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.sm,
      padding: spacing.md,
    },
    secondary: {
      backgroundColor: colors.secondary,
      borderRadius: borderRadius.sm,
      padding: spacing.md,
    },
    icon: {
      width: spacing.xl,
      height: spacing.xl,
      borderRadius: borderRadius.round,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surfaceLight,
    },
    danger: {
      backgroundColor: colors.error,
      borderRadius: borderRadius.sm,
      padding: spacing.md,
    },
  },
};

// Theme object that combines all theme elements
const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  animations,
  commonStyles,
};

export default theme;
