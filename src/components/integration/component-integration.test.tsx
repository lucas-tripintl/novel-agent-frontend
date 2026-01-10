import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BaseFormDialog } from '@/components/base/base-form-dialog';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { FormSelect } from '@/components/forms/form-select';
import { EmptyState } from '@/components/common/empty-state';
import { Pagination } from '@/components/common/pagination';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { DefaultErrorFallback } from '@/components/common/error-fallback';
import { useMutationLoading } from '@/hooks/use-mutation-loading';
import { useDeleteWithConfirmation } from '@/hooks/use-delete-with-confirmation';
import { FileText, Plus, Trash2 } from 'lucide-react';

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('Component Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('BaseFormDialog Integration', () => {
    it('should render dialog with form components and handle submission', async () => {
      const mockOnSubmit = vi.fn();
      const mockOnOpenChange = vi.fn();

      render(
        <TestWrapper>
          <BaseFormDialog
            open={true}
            onOpenChange={mockOnOpenChange}
            title="Test Dialog"
            description="Test description"
            onSubmit={mockOnSubmit}
          >
            <FormInput
              label="Name"
              value=""
              onChange={vi.fn()}
              required
            />
            <FormTextarea
              label="Description"
              value=""
              onChange={vi.fn()}
              maxLength={100}
              showCharCount
            />
          </BaseFormDialog>
        </TestWrapper>
      );

      // Verify dialog structure
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();

      // Verify form components are rendered
      expect(screen.getByLabelText('Name*')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();

      // Verify character count is shown
      expect(screen.getByText('0/100')).toBeInTheDocument();

      // Test form submission
      const form = screen.getByRole('dialog').querySelector('form');
      expect(form).toBeInTheDocument();

      fireEvent.submit(form!);
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should handle keyboard shortcuts', async () => {
      const mockOnSubmit = vi.fn();

      render(
        <TestWrapper>
          <BaseFormDialog
            open={true}
            onOpenChange={vi.fn()}
            title="Test Dialog"
            onSubmit={mockOnSubmit}
          >
            <FormInput
              label="Name"
              value=""
              onChange={vi.fn()}
            />
          </BaseFormDialog>
        </TestWrapper>
      );

      // Test Ctrl+Enter shortcut
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Enter', ctrlKey: true });

      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should handle loading state correctly', async () => {
      render(
        <TestWrapper>
          <BaseFormDialog
            open={true}
            onOpenChange={vi.fn()}
            title="Test Dialog"
            loading={true}
            onSubmit={vi.fn()}
          >
            <FormInput
              label="Name"
              value=""
              onChange={vi.fn()}
            />
          </BaseFormDialog>
        </TestWrapper>
      );

      // Verify loading state disables submit button
      const submitButton = screen.getByRole('button', { name: /确认/i });
      expect(submitButton).toBeDisabled();

      // Verify loading spinner is shown
      expect(screen.getByRole('button', { name: /确认/i })).toContainHTML('svg');
    });
  });

  describe('Form Components Integration', () => {
    it('should handle form input validation and styling', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <div>
            <FormInput
              label="Required Field"
              value=""
              onChange={mockOnChange}
              error="This field is required"
              required
            />
            <FormInput
              label="Valid Field"
              value="test"
              onChange={mockOnChange}
            />
          </div>
        </TestWrapper>
      );

      // Verify error styling is applied
      const errorInput = screen.getByLabelText('Required Field*');
      expect(errorInput).toHaveClass('border-destructive/50');

      // Verify error message is displayed
      expect(screen.getByText('This field is required')).toBeInTheDocument();

      // Verify normal input doesn't have error styling
      const validInput = screen.getByLabelText('Valid Field');
      expect(validInput).not.toHaveClass('border-destructive/50');

      // Test input interaction
      await user.type(errorInput, 'test input');
      expect(mockOnChange).toHaveBeenCalledWith('test input');
    });

    it('should handle textarea character counting', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <FormTextarea
            label="Description"
            value="Hello"
            onChange={mockOnChange}
            maxLength={50}
            showCharCount
          />
        </TestWrapper>
      );

      // Verify character count is displayed
      expect(screen.getByText('5/50')).toBeInTheDocument();

      // Test typing
      const textarea = screen.getByLabelText('Description');
      await user.type(textarea, ' World');

      expect(mockOnChange).toHaveBeenCalledWith('Hello World');
    });

    it('should handle select component', async () => {
      const mockOnChange = vi.fn();
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];

      render(
        <TestWrapper>
          <FormSelect
            label="Select Option"
            value=""
            onChange={mockOnChange}
            options={options}
          />
        </TestWrapper>
      );

      // Verify select is rendered
      const select = screen.getByLabelText('Select Option');
      expect(select).toBeInTheDocument();

      // Test selection (this would require more complex interaction with Radix Select)
      // For now, just verify the component renders without errors
    });
  });

  describe('Empty State Integration', () => {
    it('should render empty state with action button', async () => {
      const mockAction = vi.fn();

      render(
        <TestWrapper>
          <EmptyState
            icon={FileText}
            title="No items found"
            description="Create your first item to get started"
            action={{
              label: "Create Item",
              onClick: mockAction,
            }}
          />
        </TestWrapper>
      );

      // Verify empty state content
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('Create your first item to get started')).toBeInTheDocument();

      // Test action button
      const actionButton = screen.getByRole('button', { name: 'Create Item' });
      await user.click(actionButton);

      expect(mockAction).toHaveBeenCalled();
    });

    it('should render empty state without action', () => {
      render(
        <TestWrapper>
          <EmptyState
            icon={FileText}
            title="No data available"
            description="There are no items to display"
          />
        </TestWrapper>
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.getByText('There are no items to display')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Pagination Integration', () => {
    it('should handle pagination navigation', async () => {
      const mockOnPageChange = vi.fn();

      render(
        <TestWrapper>
          <Pagination
            currentPage={1}
            totalPages={5}
            onPageChange={mockOnPageChange}
            pageSize={10}
            totalItems={50}
          />
        </TestWrapper>
      );

      // Test next button
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);

      // Test previous button (should be disabled on first page)
      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it('should handle page size changes', async () => {
      const mockOnPageSizeChange = vi.fn();

      render(
        <TestWrapper>
          <Pagination
            currentPage={1}
            totalPages={5}
            onPageChange={vi.fn()}
            pageSize={10}
            totalItems={50}
            showPageSize={true}
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={mockOnPageSizeChange}
          />
        </TestWrapper>
      );

      // Verify page size selector is present
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Integration', () => {
    // Component that throws an error for testing
    function ErrorThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
      if (shouldThrow) {
        throw new Error('Test component error');
      }
      return <div>Component rendered successfully</div>;
    }

    it('should catch and display component errors', () => {
      render(
        <TestWrapper>
          <ErrorBoundary fallback={DefaultErrorFallback}>
            <ErrorThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      );

      // Should show error fallback
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test component error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should render children when no error occurs', () => {
      render(
        <TestWrapper>
          <ErrorBoundary fallback={DefaultErrorFallback}>
            <ErrorThrowingComponent shouldThrow={false} />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
    });
  });

  describe('useMutationLoading Integration', () => {
    it('should handle loading states correctly', async () => {
      const TestComponent = () => {
        const { mutate, isLoading } = useMutationLoading({
          mutationFn: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'success';
          },
        });

        return (
          <button
            onClick={() => mutate({})}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Submit'}
          </button>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: 'Submit' });
      expect(button).not.toBeDisabled();

      // Click button to start loading
      await user.click(button);

      // Should show loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(button).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });
    });

    it('should handle errors correctly', async () => {
      const TestComponent = () => {
        const { mutate, isLoading, error } = useMutationLoading({
          mutationFn: async () => {
            throw new Error('Test error');
          },
        });

        return (
          <div>
            <button
              onClick={() => mutate({})}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Submit'}
            </button>
            {error && <div>Error: {error.message}</div>}
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: 'Submit' });
      await user.click(button);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Error: Test error')).toBeInTheDocument();
      });

      // Button should be enabled again
      expect(button).not.toBeDisabled();
    });
  });

  describe('useDeleteWithConfirmation Integration', () => {
    it('should handle delete confirmation flow', async () => {
      const mockDeleteFn = vi.fn().mockResolvedValue(undefined);
      const mockOnSuccess = vi.fn();

      const TestComponent = () => {
        const {
          showConfirmDialog,
          setShowConfirmDialog,
          isDeleting,
          ConfirmDialog,
        } = useDeleteWithConfirmation({
          targetName: 'Test Item',
          deleteFn: mockDeleteFn,
          onSuccess: mockOnSuccess,
        });

        return (
          <div>
            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Item'}
            </button>
            <ConfirmDialog />
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: 'Delete Item' });
      await user.click(deleteButton);

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(screen.getByText(/确认删除/)).toBeInTheDocument();
      });

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /确认/i });
      await user.click(confirmButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Deleting...')).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(() => {
        expect(mockDeleteFn).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should handle delete cancellation', async () => {
      const mockDeleteFn = vi.fn();

      const TestComponent = () => {
        const {
          showConfirmDialog,
          setShowConfirmDialog,
          ConfirmDialog,
        } = useDeleteWithConfirmation({
          targetName: 'Test Item',
          deleteFn: mockDeleteFn,
        });

        return (
          <div>
            <button onClick={() => setShowConfirmDialog(true)}>
              Delete Item
            </button>
            <ConfirmDialog />
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Open confirmation dialog
      await user.click(screen.getByRole('button', { name: 'Delete Item' }));

      await waitFor(() => {
        expect(screen.getByText(/确认删除/)).toBeInTheDocument();
      });

      // Cancel deletion
      const cancelButton = screen.getByRole('button', { name: /取消/i });
      await user.click(cancelButton);

      // Dialog should close and delete function should not be called
      await waitFor(() => {
        expect(screen.queryByText(/确认删除/)).not.toBeInTheDocument();
      });

      expect(mockDeleteFn).not.toHaveBeenCalled();
    });
  });

  describe('Complete User Workflows', () => {
    it('should handle complete form submission workflow', async () => {
      const mockSubmit = vi.fn().mockResolvedValue('success');

      const TestFormWorkflow = () => {
        const [name, setName] = React.useState('');
        const [description, setDescription] = React.useState('');
        const [isOpen, setIsOpen] = React.useState(true);

        const { mutate, isLoading } = useMutationLoading({
          mutationFn: async (data: { name: string; description: string }) => {
            return mockSubmit(data);
          },
          onSuccess: () => {
            setIsOpen(false);
          },
        });

        const handleSubmit = () => {
          if (name.trim()) {
            mutate({ name, description });
          }
        };

        return (
          <BaseFormDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            title="Create Item"
            loading={isLoading}
            onSubmit={handleSubmit}
          >
            <FormInput
              label="Name"
              value={name}
              onChange={setName}
              required
            />
            <FormTextarea
              label="Description"
              value={description}
              onChange={setDescription}
              maxLength={200}
              showCharCount
            />
          </BaseFormDialog>
        );
      };

      render(
        <TestWrapper>
          <TestFormWorkflow />
        </TestWrapper>
      );

      // Fill form
      await user.type(screen.getByLabelText('Name*'), 'Test Item');
      await user.type(screen.getByLabelText('Description'), 'Test description');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /确认/i });
      await user.click(submitButton);

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /确认/i })).toContainHTML('svg');
      });

      // Verify submission
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          name: 'Test Item',
          description: 'Test description',
        });
      });
    });

    it('should handle error recovery workflow', async () => {
      let shouldFail = true;
      const mockSubmit = vi.fn().mockImplementation(() => {
        if (shouldFail) {
          return Promise.reject(new Error('Submission failed'));
        }
        return Promise.resolve('success');
      });

      const TestErrorRecovery = () => {
        const [name, setName] = React.useState('');

        const { mutate, isLoading, error } = useMutationLoading({
          mutationFn: async (data: { name: string }) => {
            return mockSubmit(data);
          },
        });

        return (
          <div>
            <FormInput
              label="Name"
              value={name}
              onChange={setName}
              error={error?.message}
            />
            <button
              onClick={() => mutate({ name })}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Loading...' : 'Submit'}
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestErrorRecovery />
        </TestWrapper>
      );

      // Fill form and submit (will fail)
      await user.type(screen.getByLabelText('Name'), 'Test');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Submission failed')).toBeInTheDocument();
      });

      // Fix the error condition and retry
      shouldFail = false;
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      // Should succeed this time
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(2);
      });
    });
  });
});