import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { FormInput, FormTextarea, FormSelect, FormLabel, FormError } from './index';

// Mock the enum store
vi.mock('@/stores/enum-store', () => ({
  useEnumStore: vi.fn((selector) => {
    const mockState = {
      getEnumItems: vi.fn(() => [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' }
      ])
    };
    return selector ? selector(mockState) : mockState;
  })
}));

describe('Form Components', () => {
  describe('FormInput', () => {
    it('renders with label and handles input changes', () => {
      const mockOnChange = vi.fn();
      render(
        <FormInput
          label="Test Input"
          value=""
          onChange={mockOnChange}
          placeholder="Enter text"
        />
      );

      const input = screen.getByLabelText('Test Input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Enter text');

      fireEvent.change(input, { target: { value: 'test value' } });
      expect(mockOnChange).toHaveBeenCalledWith('test value');
    });

    it('displays error message when error prop is provided', () => {
      render(
        <FormInput
          label="Test Input"
          value=""
          onChange={() => {}}
          error="This field is required"
        />
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('shows required indicator when required prop is true', () => {
      render(
        <FormInput
          label="Required Input"
          value=""
          onChange={() => {}}
          required
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('FormTextarea', () => {
    it('renders with character count when showCharCount is true', () => {
      render(
        <FormTextarea
          label="Test Textarea"
          value="Hello"
          onChange={() => {}}
          showCharCount
          maxLength={100}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('enforces maxLength when provided', () => {
      const mockOnChange = vi.fn();
      render(
        <FormTextarea
          label="Test Textarea"
          value=""
          onChange={mockOnChange}
          maxLength={5}
        />
      );

      const textarea = screen.getByLabelText('Test Textarea');
      
      // Try to input text longer than maxLength
      fireEvent.change(textarea, { target: { value: 'toolong' } });
      
      // onChange should not be called for text exceeding maxLength
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('FormSelect', () => {
    it('renders with manual options', () => {
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' }
      ];

      render(
        <FormSelect
          label="Test Select"
          value=""
          onChange={() => {}}
          options={options}
        />
      );

      expect(screen.getByLabelText('Test Select')).toBeInTheDocument();
    });

    it('renders with enum support', () => {
      render(
        <FormSelect
          label="Enum Select"
          value=""
          onChange={() => {}}
          enumName="TestEnum"
        />
      );

      expect(screen.getByLabelText('Enum Select')).toBeInTheDocument();
    });
  });

  describe('FormLabel', () => {
    it('renders with required indicator', () => {
      render(
        <FormLabel required>
          Test Label
        </FormLabel>
      );

      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('FormError', () => {
    it('renders error message', () => {
      render(
        <FormError>
          Error message
        </FormError>
      );

      const errorElement = screen.getByText('Error message');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveAttribute('role', 'alert');
    });

    it('does not render when no children provided', () => {
      const { container } = render(<FormError />);
      expect(container.firstChild).toBeNull();
    });
  });
});