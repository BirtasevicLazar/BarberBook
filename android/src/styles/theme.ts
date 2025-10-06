import { Platform } from 'react-native';

// Apple-inspired color palette - modern, minimal, professional
export const palette = {
  // System backgrounds
  systemBackground: '#000000',
  secondarySystemBackground: '#1C1C1E',
  tertiarySystemBackground: '#2C2C2E',
  
  // Grouped backgrounds  
  systemGroupedBackground: '#000000',
  secondarySystemGroupedBackground: '#1C1C1E',
  tertiarySystemGroupedBackground: '#2C2C2E',
  
  // Fill colors
  systemFill: 'rgba(120, 120, 128, 0.20)',
  secondarySystemFill: 'rgba(120, 120, 128, 0.16)', 
  tertiarySystemFill: 'rgba(118, 118, 128, 0.12)',
  quaternarySystemFill: 'rgba(118, 118, 128, 0.08)',
  
  // Label colors
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.60)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.30)',
  quaternaryLabel: 'rgba(235, 235, 245, 0.18)',
  
  // Separator colors
  separator: 'rgba(84, 84, 88, 0.65)',
  opaqueSeparator: '#38383A',
  
  // Accent colors - refined Apple blues
  systemBlue: '#007AFF',
  systemGreen: '#32D74B',
  systemIndigo: '#5856D6', 
  systemOrange: '#FF9F0A',
  systemPink: '#FF2D92',
  systemPurple: '#AF52DE',
  systemRed: '#FF453A',
  systemTeal: '#64D2FF',
  systemYellow: '#FFD60A',
  
  // Pure colors
  white: '#FFFFFF',
  black: '#000000',
};

export const theme = {
  colors: {
    // System backgrounds
    background: palette.systemBackground,
    secondaryBackground: palette.secondarySystemBackground,
    tertiaryBackground: palette.tertiarySystemBackground,
    
    // Surfaces
    surface: palette.secondarySystemGroupedBackground,
    surfaceSecondary: palette.tertiarySystemGroupedBackground,
    surfaceTertiary: palette.systemFill,
    
    // Borders & separators
    border: palette.separator,
    borderSecondary: palette.opaqueSeparator,
    
    // Text colors
    primary: palette.label,
    secondary: palette.secondaryLabel,
    tertiary: palette.tertiaryLabel,
    quaternary: palette.quaternaryLabel,
    
    // Accent colors
    accent: palette.systemBlue,
    success: palette.systemGreen,
    warning: palette.systemOrange,
    danger: palette.systemRed,
    
    // Fill colors
    fill: palette.systemFill,
    fillSecondary: palette.secondarySystemFill,
    fillTertiary: palette.tertiarySystemFill,
    fillQuaternary: palette.quaternarySystemFill,
  },
  
  // Apple's 8-point grid spacing system
  spacing: (factor: number) => 8 * factor,
  
  // Apple's continuous corner radius system
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    continuous: {
      sm: 10,
      md: 16, 
      lg: 20,
      xl: 28,
    }
  },
  
  // Apple San Francisco typography system
  typography: {
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto'
    }) ?? 'System',
    
    // Large titles
    largeTitle: {
      fontSize: 34,
      lineHeight: 41,
      fontWeight: '700' as const,
      letterSpacing: 0.41,
    },
    
    // Titles
    title1: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700' as const,
      letterSpacing: 0.36,
    },
    title2: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700' as const,
      letterSpacing: 0.35,
    },
    title3: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '600' as const,
      letterSpacing: 0.38,
    },
    
    // Headlines
    headline: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '600' as const,
      letterSpacing: -0.41,
    },
    
    // Body text
    body: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '400' as const,
      letterSpacing: -0.41,
    },
    callout: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '400' as const,
      letterSpacing: -0.32,
    },
    subheadline: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '400' as const,
      letterSpacing: -0.24,
    },
    
    // Small text
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400' as const,
      letterSpacing: -0.08,
    },
    caption1: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
      letterSpacing: 0,
    },
    caption2: {
      fontSize: 11,
      lineHeight: 13,
      fontWeight: '400' as const,
      letterSpacing: 0.07,
    },
  },
  
  // Apple-style shadows - subtle, refined
  shadows: {
    sm: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    md: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
    xl: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
      elevation: 12,
    },
  },
  
  // Apple-style blur effects
  blur: {
    regular: 'rgba(0, 0, 0, 0.7)',
    prominent: 'rgba(0, 0, 0, 0.8)',
  },
};

export type Theme = typeof theme;
