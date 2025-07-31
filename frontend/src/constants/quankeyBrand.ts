/**
 * QUANKEY BRAND SYSTEM - Official Brand Constants
 * 
 * This file contains the official Quankey brand colors, gradients, and design tokens
 * as defined in the brand style guide. All components should use these constants
 * to maintain brand consistency.
 * 
 * Based on: quankey-final-logo-system.html and quankey-brand-assets.html
 */

// =============================================================================
// OFFICIAL BRAND COLORS
// =============================================================================

export const QUANKEY_COLORS = {
  // Primary Brand Colors
  primary: '#00A6FB',        // Quantum Blue
  cyan: '#00D4FF',          // Electric Cyan
  dark: '#0A1628',          // Deep Space (background)
  navy: '#1E3A5F',          // Cyber Navy (secondary background)
  
  // Neutral Colors
  white: '#FFFFFF',
  grayLight: '#E8E8F0',
  gray: '#8B8CA5',
  grayDark: '#666666',
  
  // State Colors
  success: '#00FF88',       // Quantum Green
  warning: '#FFB800',       // Quantum Amber
  error: '#FF3B30',         // Quantum Red
  premium: '#6B5FFF',       // Quantum Purple
} as const;

// =============================================================================
// BRAND GRADIENTS
// =============================================================================

export const QUANKEY_GRADIENTS = {
  primary: 'linear-gradient(135deg, #00A6FB 0%, #00D4FF 100%)',
  primaryHover: 'linear-gradient(135deg, #0095E8 0%, #00C3ED 100%)',
  background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #16213e 100%)',
  radial: 'radial-gradient(circle at 20% 50%, rgba(0, 166, 251, 0.15) 0%, transparent 50%)',
  orbital: 'radial-gradient(circle at 80% 80%, rgba(0, 212, 255, 0.15) 0%, transparent 50%)',
} as const;

// =============================================================================
// SPACING SYSTEM
// =============================================================================

export const QUANKEY_SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const QUANKEY_RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
} as const;

// =============================================================================
// SHADOWS & EFFECTS
// =============================================================================

export const QUANKEY_SHADOWS = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.1)',
  md: '0 4px 20px rgba(0, 0, 0, 0.15)',
  lg: '0 8px 32px rgba(0, 166, 251, 0.2)',
  glow: '0 0 20px rgba(0, 166, 251, 0.5)',
  quantumGlow: '0 0 30px rgba(0, 166, 251, 0.4), 0 0 60px rgba(0, 212, 255, 0.2)',
} as const;

// =============================================================================
// TYPOGRAPHY SYSTEM
// =============================================================================

export const QUANKEY_FONTS = {
  primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
} as const;

// =============================================================================
// CSS VARIABLES FOR RUNTIME USE
// =============================================================================

export const QUANKEY_CSS_VARS = `
  :root {
    /* Colors */
    --quankey-primary: ${QUANKEY_COLORS.primary};
    --quankey-cyan: ${QUANKEY_COLORS.cyan};
    --quankey-dark: ${QUANKEY_COLORS.dark};
    --quankey-navy: ${QUANKEY_COLORS.navy};
    --quankey-white: ${QUANKEY_COLORS.white};
    --quankey-gray-light: ${QUANKEY_COLORS.grayLight};
    --quankey-gray: ${QUANKEY_COLORS.gray};
    --quankey-success: ${QUANKEY_COLORS.success};
    --quankey-warning: ${QUANKEY_COLORS.warning};
    --quankey-error: ${QUANKEY_COLORS.error};
    --quankey-premium: ${QUANKEY_COLORS.premium};
    
    /* Gradients */
    --quankey-gradient: ${QUANKEY_GRADIENTS.primary};
    --quankey-gradient-hover: ${QUANKEY_GRADIENTS.primaryHover};
    --quankey-gradient-bg: ${QUANKEY_GRADIENTS.background};
    
    /* Spacing */
    --quankey-space-xs: ${QUANKEY_SPACING.xs};
    --quankey-space-sm: ${QUANKEY_SPACING.sm};
    --quankey-space-md: ${QUANKEY_SPACING.md};
    --quankey-space-lg: ${QUANKEY_SPACING.lg};
    --quankey-space-xl: ${QUANKEY_SPACING.xl};
    --quankey-space-2xl: ${QUANKEY_SPACING['2xl']};
    
    /* Border Radius */
    --quankey-radius-sm: ${QUANKEY_RADIUS.sm};
    --quankey-radius-md: ${QUANKEY_RADIUS.md};
    --quankey-radius-lg: ${QUANKEY_RADIUS.lg};
    --quankey-radius-xl: ${QUANKEY_RADIUS.xl};
    
    /* Shadows */
    --quankey-shadow-sm: ${QUANKEY_SHADOWS.sm};
    --quankey-shadow-md: ${QUANKEY_SHADOWS.md};
    --quankey-shadow-lg: ${QUANKEY_SHADOWS.lg};
    --quankey-shadow-glow: ${QUANKEY_SHADOWS.glow};
    
    /* Fonts */
    --quankey-font-primary: ${QUANKEY_FONTS.primary};
    --quankey-font-mono: ${QUANKEY_FONTS.mono};
  }
`;

// =============================================================================
// BRAND USAGE GUIDELINES
// =============================================================================

/**
 * BRAND USAGE GUIDELINES:
 * 
 * 1. LOGO USAGE:
 *    - Always use the official QuankeyLogo component
 *    - Minimum size: 32px for digital, 10mm for print
 *    - Maintain clear space equal to logo height
 *    - Never modify proportions or colors
 * 
 * 2. COLOR USAGE:
 *    - Primary: #00A6FB for main actions and highlights
 *    - Cyan: #00D4FF for accents and secondary elements
 *    - Use gradients sparingly for special emphasis
 *    - Dark: #0A1628 for backgrounds
 *    - Navy: #1E3A5F for secondary backgrounds
 * 
 * 3. TYPOGRAPHY:
 *    - Primary font: Inter (web-safe fallbacks included)
 *    - Mono font: JetBrains Mono for code and technical content
 *    - Use consistent spacing and weight hierarchy
 * 
 * 4. ICONOGRAPHY:
 *    - Use official Quankey icon set (SecurityIcon, QuantumIcon, FingerprintIcon)
 *    - 24px standard size, 48px for hero sections
 *    - Always use brand colors (#00A6FB primary, #00D4FF accents)
 * 
 * 5. SPACING:
 *    - Follow 8px grid system (8, 16, 24, 32, 48, 64)
 *    - Use consistent margins and padding
 *    - Maintain visual hierarchy through spacing
 */

export default {
  colors: QUANKEY_COLORS,
  gradients: QUANKEY_GRADIENTS,
  spacing: QUANKEY_SPACING,
  radius: QUANKEY_RADIUS,
  shadows: QUANKEY_SHADOWS,
  fonts: QUANKEY_FONTS,
  cssVars: QUANKEY_CSS_VARS,
} as const;