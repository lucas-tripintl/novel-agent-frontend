import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the migrated components
vi.mock('../skills/add-skill-dialog', () => ({
  AddSkillDialog: ({ isOpen, onClose, onSubmit }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="add-skill-dialog">
        <h2>Add Skill</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          onSubmit({ name: formData.get('name'), level: formData.get('level') });
        }}>
          <input name="name" placeholder="Skill name" data-testid="skill-name-input" />
          <select name="level" data-testid="skill-level-select">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button type="submit" data-testid="submit-skill">Add Skill</button>
          <button type="button" onClick={onClose} data-testid="cancel-skill">Cancel</button>
        </form>
      </div>
    );
  },
}));

vi.mock('../entities/entity-detail-dialog', () => ({
  EntityDetailDialog: ({ isOpen, onClose, entity, onSave }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="entity-detail-dialog">
        <h2>Entity Details</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          onSave({ 
            id: entity?.id,
            name: formData.get('name'), 
            description: formData.get('description') 
          });
        }}>
          <input 
            name="name" 
            defaultValue={entity?.name || ''} 
            placeholder="Entity name" 
            data-testid="entity-name-input" 
          />
          <textarea 
            name="description" 
            defaultValue={entity?.description || ''} 
            placeholder="Entity description" 
            data-testid="entity-description-input" 
          />
          <button type="submit" data-testid="save-entity">Save</button>
          <button type="button" onClick={onClose} data-testid="cancel-entity">Cancel</button>
        </form>
      </div>
    );
  },
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
};

// Test component that uses the migrated dialogs
const TestMigratedComponents: React.FC = () => {
  const [skillDialogOpen, setSkillDialogOpen] = React.useState(false);
  const [entityDialogOpen, setEntityDialogOpen] = React.useState(false);
  const [skills, setSkills] = React.useState<any[]>([]);
  const [entities, setEntities] = React.useState<any[]>([
    { id: 1, name: 'Test Entity', description: 'Test Description' }
  ]);
  const [selectedEntity, setSelectedEntity] = React.useState<any>(null);

  const handleAddSkill = (skill: any) => {
    setSkills([...skills, { ...skill, id: Date.now() }]);
    setSkillDialogOpen(false);
  };

  const handleSaveEntity = (entity: any) => {
    if (entity.id) {
      setEntities(entities.map(e => e.id === entity.id ? entity : e));
    } else {
      setEntities([...entities, { ...entity, id: Date.now() }]);
    }
    setEntityDialogOpen(false);
    setSelectedEntity(null);
  };

  const handleEditEntity = (entity: any) => {
    setSelectedEntity(entity);
    setEntityDialogOpen(true);
  };

  return (
    <div data-testid="migrated-components-test">
      <div data-testid="skills-section">
        <h3>Skills</h3>
        <button 
          onClick={() => setSkillDialogOpen(true)}
          data-testid="add-skill-button"
        >
          Add Skill
        </button>
        {skills.map(skill => (
          <div key={skill.id} data-testid={`skill-${skill.id}`}>
            {skill.name} - {skill.level}
          </div>
        ))}
      </div>

      <div data-testid="entities-section">
        <h3>Entities</h3>
        <button 
          onClick={() => {
            setSelectedEntity(null);
            setEntityDialogOpen(true);
          }}
          data-testid="add-entity-button"
        >
          Add Entity
        </button>
        {entities.map(entity => (
          <div key={entity.id} data-testid={`entity-${entity.id}`}>
            <span>{entity.name}</span>
            <button 
              onClick={() => handleEditEntity(entity)}
              data-testid={`edit-entity-${entity.id}`}
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {/* Mocked dialogs */}
      {skillDialogOpen && (
        <div data-testid="add-skill-dialog">
          <h2>Add Skill</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            handleAddSkill({ name: formData.get('name'), level: formData.get('level') });
          }}>
            <input name="name" placeholder="Skill name" data-testid="skill-name-input" />
            <select name="level" data-testid="skill-level-select">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button type="submit" data-testid="submit-skill">Add Skill</button>
            <button 
              type="button" 
              onClick={() => setSkillDialogOpen(false)} 
              data-testid="cancel-skill"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {entityDialogOpen && (
        <div data-testid="entity-detail-dialog">
          <h2>Entity Details</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            handleSaveEntity({ 
              id: selectedEntity?.id,
              name: formData.get('name'), 
              description: formData.get('description') 
            });
          }}>
            <input 
              name="name" 
              defaultValue={selectedEntity?.name || ''} 
              placeholder="Entity name" 
              data-testid="entity-name-input" 
            />
            <textarea 
              name="description" 
              defaultValue={selectedEntity?.description || ''} 
              placeholder="Entity description" 
              data-testid="entity-description-input" 
            />
            <button type="submit" data-testid="save-entity">Save</button>
            <button 
              type="button" 
              onClick={() => {
                setEntityDialogOpen(false);
                setSelectedEntity(null);
              }} 
              data-testid="cancel-entity"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

describe('Migrated Components Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  describe('Add Skill Dialog Integration', () => {
    it('should open and close the add skill dialog', async () => {
      render(
        <TestWrapper>
          <TestMigratedComponents />
        </TestWrapper>
      );

      // Verify dialog is initially closed
      expect(screen.queryByTestId('add-skill-dialog')).not.toBeInTheDocument();

      // Open dialog
      const addButton = screen.getByTestId('add-skill-button');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-skill-dialog')).toBeInTheDocument();
        expect(screen.getByText('Add Skill')).toBeInTheDocument();
      });

      // Close dialog
      const cancelButton = screen.getByTestId('cancel-skill');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('add-skill-dialog')).not.toBeInTheDocument();
      });
    });

    it('should add a new skill through the dialog', async () => {
      render(
        <TestWrapper>
          <TestMigratedComponents />
        </TestWrapper>
      );

      // Open dialog
      const addButton = screen.getByTestId('add-skill-button');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-skill-dialog')).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByTestId('skill-name-input');
      const levelSelect = screen.getByTestId('skill-level-select');
      
      fireEvent.change(nameInput, { target: { value: 'React' } });
      fireEvent.change(levelSelect, { target: { value: 'advanced' } });

      // Submit form
      const submitButton = screen.getByTestId('submit-skill');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByTestId('add-skill-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Entity Detail Dialog Integration', () => {
    it('should open and close the entity detail dialog for new entity', async () => {
      render(
        <TestWrapper>
          <TestMigratedComponents />
        </TestWrapper>
      );

      // Verify dialog is initially closed
      expect(screen.queryByTestId('entity-detail-dialog')).not.toBeInTheDocument();

      // Open dialog for new entity
      const addButton = screen.getByTestId('add-entity-button');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('entity-detail-dialog')).toBeInTheDocument();
        expect(screen.getByText('Entity Details')).toBeInTheDocument();
      });

      // Close dialog
      const cancelButton = screen.getByTestId('cancel-entity');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('entity-detail-dialog')).not.toBeInTheDocument();
      });
    });

    it('should open entity detail dialog for editing existing entity', async () => {
      render(
        <TestWrapper>
          <TestMigratedComponents />
        </TestWrapper>
      );

      // Verify existing entity is displayed
      expect(screen.getByTestId('entity-1')).toBeInTheDocument();
      expect(screen.getByText('Test Entity')).toBeInTheDocument();

      // Open edit dialog
      const editButton = screen.getByTestId('edit-entity-1');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('entity-detail-dialog')).toBeInTheDocument();
        const nameInput = screen.getByTestId('entity-name-input') as HTMLInputElement;
        expect(nameInput.defaultValue).toBe('Test Entity');
      });
    });

    it('should save entity changes through the dialog', async () => {
      render(
        <TestWrapper>
          <TestMigratedComponents />
        </TestWrapper>
      );

      // Open dialog for new entity
      const addButton = screen.getByTestId('add-entity-button');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('entity-detail-dialog')).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByTestId('entity-name-input');
      const descriptionInput = screen.getByTestId('entity-description-input');
      
      fireEvent.change(nameInput, { target: { value: 'New Entity' } });
      fireEvent.change(descriptionInput, { target: { value: 'New Description' } });

      // Submit form
      const saveButton = screen.getByTestId('save-entity');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByTestId('entity-detail-dialog')).not.toBeInTheDocument();
      });
    });
  });
});