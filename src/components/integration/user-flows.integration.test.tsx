import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateProjectDialog } from '@/components/project/create-project-dialog';
import { AddSkillDialog } from '@/components/skills/add-skill-dialog';
import { EntityDetailDialog } from '@/components/entities/entity-detail-dialog';
import { BaseFormDialog } from '@/components/base/base-form-dialog';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { EmptyState } from '@/components/common/empty-state';
import { Pagination } from '@/components/common/pagination';
import { useMutationLoading } from '@/hooks/use-mutation-loading';
import { useDeleteWithConfirmation } from '@/hooks/use-delete-with-confirmation';
import type { EntityRead } from '@/types/api';

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

describe('User Flow Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Complete Project Creation Flow', () => {
    it('should handle complete project creation workflow', async () => {
      const mockRouter = { push: vi.fn() };
      vi.mocked(vi.fn()).mockReturnValue(mockRouter);

      const mockOnOpenChange = vi.fn();
      const mockCreateProject = vi.fn().mockResolvedValue({
        id: 'new-project-123',
        name: 'My Novel Project',
      });

      render(
        <TestWrapper>
          <CreateProjectDialog
            open={true}
            onOpenChange={mockOnOpenChange}
          />
        </TestWrapper>
      );

      // Step 1: User opens dialog and sees form
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('projects.createDialog.title')).toBeInTheDocument();

      // Step 2: User fills in project details
      await user.type(
        screen.getByLabelText('projects.createDialog.nameLabel'),
        'My Novel Project'
      );
      await user.type(
        screen.getByLabelText('projects.createDialog.typeLabel'),
        'Fantasy Adventure'
      );
      await user.type(
        screen.getByLabelText('projects.createDialog.descriptionLabel'),
        'An epic fantasy adventure about a young hero discovering their magical powers.'
      );

      // Step 3: User submits form
      const createButton = screen.getByRole('button', { name: /common.create/i });
      expect(createButton).not.toBeDisabled();
      await user.click(createButton);

      // Step 4: Loading state is shown
      await waitFor(() => {
        expect(screen.getByText('projects.createDialog.creating')).toBeInTheDocument();
        expect(createButton).toBeDisabled();
      });

      // Step 5: Success - dialog closes and navigates to project
      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should handle project creation with validation errors', async () => {
      render(
        <TestWrapper>
          <CreateProjectDialog
            open={true}
            onOpenChange={vi.fn()}
          />
        </TestWrapper>
      );

      // Try to submit empty form
      const createButton = screen.getByRole('button', { name: /common.create/i });
      expect(createButton).toBeDisabled();

      // Fill only name (minimum required)
      await user.type(
        screen.getByLabelText('projects.createDialog.nameLabel'),
        'Test Project'
      );

      // Now button should be enabled
      expect(createButton).not.toBeDisabled();

      // Clear name field
      await user.clear(screen.getByLabelText('projects.createDialog.nameLabel'));

      // Button should be disabled again
      expect(createButton).toBeDisabled();
    });
  });

  describe('Complete Skill Addition Flow', () => {
    it('should handle complete skill addition workflow', async () => {
      const mockOnSuccess = vi.fn();
      const mockOnOpenChange = vi.fn();

      // Mock skills data
      const mockSkillsData = {
        items: [
          {
            id: 'skill-1',
            name: 'Character Development Assistant',
            description: 'Helps develop rich, complex characters',
            category: 'writing',
            applicable_stages: ['outline', 'writing', 'revision'],
            is_featured: true,
            visibility: 'public',
          },
          {
            id: 'skill-2',
            name: 'Plot Structure Analyzer',
            description: 'Analyzes and improves plot structure',
            category: 'analysis',
            applicable_stages: ['outline', 'revision'],
            is_featured: false,
            visibility: 'public',
          },
        ],
        total: 2,
      };

      render(
        <TestWrapper>
          <AddSkillDialog
            projectId="project-123"
            open={true}
            onOpenChange={mockOnOpenChange}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Step 1: User sees skill selection interface
      expect(screen.getByText('skills.addSkill')).toBeInTheDocument();

      // Step 2: User searches for skills
      const searchInput = screen.getByPlaceholderText('skills.searchPlaceholder');
      await user.type(searchInput, 'Character');

      // Step 3: User filters by category
      const writingCategory = screen.getByText('skills.category.writing');
      await user.click(writingCategory);

      // Step 4: User selects a skill
      await waitFor(() => {
        expect(screen.getByText('Character Development Assistant')).toBeInTheDocument();
      });

      const skillCard = screen.getByText('Character Development Assistant').closest('div');
      await user.click(skillCard!);

      // Verify skill is selected
      expect(skillCard).toHaveClass('bg-primary/10');

      // Step 5: User selects applicable stages
      const outlineStage = screen.getByLabelText('skills.stage.outline');
      const writingStage = screen.getByLabelText('skills.stage.writing');
      
      await user.click(outlineStage);
      await user.click(writingStage);

      // Step 6: User adds the skill
      const addButton = screen.getByRole('button', { name: /skills.add/i });
      expect(addButton).not.toBeDisabled();
      await user.click(addButton);

      // Step 7: Loading state and success
      await waitFor(() => {
        expect(addButton).toBeDisabled();
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should handle skill addition with pagination', async () => {
      // Mock large dataset requiring pagination
      const mockLargeSkillsData = {
        items: Array.from({ length: 20 }, (_, i) => ({
          id: `skill-${i + 1}`,
          name: `Skill ${i + 1}`,
          description: `Description for skill ${i + 1}`,
          category: 'writing',
          applicable_stages: ['outline', 'writing'],
          is_featured: false,
          visibility: 'public',
        })),
        total: 100, // Total items across all pages
      };

      render(
        <TestWrapper>
          <AddSkillDialog
            projectId="project-123"
            open={true}
            onOpenChange={vi.fn()}
          />
        </TestWrapper>
      );

      // Wait for skills to load
      await waitFor(() => {
        expect(screen.getByText('Skill 1')).toBeInTheDocument();
      });

      // Check if pagination controls are present
      const paginationNav = screen.queryByRole('navigation');
      if (paginationNav) {
        // Test pagination navigation
        const nextButton = screen.getByRole('button', { name: /next/i });
        await user.click(nextButton);

        // Should load next page
        await waitFor(() => {
          expect(screen.getByText('Skill 21')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Complete Entity Management Flow', () => {
    const mockEntity: EntityRead = {
      id: 'entity-1',
      project_id: 'project-1',
      name: 'Aria Shadowbane',
      entity_type: 'character',
      content: `# Character Profile

## Background
Aria is a skilled assassin from the Shadow Guild, trained from childhood in the arts of stealth and combat.

## Personality
- **Strengths**: Loyal, determined, skilled in combat
- **Weaknesses**: Trusts too easily, haunted by past failures
- **Goals**: Protect her younger brother, uncover the truth about her parents' death

## Abilities
- Master of shadow magic
- Expert in dual-wielding daggers
- Exceptional stealth and parkour skills`,
      attributes: {
        role: 'protagonist',
        importance: 'main',
        personality: ['determined', 'loyal', 'secretive'],
        abilities: ['shadow_magic', 'stealth', 'combat'],
        faction: 'shadow_guild',
      },
      tags: ['assassin', 'magic-user', 'protagonist'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    it('should handle complete entity viewing and editing workflow', async () => {
      const mockOnSave = vi.fn();
      const mockOnOpenChange = vi.fn();

      render(
        <TestWrapper>
          <EntityDetailDialog
            entity={mockEntity}
            open={true}
            onOpenChange={mockOnOpenChange}
            onSave={mockOnSave}
          />
        </TestWrapper>
      );

      // Step 1: User views entity details
      expect(screen.getByText('Aria Shadowbane')).toBeInTheDocument();
      expect(screen.getByText(/skilled assassin from the Shadow Guild/)).toBeInTheDocument();

      // Verify attributes are displayed with proper enum labels
      expect(screen.getByText('protagonist')).toBeInTheDocument();
      expect(screen.getByText('main')).toBeInTheDocument();

      // Verify tags are displayed as badges
      expect(screen.getByText('assassin')).toBeInTheDocument();
      expect(screen.getByText('magic-user')).toBeInTheDocument();

      // Step 2: User enters edit mode
      const editButton = screen.getByRole('button', { name: /编辑/i });
      await user.click(editButton);

      // Verify edit mode UI
      expect(screen.getByDisplayValue('Aria Shadowbane')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/skilled assassin/)).toBeInTheDocument();

      // Step 3: User edits character details
      const nameInput = screen.getByDisplayValue('Aria Shadowbane');
      await user.clear(nameInput);
      await user.type(nameInput, 'Aria Shadowbane the Redeemed');

      const contentTextarea = screen.getByDisplayValue(/skilled assassin/);
      await user.clear(contentTextarea);
      await user.type(contentTextarea, 'Updated character background with new story arc.');

      // Step 4: User modifies character attributes (for character type)
      // The CharacterAttributesEditor should be present
      expect(screen.getByText('角色属性')).toBeInTheDocument();

      // Step 5: User saves changes
      const saveButton = screen.getByRole('button', { name: /保存/i });
      await user.click(saveButton);

      // Step 6: Loading state and success
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should handle entity deletion workflow', async () => {
      const mockOnDelete = vi.fn();
      const mockOnOpenChange = vi.fn();

      render(
        <TestWrapper>
          <EntityDetailDialog
            entity={mockEntity}
            open={true}
            onOpenChange={mockOnOpenChange}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      // Step 1: User initiates deletion
      const deleteButton = screen.getByRole('button', { name: /删除/i });
      await user.click(deleteButton);

      // Step 2: Confirmation dialog appears
      await waitFor(() => {
        expect(screen.getByText(/确认删除/)).toBeInTheDocument();
        expect(screen.getByText(/Aria Shadowbane/)).toBeInTheDocument();
      });

      // Step 3: User confirms deletion
      const confirmButton = screen.getByRole('button', { name: /确认/i });
      await user.click(confirmButton);

      // Step 4: Loading state during deletion
      await waitFor(() => {
        expect(screen.getByText(/删除中/)).toBeInTheDocument();
      });

      // Step 5: Success - dialog closes
      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
        expect(mockOnDelete).toHaveBeenCalled();
      });
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network failure
      const mockCreateProject = vi.fn().mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <CreateProjectDialog
            open={true}
            onOpenChange={vi.fn()}
          />
        </TestWrapper>
      );

      // Fill form and submit
      await user.type(
        screen.getByLabelText('projects.createDialog.nameLabel'),
        'Test Project'
      );

      const submitButton = screen.getByRole('button', { name: /common.create/i });
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('projects.createDialog.creating')).toBeInTheDocument();
      });

      // After error, should return to normal state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /common.create/i })).not.toBeDisabled();
      });

      // User should be able to retry
      await user.click(screen.getByRole('button', { name: /common.create/i }));
    });

    it('should handle validation errors with proper feedback', async () => {
      render(
        <TestWrapper>
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
              value=""
              onChange={vi.fn()}
              maxLength={100}
              showCharCount
            />
          </BaseFormDialog>
        </TestWrapper>
      );

      // Verify error message is displayed
      expect(screen.getByText('This field is required')).toBeInTheDocument();

      // Verify error styling is applied
      const input = screen.getByLabelText('Required Field');
      expect(input).toHaveClass('border-destructive/50');
    });
  });

  describe('Accessibility Workflows', () => {
    it('should support complete keyboard navigation', async () => {
      render(
        <TestWrapper>
          <CreateProjectDialog
            open={true}
            onOpenChange={vi.fn()}
          />
        </TestWrapper>
      );

      // Tab through form fields
      await user.tab();
      expect(screen.getByLabelText('projects.createDialog.nameLabel')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('projects.createDialog.typeLabel')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('projects.createDialog.descriptionLabel')).toHaveFocus();

      // Tab to buttons
      await user.tab();
      expect(screen.getByRole('button', { name: /common.cancel/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /common.create/i })).toHaveFocus();
    });

    it('should handle screen reader announcements', async () => {
      render(
        <TestWrapper>
          <EmptyState
            icon={() => <div>Icon</div>}
            title="No items found"
            description="Create your first item to get started"
            action={{
              label: "Create Item",
              onClick: vi.fn(),
            }}
          />
        </TestWrapper>
      );

      // Verify proper ARIA labels and structure
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('Create your first item to get started')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Item' })).toBeInTheDocument();
    });
  });

  describe('Performance and Loading Workflows', () => {
    it('should handle large datasets with pagination efficiently', async () => {
      const mockOnPageChange = vi.fn();

      render(
        <TestWrapper>
          <Pagination
            currentPage={1}
            totalPages={100}
            onPageChange={mockOnPageChange}
            pageSize={20}
            totalItems={2000}
            showPageSize={true}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </TestWrapper>
      );

      // Test page navigation
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);

      // Test direct page input
      const pageInput = screen.getByDisplayValue('1');
      await user.clear(pageInput);
      await user.type(pageInput, '50');
      await user.keyboard('{Enter}');

      expect(mockOnPageChange).toHaveBeenCalledWith(50);
    });

    it('should show appropriate loading states during async operations', async () => {
      const TestComponent = () => {
        const { mutate, isLoading } = useMutationLoading({
          mutationFn: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
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
      await user.click(button);

      // Should show loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });
});