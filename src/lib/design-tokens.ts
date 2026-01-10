/**
 * Design tokens for consistent styling across components
 * Following the requirements for standardized styling patterns
 */

export const DESIGN_TOKENS = {
  colors: {
    primary: 'text-primary',
    secondary: 'text-muted-foreground',
    error: 'text-destructive',
    success: 'text-green-600',
    warning: 'text-amber-600',
    info: 'text-blue-600',
    featured: 'text-yellow-500',
    muted: 'text-muted-foreground',
  },
  backgrounds: {
    input: 'bg-background/50',
    card: 'bg-card/50',
    muted: 'bg-muted/30',
    destructive: 'bg-destructive/5',
    success: 'bg-green-500/10',
    warning: 'bg-amber-500/10',
    info: 'bg-blue-500/10',
  },
  borders: {
    default: 'border-border/50',
    focus: 'border-primary/50',
    error: 'border-destructive/50',
    destructive: 'border-destructive/20',
    success: 'border-green-500/50',
    warning: 'border-amber-500/50',
    info: 'border-blue-500/50',
  },
  spacing: {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  },
  gaps: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6',
  },
  padding: {
    xs: 'px-2 py-1',
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
    xl: 'px-8 py-6',
  },
  margin: {
    xs: 'mb-1',
    sm: 'mb-2',
    md: 'mb-3',
    lg: 'mb-4',
    xl: 'mb-6',
  },
  typography: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  },
  fontWeight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
  focus: {
    ring: 'focus-visible:ring-1 focus-visible:ring-primary/30',
    errorRing: 'focus-visible:ring-destructive/30',
  },
} as const;

export const DIALOG_SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
} as const;

export const PAGE_SIZES = {
  SMALL: 10,
  MEDIUM: 20,
  LARGE: 50,
  EXTRA_LARGE: 100,
} as const;

export const DEFAULT_PAGE_SIZE = PAGE_SIZES.MEDIUM;

/**
 * Utility function to get consistent form field styling
 */
export function getFormFieldClasses(hasError?: boolean) {
  const baseClasses = [
    DESIGN_TOKENS.backgrounds.input,
    DESIGN_TOKENS.borders.default,
    DESIGN_TOKENS.focus.ring,
  ];

  if (hasError) {
    return [
      ...baseClasses,
      DESIGN_TOKENS.borders.error,
      DESIGN_TOKENS.focus.errorRing
    ].join(' ');
  }

  return baseClasses.join(' ');
}

/**
 * Utility function to get consistent card styling
 */
export function getCardClasses() {
  return [
    DESIGN_TOKENS.backgrounds.card,
    DESIGN_TOKENS.borders.default,
    'hover:border-primary/30',
    'hover:shadow-md',
    'transition-all',
    'duration-200',
  ].join(' ');
}

/**
 * Utility function to get consistent empty state styling
 */
export function getEmptyStateClasses() {
  return [
    DESIGN_TOKENS.backgrounds.card,
    'border-dashed',
    'border-2',
    DESIGN_TOKENS.borders.default,
  ].join(' ');
}

/**
 * Utility function to get consistent status badge styling
 */
export function getStatusBadgeClasses(status: 'success' | 'error' | 'warning' | 'info') {
  const baseClasses = ['variant="outline"'];
  
  switch (status) {
    case 'success':
      return `${DESIGN_TOKENS.colors.success} ${DESIGN_TOKENS.borders.success}`;
    case 'error':
      return `${DESIGN_TOKENS.colors.error} ${DESIGN_TOKENS.borders.error}`;
    case 'warning':
      return `${DESIGN_TOKENS.colors.warning} ${DESIGN_TOKENS.borders.warning}`;
    case 'info':
      return `${DESIGN_TOKENS.colors.info} ${DESIGN_TOKENS.borders.info}`;
    default:
      return `${DESIGN_TOKENS.colors.muted} ${DESIGN_TOKENS.borders.default}`;
  }
}

/**
 * Utility function to get consistent button styling for status actions
 */
export function getStatusButtonClasses(status: 'success' | 'error' | 'warning' | 'info') {
  switch (status) {
    case 'success':
      return `${DESIGN_TOKENS.colors.success} hover:text-green-700 ${DESIGN_TOKENS.backgrounds.success} dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30`;
    case 'error':
      return `${DESIGN_TOKENS.colors.error} hover:text-red-700 bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30`;
    case 'warning':
      return `${DESIGN_TOKENS.colors.warning} hover:text-amber-700 ${DESIGN_TOKENS.backgrounds.warning} dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/30`;
    case 'info':
      return `${DESIGN_TOKENS.colors.info} hover:text-blue-700 ${DESIGN_TOKENS.backgrounds.info} dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30`;
    default:
      return `${DESIGN_TOKENS.colors.muted} hover:text-foreground`;
  }
}