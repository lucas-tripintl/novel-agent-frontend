import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { DefaultErrorFallback } from '@/components/common/error-fallback';
import { CreateProjectDialog } from '@/components/project/create-project-dialog';
import { ProjectEditDialog } from '@/components/project/project-edit-dialog';
import { AddSkillDialog } from '@/components/skills/add-skill-dialog';
import { EntityDetailDialog } from '@/components/entities/entity-detail-dialog';
import { BaseFormDialog } from '@/components/base/base-form-dialog';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { useMutationLoading } from '@/hooks/use-mutation-loading';
import { useDeleteWithConfirmation } from '@/hooks/use-delete-with-confirmation';
import { errorToast, successToast } from '@/lib/utils/toast';
import type { ProjectList, EntityRead } from '@/types/api';

// Mock toast functions
vi.mock('@/lib/utils/toast', () => ({
  errorToast: {
    mutation: vi.fn(),
    network: vi.fn(),
    validation: vi.fn(),
    general: vi.fn(),
  },
  successToast: {
    mutation: vi.fn(),
    general: vi.fn(),
  },
}));

// Mock API functions to simulate various error conditions
vi.mock('@/lib/api/projects', () => ({
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  updateEntity: vi.fn(),
  deleteEntity: vi.fn(),
}));

// Test wrapper with error boundary
function TestWrapperWithErrorBoundary({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallback={DefaultErrorFallback}>
        {children}
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

// Component that throws an error for testing
function ErrorThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test component error');
  }
  return <div>Component rendered successfully</div>;
}

describe('Error Handling Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Error Boundary Integration', () => {
    it('should catch and display component errors with retry functionality', async () => {
      let shouldThrow = true;
      const { rerender } = render(
        <TestWrapperWithErrorBoundary>
          <ErrorThrowingComponent shouldThrow={shouldThrow} />
        </TestWrapperWithErrorBoundary>
      );

      // Should show error fallback
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test component error')).toBeInTheDocument();

      // Test retry functionality
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      // Fix the error and retry
      shouldThrow = false;
      await user.click(retryButton);

      // Should show successful render after retry
      await waitFor(() => {
        expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
      });
    });

    it('should handle nested component errors', async () => {
      const NestedErrorComponent = () => {
        return (
          <BaseFormDialog
            open={true}
            onOpenChange={vi.fn()}
            title="Test Dialog"
          >
            <ErrorThrowingComponent shouldThrow={true} />
          </BaseFormDialog>
        );
      };

      render(
        <TestWrapperWithErrorBoundary>
          <NestedErrorComponent />
        </TestWrapperWithErrorBoundary>
      );

      // Error boundary should catch the nested error
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors in CreateProjectDialog', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';

      // Mock network failure
      const mockCreateProject = vi.fn().mockRejectedValue(networkError);
      vi.mocked(vi.fn()).mockReturnValue({
        mutateAsync: mockCreateProject,
      });

      render(
        <TestWrapperWithErrorBoundary>
          <CreateProjectDialog
            open={true}
            onOpenChange={vi.fn()}
          />
        </TestWrapperWithErrorBoundary>
      );

      // Fill form and submit
      await user.type(
        screen.getByLabelText('projects.createDialog.nameLabel'),
        'Test Project'
      );

      const submitButton = screen.getByRole('button', { name: /common.create/i });
      await user.click(submitButton);

      // Should show loading state initially
      await waitFor(() => {
        expect(screen.getByText('projects.createDialog.creating')).toBeInTheDocument();
      });

      // After error, should return to normal state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /common.create/i })).not.toBeDisabled();
      });

      // Error toast should be called
      expect(errorToast.network).toHaveBeenCalled();
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      const mockUpdateProject = vi.fn().mockRejectedValue(timeoutError);
      vi.mocked(vi.fn()).mockReturnValue({
        mutateAsync: mockUpdateProject,
      });

      const mockProject: ProjectList = {
        id: 'project-1',
        name: 'Test Project',
        project_type: 'Novel',
        description: 'Test description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      render(
        <TestWrapperWithErrorBoundary>
          <ProjectEditDialog
            project={mockProject}
            open={true}
            onOpenChange={vi.fn()}
          />
        </TestWrapperWithErrorBoundary>
      );

      // Edit and save
      const nameInput = screen.getByDisplayValue('Test Project');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Project');

      const saveButton = screen.getByRole('button', { name: /common.save/i });
      await user.click(saveButton);

      // Should handle timeout error gracefully
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });

      expect(errorToast.network).toHaveBeenCalled();
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle server validation errors', async () => {
      const validationError = {
        name: 'ValidationError',
        message: 'Validation failed',
        details: {
          name: ['Project name must be unique'],
          description: ['Description is too long'],
        },
      };

      const mockCreateProject = vi.fn().mockRejectedValue(validationError);
      vi.mocked(vi.fn()).mockReturnValue({
        mutateAsync: mockCreateProject,
      });

      render(
        <TestWrapperWithErrorBoundary>
          <CreateProjectDialog
            open={true}
            onOpenChange={vi.fn()}
          />
        </TestWrapperWithErrorBoundary>
      );

      // Fill form with invalid data
      await user.type(
        screen.getByLabelText('projects.createDialog.nameLabel'),
        'Duplicate Project Name'
      );

      const submitButton = screen.getByRole('button', { name: /common.create/i });
      await user.click(submitButton);

      // Should handle validation error
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      expect(errorToast.validation).toHaveBeenCalled();
    });

    it('should handle client-side validation errors', async () => {
      render(
        <TestWrapperWithErrorBoundary>
          <BaseFormDialog
            open={true}
            onOpenChange={vi.fn()}
            title="Test Form"
            onSubmit={vi.fn()}
          >
            <FormInput
              label="Required Field"
              value=""
              onChange={vi.fn()}
              error="This field is required"
              required
            />
            <FormTextarea
              label="Description"
              value="This is a very long description that exceeds the maximum allowed length for this field"
              onChange={vi.fn()}
              maxLength={50}
              showCharCount
              error="Description is too long"
            />
          </BaseFormDialog>
        </TestWrapperWithErrorBoundary>
      );

      // Verify validation errors are displayed
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByText('Description is too long')).toBeInTheDocument();

      // Verify error styling is applied
      const requiredInput = screen.getByLabelText('Required Field');
      const descriptionInput = screen.getByLabelText('Description');

      expect(requiredInput).toHaveClass('border-destructive/50');
      expect(descriptionInput).toHaveClass('border-destructive/50');
    });
  });

  describe('Loading State Error Handling', () => {
    it('should handle race conditions in loading states', async () => {
      let resolveFirst: () => void;
      let resolveSecond: () => void;

      const firstRequest = new Promise<string>((resolve) => {
        resolveFirst = () => resolve('first');
      });

      const secondRequest = new Promise<string>((resolve) => {
        resolveSecond = () => resolve('second');
      });

      const TestComponent = () => {
        const { mutate: mutateFirst, isLoading: isLoadingFirst } = useMutationLoading({
          mutationFn: () => firstRequest,
        });

        const { mutate: mutateSecond, isLoading: isLoadingSecond } = useMutationLoading({
          mutationFn: () => secondRequest,
        });

        return (
          <div>
            <button
              onClick={() => mutateFirst({})}
              disabled={isLoadingFirst}
            >
              {isLoadingFirst ? 'Loading First...' : 'First Request'}
            </button>
            <button
              onClick={() => mutateSecond({})}
              disabled={isLoadingSecond}
            >
              {isLoadingSecond ? 'Loading Second...' : 'Second Request'}
            </button>
          </div>
        );
      };

      render(
        <TestWrapperWithErrorBoundary>
          <TestComponent />
        </TestWrapperWithErrorBoundary>
      );

      // Start both requests
      await user.click(screen.getByRole('button', { name: 'First Request' }));
      await user.click(screen.getByRole('button', { name: 'Second Request' }));

      // Both should show loading
      expect(screen.getByText('Loading First...')).toBeInTheDocument();
      expect(screen.getByText('Loading Second...')).toBeInTheDocument();

      // Resolve second request first
      resolveSecond();
      await waitFor(() => {
        expect(screen.getByText('Second Request')).toBeInTheDocument();
      });

      // First should still be loading
      expect(screen.getByText('Loading First...')).toBeInTheDocument();

      // Resolve first request
      resolveFirst();
      await waitFor(() => {
        expect(screen.getByText('First Request')).toBeInTheDocument();
      });
    });

    it('should handle loading state cleanup on component unmount', async () => {
      let resolveRequest: () => void;
      const longRunningRequest = new Promise<string>((resolve) => {
        resolveRequest = () => resolve('success');
      });

      const TestComponent = () => {
        const { mutate, isLoading } = useMutationLoading({
          mutationFn: () => longRunningRequest,
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

      const { unmount } = render(
        <TestWrapperWithErrorBoundary>
          <TestComponent />
        </TestWrapperWithErrorBoundary>
      );

      // Start request
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Unmount component while loading
      unmount();

      // Resolve request after unmount (should not cause errors)
      resolveRequest();

      // No errors should be thrown
    });
  });

  describe('Delete Operation Error Handling', () => {
    it('should handle delete operation errors with proper recovery', async () => {
      const deleteError = new Error('Delete operation failed');
      const mockDeleteEntity = vi.fn().mockRejectedValue(deleteError);

      const mockEntity: EntityRead = {
        id: 'entity-1',
        project_id: 'project-1',
        name: 'Test Entity',
        entity_type: 'character',
        content: 'Test content',
        attributes: {},
        tags: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      render(
        <TestWrapperWithErrorBoundary>
          <EntityDetailDialog
            entity={mockEntity}
            open={true}
            onOpenChange={vi.fn()}
          />
        </TestWrapperWithErrorBoundary>
      );

      // Initiate delete
      const deleteButton = screen.getByRole('button', { name: /删除/i });
      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/确认删除/)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /确认/i });
      await user.click(confirmButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/删除中/)).toBeInTheDocument();
      });

      // After error, should return to normal state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /删除/i })).toBeInTheDocument();
      });

      // Error should be handled
      expect(errorToast.mutation).toHaveBeenCalled();

      // User should be able to retry
      await user.click(screen.getByRole('button', { name: /删除/i }));
    });

    it('should handle delete confirmation dialog errors', async () => {
      const TestDeleteComponent = () => {
        const {
          showConfirmDialog,
          setShowConfirmDialog,
          isDeleting,
          ConfirmDialog,
        } = useDeleteWithConfirmation({
          targetName: 'Test Item',
          deleteFn: async () => {
            throw new Error('Delete failed');
          },
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
        <TestWrapperWithErrorBoundary>
          <TestDeleteComponent />
        </TestWrapperWithErrorBoundary>
      );

      // Open confirmation dialog
      await user.click(screen.getByRole('button', { name: 'Delete Item' }));

      await waitFor(() => {
        expect(screen.getByText(/确认删除/)).toBeInTheDocument();
      });

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /确认/i });
      await user.click(confirmButton);

      // Should handle error and keep dialog open for retry
      await waitFor(() => {
        expect(screen.getByText(/确认删除/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Error Recovery', () => {
    it('should allow error recovery in form submissions', async () => {
      let shouldFail = true;
      const mockSubmit = vi.fn().mockImplementation(() => {
        if (shouldFail) {
          return Promise.reject(new Error('Submission failed'));
        }
        return Promise.resolve('success');
      });

      const TestFormComponent = () => {
        const { mutate, isLoading } = useMutationLoading({
          mutationFn: mockSubmit,
          onSuccess: () => {
            successToast.mutation('Form submitted successfully');
          },
        });

        return (
          <BaseFormDialog
            open={true}
            onOpenChange={vi.fn()}
            title="Test Form"
            loading={isLoading}
            onSubmit={() => mutate({})}
          >
            <FormInput
              label="Test Field"
              value="test value"
              onChange={vi.fn()}
            />
          </BaseFormDialog>
        );
      };

      render(
        <TestWrapperWithErrorBoundary>
          <TestFormComponent />
        </TestWrapperWithErrorBoundary>
      );

      // First submission fails
      const submitButton = screen.getByRole('button', { name: /确认/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      // Fix the error condition
      shouldFail = false;

      // Retry submission
      await user.click(submitButton);

      await waitFor(() => {
        expect(successToast.mutation).toHaveBeenCalledWith('Form submitted successfully');
      });
    });

    it('should handle multiple consecutive errors', async () => {
      let errorCount = 0;
      const mockSubmit = vi.fn().mockImplementation(() => {
        errorCount++;
        if (errorCount <= 3) {
          return Promise.reject(new Error(`Error ${errorCount}`));
        }
        return Promise.resolve('success');
      });

      const TestFormComponent = () => {
        const { mutate, isLoading } = useMutationLoading({
          mutationFn: mockSubmit,
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
        <TestWrapperWithErrorBoundary>
          <TestFormComponent />
        </TestWrapperWithErrorBoundary>
      );

      // Try multiple times
      for (let i = 1; i <= 4; i++) {
        const submitButton = screen.getByRole('button', { name: /submit/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(submitButton).not.toBeDisabled();
        });

        if (i <= 3) {
          expect(mockSubmit).toHaveBeenCalledTimes(i);
        }
      }

      // Fourth attempt should succeed
      expect(mockSubmit).toHaveBeenCalledTimes(4);
    });
  });

  describe('Concurrent Error Handling', () => {
    it('should handle multiple simultaneous errors', async () => {
      const TestMultipleErrorsComponent = () => {
        const { mutate: mutate1, isLoading: loading1 } = useMutationLoading({
          mutationFn: () => Promise.reject(new Error('Error 1')),
        });

        const { mutate: mutate2, isLoading: loading2 } = useMutationLoading({
          mutationFn: () => Promise.reject(new Error('Error 2')),
        });

        return (
          <div>
            <button
              onClick={() => mutate1({})}
              disabled={loading1}
            >
              {loading1 ? 'Loading 1...' : 'Action 1'}
            </button>
            <button
              onClick={() => mutate2({})}
              disabled={loading2}
            >
              {loading2 ? 'Loading 2...' : 'Action 2'}
            </button>
          </div>
        );
      };

      render(
        <TestWrapperWithErrorBoundary>
          <TestMultipleErrorsComponent />
        </TestWrapperWithErrorBoundary>
      );

      // Trigger both errors simultaneously
      await user.click(screen.getByRole('button', { name: 'Action 1' }));
      await user.click(screen.getByRole('button', { name: 'Action 2' }));

      // Both should show loading
      expect(screen.getByText('Loading 1...')).toBeInTheDocument();
      expect(screen.getByText('Loading 2...')).toBeInTheDocument();

      // Both should recover from errors
      await waitFor(() => {
        expect(screen.getByText('Action 1')).toBeInTheDocument();
        expect(screen.getByText('Action 2')).toBeInTheDocument();
      });
    });
  });
});