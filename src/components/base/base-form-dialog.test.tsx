import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { BaseFormDialog } from './base-form-dialog';
import { FileText } from 'lucide-react';

// Mock the UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className, onKeyDown }: any) => (
    <div data-testid="dialog-content" className={className} onKeyDown={onKeyDown}>
      {children}
    </div>
  ),
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, type, variant, disabled }: any) => (
    <button 
      data-testid={`button-${variant || 'default'}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
}));

describe('BaseFormDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Test Dialog',
    children: <div>Test Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Property 1: Component Structure Consistency', () => {
    /**
     * Feature: codebase-refactoring, Property 1: Component Structure Consistency
     * For any dialog component using BaseFormDialog, the rendered output should contain 
     * header, content, and footer sections in the correct DOM hierarchy with consistent styling classes
     * Validates: Requirements 1.1
     */
    it('should maintain consistent structure across different configurations', () => {
      fc.assert(fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          description: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { nil: undefined }),
          loading: fc.boolean(),
          maxWidth: fc.constantFrom('sm', 'md', 'lg', 'xl', '2xl', '3xl'),
          showDefaultFooter: fc.boolean(),
          cancelText: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          submitText: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        }),
        (config) => {
          // Clean up any existing renders
          cleanup();
          
          const { unmount } = render(
            <BaseFormDialog
              {...defaultProps}
              {...config}
            />
          );

          try {
            // Verify header section exists
            expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
            expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
            
            // Use a more flexible text content check that handles whitespace normalization
            const titleElement = screen.getByTestId('dialog-title');
            const actualTitle = titleElement.textContent?.replace(/\s+/g, ' ').trim() || '';
            const expectedTitle = config.title.replace(/\s+/g, ' ').trim();
            expect(actualTitle).toBe(expectedTitle);

            // Verify description if provided
            if (config.description && config.description.trim().length > 0) {
              expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
              
              // Use a more flexible text content check that handles whitespace normalization
              const descElement = screen.getByTestId('dialog-description');
              const actualDesc = descElement.textContent?.replace(/\s+/g, ' ').trim() || '';
              const expectedDesc = config.description.replace(/\s+/g, ' ').trim();
              expect(actualDesc).toBe(expectedDesc);
            }

            // Verify content section exists
            expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
            expect(screen.getByText('Test Content')).toBeInTheDocument();

            // Verify footer section if enabled
            if (config.showDefaultFooter) {
              expect(screen.getByTestId('dialog-footer')).toBeInTheDocument();
              expect(screen.getByTestId('button-outline')).toBeInTheDocument();
              expect(screen.getByTestId('button-default')).toBeInTheDocument();
            }

            // Verify loading state affects buttons
            if (config.loading && config.showDefaultFooter) {
              expect(screen.getByTestId('button-outline')).toBeDisabled();
              expect(screen.getByTestId('button-default')).toBeDisabled();
            }
          } finally {
            // Always clean up after each test
            unmount();
            cleanup();
          }
        }
      ), { numRuns: 100 });
    });

    it('should render with icon when provided', () => {
      render(
        <BaseFormDialog
          {...defaultProps}
          icon={FileText}
        />
      );

      const title = screen.getByTestId('dialog-title');
      expect(title).toBeInTheDocument();
    });

    it('should handle form submission', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <BaseFormDialog
          {...defaultProps}
          onSubmit={onSubmit}
        />
      );

      const submitButton = screen.getByTestId('button-default');
      await user.click(submitButton);

      expect(onSubmit).toHaveBeenCalled();
    });

    it('should handle keyboard shortcuts', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <BaseFormDialog
          {...defaultProps}
          onSubmit={onSubmit}
        />
      );

      const dialogContent = screen.getByTestId('dialog-content');
      
      // Simulate Ctrl+Enter
      fireEvent.keyDown(dialogContent, {
        key: 'Enter',
        ctrlKey: true,
      });

      expect(onSubmit).toHaveBeenCalled();
    });

    it('should prevent submission when loading', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <BaseFormDialog
          {...defaultProps}
          onSubmit={onSubmit}
          loading={true}
        />
      );

      const submitButton = screen.getByTestId('button-default');
      expect(submitButton).toBeDisabled();

      // Try to click disabled button
      await user.click(submitButton);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should call onOpenChange when cancel is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <BaseFormDialog
          {...defaultProps}
          onOpenChange={onOpenChange}
        />
      );

      const cancelButton = screen.getByTestId('button-outline');
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Unit Tests', () => {
    it('should render custom footer when provided', () => {
      const customFooter = <div data-testid="custom-footer">Custom Footer</div>;

      render(
        <BaseFormDialog
          {...defaultProps}
          footer={customFooter}
        />
      );

      expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
      expect(screen.queryByTestId('button-outline')).not.toBeInTheDocument();
    });

    it('should not render footer when showDefaultFooter is false and no custom footer', () => {
      render(
        <BaseFormDialog
          {...defaultProps}
          showDefaultFooter={false}
        />
      );

      expect(screen.queryByTestId('dialog-footer')).not.toBeInTheDocument();
    });

    it('should use custom button texts', () => {
      render(
        <BaseFormDialog
          {...defaultProps}
          cancelText="Custom Cancel"
          submitText="Custom Submit"
        />
      );

      expect(screen.getByText('Custom Cancel')).toBeInTheDocument();
      expect(screen.getByText('Custom Submit')).toBeInTheDocument();
    });
  });
});