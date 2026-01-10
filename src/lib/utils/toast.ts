/**
 * Standardized toast notification utilities
 * Provides consistent error display patterns across the application
 */

import { toast } from "sonner";

/**
 * Toast notification options
 */
interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Standardized error toast notifications
 */
export const errorToast = {
  /**
   * Display mutation error with consistent styling and duration
   */
  mutation: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: 5000,
      ...options,
    });
  },

  /**
   * Display network error with consistent messaging
   */
  network: (message?: string) => {
    return toast.error(message || "Network error. Please check your connection.", {
      duration: 6000,
    });
  },

  /**
   * Display validation error with consistent styling
   */
  validation: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: 5000,
      ...options,
    });
  },

  /**
   * Display general error with default styling
   */
  general: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * Display authentication error (typically handled by redirect)
   */
  auth: (message: string) => {
    return toast.error(message, {
      duration: 3000,
    });
  },

  /**
   * Display rate limit error with warning styling
   */
  rateLimit: (message: string) => {
    return toast.warning(message, {
      duration: 4000,
    });
  },

  /**
   * Display service unavailable error
   */
  service: (message: string) => {
    return toast.error(message, {
      duration: 6000,
    });
  },
};

/**
 * Standardized success toast notifications
 */
export const successToast = {
  /**
   * Display mutation success with consistent styling
   */
  mutation: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: 3000,
      ...options,
    });
  },

  /**
   * Display general success message
   */
  general: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: 3000,
      ...options,
    });
  },
};

/**
 * Standardized warning toast notifications
 */
export const warningToast = {
  /**
   * Display warning message with consistent styling
   */
  general: (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * Display quota exceeded warning
   */
  quota: (message: string) => {
    return toast.warning(message, {
      duration: 5000,
    });
  },
};

/**
 * Standardized info toast notifications
 */
export const infoToast = {
  /**
   * Display info message with consistent styling
   */
  general: (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      duration: 3000,
      ...options,
    });
  },
};