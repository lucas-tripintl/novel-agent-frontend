/**
 * Main library exports
 * Provides centralized access to all utility functions and constants
 */

// Design system exports
export {
  DESIGN_TOKENS,
  DIALOG_SIZES,
  PAGE_SIZES,
  DEFAULT_PAGE_SIZE,
  getFormFieldClasses,
  getCardClasses,
  getEmptyStateClasses,
  getStatusBadgeClasses,
  getStatusButtonClasses,
} from './design-tokens';

// Utility functions
export { cn } from './utils';

// Time utilities
export { formatTimeAgo } from './utils/time';

// Toast utilities
export {
  errorToast,
  successToast,
  warningToast,
  infoToast,
} from './utils/toast';

// API client
export { apiClient } from './api/client';