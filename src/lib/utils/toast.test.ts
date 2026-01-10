import { vi } from 'vitest';
import { errorToast, successToast, warningToast, infoToast } from './toast';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

import { toast } from 'sonner';

describe('Toast utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('errorToast', () => {
    it('calls toast.error with correct parameters for mutation errors', () => {
      errorToast.mutation('Test error message');

      expect(toast.error).toHaveBeenCalledWith('Test error message', {
        duration: 5000,
      });
    });

    it('calls toast.error with custom options for mutation errors', () => {
      const options = {
        duration: 3000,
        action: {
          label: 'Retry',
          onClick: vi.fn(),
        },
      };

      errorToast.mutation('Test error', options);

      expect(toast.error).toHaveBeenCalledWith('Test error', {
        duration: 3000,
        action: options.action,
      });
    });

    it('calls toast.error with default message for network errors', () => {
      errorToast.network();

      expect(toast.error).toHaveBeenCalledWith(
        'Network error. Please check your connection.',
        { duration: 6000 }
      );
    });

    it('calls toast.error with custom message for network errors', () => {
      errorToast.network('Custom network error');

      expect(toast.error).toHaveBeenCalledWith('Custom network error', {
        duration: 6000,
      });
    });

    it('calls toast.error for validation errors', () => {
      errorToast.validation('Validation failed');

      expect(toast.error).toHaveBeenCalledWith('Validation failed', {
        duration: 5000,
      });
    });

    it('calls toast.error for general errors', () => {
      errorToast.general('General error');

      expect(toast.error).toHaveBeenCalledWith('General error', {
        duration: 4000,
      });
    });

    it('calls toast.warning for rate limit errors', () => {
      errorToast.rateLimit('Rate limit exceeded');

      expect(toast.warning).toHaveBeenCalledWith('Rate limit exceeded', {
        duration: 4000,
      });
    });
  });

  describe('successToast', () => {
    it('calls toast.success for mutation success', () => {
      successToast.mutation('Operation successful');

      expect(toast.success).toHaveBeenCalledWith('Operation successful', {
        duration: 3000,
      });
    });

    it('calls toast.success for general success', () => {
      successToast.general('Success message');

      expect(toast.success).toHaveBeenCalledWith('Success message', {
        duration: 3000,
      });
    });
  });

  describe('warningToast', () => {
    it('calls toast.warning for general warnings', () => {
      warningToast.general('Warning message');

      expect(toast.warning).toHaveBeenCalledWith('Warning message', {
        duration: 4000,
      });
    });

    it('calls toast.warning for quota warnings', () => {
      warningToast.quota('Quota exceeded');

      expect(toast.warning).toHaveBeenCalledWith('Quota exceeded', {
        duration: 5000,
      });
    });
  });

  describe('infoToast', () => {
    it('calls toast.info for general info', () => {
      infoToast.general('Info message');

      expect(toast.info).toHaveBeenCalledWith('Info message', {
        duration: 3000,
      });
    });
  });
});