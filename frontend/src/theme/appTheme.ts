// App-wide theme configuration supporting both light and dark modes.
// Uses a modern design with custom color palettes and typography.

export const COLORS = {
  primary: '#6C63FF',    // Vivid purple
  secondary: '#00D9A6',  // Teal accent
  warning: '#FFB74D',    // Amber warning
  danger: '#FF5252',     // Red danger
  safe: '#4CAF50',       // Green safe
  
  // Light Theme Colors
  lightBackground: '#F5F5FA',
  lightCard: '#FFFFFF',
  lightText: '#2D2D3A',
  lightBorder: '#E0E0E0',
  
  // Dark Theme Colors
  darkBackground: '#121220',
  darkCard: '#1E1E2E',
  darkText: '#E0E0F0',
  darkBorder: '#3A3A4E',
};

export const GRADIENTS = {
  primary: ['#6C63FF', '#4A41D7'] as const,
  dark: ['#1A1A2E', '#16213E'] as const,
  light: ['#F5F5FA', '#E8E8F0'] as const,
  
  // Risk gradients
  safe: ['#4CAF50', '#66BB6A'] as const,
  warning: ['#FFB74D', '#FFA726'] as const,
  danger: ['#FF5252', '#FF1744'] as const,
};

/**
 * Returns the appropriate color for a risk score.
 */
export function getRiskColor(score: number): string {
  if (score <= 30) return COLORS.safe;
  if (score <= 70) return COLORS.warning;
  return COLORS.danger;
}

/**
 * Returns a gradient for the risk score.
 */
export function getRiskGradient(score: number): readonly [string, string] {
  if (score <= 30) return GRADIENTS.safe;
  if (score <= 70) return GRADIENTS.warning;
  return GRADIENTS.danger;
}
