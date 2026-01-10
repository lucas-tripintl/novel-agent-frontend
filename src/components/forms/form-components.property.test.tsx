import { render } from '@testing-library/react';
import { vi } from 'vitest';
import * as fc from 'fast-check';
import { FormInput, FormTextarea, FormSelect } from './index';
import { DESIGN_TOKENS } from '@/lib/design-tokens';

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

describe('Form Components Property Tests', () => {
  /**
   * Feature: codebase-refactoring, Property 3: Form Field Styling Consistency
   * 
   * For any form input component (FormInput, FormTextarea, FormSelect), 
   * the rendered element should use consistent background, border, and focus styling classes
   * (bg-background/50, border-border/50, focus-visible:ring-1)
   * 
   * Validates: Requirements 3.1, 3.2, 3.5
   */
  test('Property 3: Form Field Styling Consistency', () => {
    fc.assert(fc.property(
      fc.record({
        componentType: fc.constantFrom('input', 'textarea', 'select'),
        value: fc.string({ maxLength: 100 }),
        label: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
        error: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
        disabled: fc.boolean(),
        required: fc.boolean(),
        placeholder: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
        description: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
        // FormTextarea specific props
        maxLength: fc.option(fc.integer({ min: 10, max: 1000 }), { nil: undefined }),
        showCharCount: fc.boolean(),
        rows: fc.option(fc.integer({ min: 2, max: 10 }), { nil: undefined }),
        // FormSelect specific props
        options: fc.array(fc.record({
          value: fc.string({ minLength: 1, maxLength: 20 }), // Ensure non-empty values for Select
          label: fc.string({ maxLength: 50 }),
          disabled: fc.option(fc.boolean(), { nil: undefined })
        }), { minLength: 1, maxLength: 5 })
      }),
      (config) => {
        const mockOnChange = vi.fn();
        let component;
        
        // Render the appropriate component based on type
        switch (config.componentType) {
          case 'input':
            component = render(
              <FormInput
                value={config.value}
                onChange={mockOnChange}
                label={config.label}
                error={config.error}
                disabled={config.disabled}
                required={config.required}
                placeholder={config.placeholder}
                description={config.description}
              />
            );
            break;
            
          case 'textarea':
            component = render(
              <FormTextarea
                value={config.value}
                onChange={mockOnChange}
                label={config.label}
                error={config.error}
                disabled={config.disabled}
                required={config.required}
                placeholder={config.placeholder}
                description={config.description}
                maxLength={config.maxLength}
                showCharCount={config.showCharCount}
                rows={config.rows}
              />
            );
            break;
            
          case 'select':
            component = render(
              <FormSelect
                value=""
                onChange={mockOnChange}
                label={config.label}
                error={config.error}
                disabled={config.disabled}
                required={config.required}
                placeholder={config.placeholder}
                description={config.description}
                options={config.options}
              />
            );
            break;
            
          default:
            throw new Error(`Unknown component type: ${config.componentType}`);
        }

        const { container } = component;
        
        // Find the actual input/textarea/select element
        let inputElement: HTMLElement | null = null;
        
        if (config.componentType === 'input') {
          inputElement = container.querySelector('input');
        } else if (config.componentType === 'textarea') {
          inputElement = container.querySelector('textarea');
        } else if (config.componentType === 'select') {
          // For select, we need to find the trigger button
          inputElement = container.querySelector('button[role="combobox"]');
        }
        
        expect(inputElement).toBeTruthy();
        
        if (inputElement) {
          const classList = Array.from(inputElement.classList);
          
          // Verify design token background styling is applied
          expect(classList).toContain('bg-background/50');
          
          // Verify base border class is present (the base UI uses just 'border')
          expect(classList).toContain('border');
          
          // Verify design token focus ring styling is applied
          expect(classList).toContain('focus-visible:ring-1');
          
          // If there's an error, verify error styling from design tokens
          if (config.error) {
            expect(classList).toContain('border-destructive/50');
            expect(classList).toContain('focus-visible:ring-destructive/30');
          } else {
            // If no error, check for default border and focus styling
            expect(classList).toContain('border-border/50');
            expect(classList).toContain('focus-visible:ring-primary/30');
          }
        }
        
        // Verify error message styling consistency if error is present
        if (config.error) {
          const errorElement = container.querySelector('[role="alert"]');
          expect(errorElement).toBeTruthy();
          
          if (errorElement) {
            const errorClassList = Array.from(errorElement.classList);
            expect(errorClassList).toContain('text-destructive');
            expect(errorClassList).toContain('text-xs');
          }
        }
        
        // Verify label styling consistency if label is present
        if (config.label) {
          const labelElement = container.querySelector('label');
          expect(labelElement).toBeTruthy();
          
          if (labelElement) {
            const labelClassList = Array.from(labelElement.classList);
            expect(labelClassList).toContain('text-sm');
            expect(labelClassList).toContain('font-medium');
          }
        }
        
        // Verify description styling consistency if description is present
        if (config.description) {
          const descriptionElement = container.querySelector('p:not([role="alert"])');
          expect(descriptionElement).toBeTruthy();
          
          if (descriptionElement && descriptionElement.textContent === config.description) {
            const descriptionClassList = Array.from(descriptionElement.classList);
            expect(descriptionClassList).toContain('text-xs');
            expect(descriptionClassList).toContain('text-muted-foreground');
          }
        }
      }
    ), { 
      numRuns: 100,
      verbose: true 
    });
  });

  /**
   * Feature: codebase-refactoring, Property 7: Form Validation Error Display
   * 
   * For any form field with validation errors, error messages should be displayed 
   * with consistent typography (text-destructive) and positioning below the input
   * 
   * Validates: Requirements 3.3, 4.2
   */
  test('Property 7: Form Validation Error Display', () => {
    fc.assert(fc.property(
      fc.record({
        componentType: fc.constantFrom('input', 'textarea', 'select'),
        value: fc.string({ maxLength: 100 }),
        label: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
        error: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0 && !s.includes('\n')), // Always have a non-whitespace error for this test
        disabled: fc.boolean(),
        required: fc.boolean(),
        placeholder: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
        description: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
        // FormTextarea specific props
        maxLength: fc.option(fc.integer({ min: 10, max: 1000 }), { nil: undefined }),
        showCharCount: fc.boolean(),
        rows: fc.option(fc.integer({ min: 2, max: 10 }), { nil: undefined }),
        // FormSelect specific props
        options: fc.array(fc.record({
          value: fc.string({ minLength: 1, maxLength: 20 }),
          label: fc.string({ maxLength: 50 }),
          disabled: fc.option(fc.boolean(), { nil: undefined })
        }), { minLength: 1, maxLength: 5 })
      }),
      (config) => {
        const mockOnChange = vi.fn();
        let component;
        
        // Render the appropriate component based on type
        switch (config.componentType) {
          case 'input':
            component = render(
              <FormInput
                value={config.value}
                onChange={mockOnChange}
                label={config.label}
                error={config.error}
                disabled={config.disabled}
                required={config.required}
                placeholder={config.placeholder}
                description={config.description}
              />
            );
            break;
            
          case 'textarea':
            component = render(
              <FormTextarea
                value={config.value}
                onChange={mockOnChange}
                label={config.label}
                error={config.error}
                disabled={config.disabled}
                required={config.required}
                placeholder={config.placeholder}
                description={config.description}
                maxLength={config.maxLength}
                showCharCount={config.showCharCount}
                rows={config.rows}
              />
            );
            break;
            
          case 'select':
            component = render(
              <FormSelect
                value=""
                onChange={mockOnChange}
                label={config.label}
                error={config.error}
                disabled={config.disabled}
                required={config.required}
                placeholder={config.placeholder}
                description={config.description}
                options={config.options}
              />
            );
            break;
            
          default:
            throw new Error(`Unknown component type: ${config.componentType}`);
        }

        const { container } = component;
        
        // Since we always have an error in this test, verify error message display
        const errorElement = container.querySelector('[role="alert"]');
        expect(errorElement).toBeTruthy();
        expect(errorElement).toHaveTextContent(config.error.trim());
        
        if (errorElement) {
          const errorClassList = Array.from(errorElement.classList);
          
          // Verify consistent error typography from design tokens
          expect(errorClassList).toContain('text-destructive');
          expect(errorClassList).toContain('text-xs');
          
          // Verify error message positioning - should be below the input
          const inputElement = config.componentType === 'input' 
            ? container.querySelector('input')
            : config.componentType === 'textarea'
            ? container.querySelector('textarea')
            : container.querySelector('button[role="combobox"]');
          
          expect(inputElement).toBeTruthy();
          
          if (inputElement) {
            // For textarea, the structure is different - textarea is inside a relative div
            // but error is at the same level as the relative div
            const formContainer = container.querySelector('.space-y-2');
            expect(formContainer).toBeTruthy();
            
            if (formContainer) {
              // Both input container and error should be children of the form container
              const inputContainer = config.componentType === 'textarea' 
                ? formContainer.querySelector('.relative')
                : inputElement.parentElement;
              
              expect(inputContainer).toBeTruthy();
              expect(formContainer.contains(inputContainer!)).toBe(true);
              expect(formContainer.contains(errorElement)).toBe(true);
              
              // Error element should come after input container in DOM order
              const formChildren = Array.from(formContainer.children);
              const inputContainerIndex = formChildren.indexOf(inputContainer as Element);
              const errorIndex = formChildren.indexOf(errorElement);
              expect(errorIndex).toBeGreaterThan(inputContainerIndex);
            }
          }
        }
        
        // Verify that the input field has error styling when error is present
        let inputElement: HTMLElement | null = null;
        
        if (config.componentType === 'input') {
          inputElement = container.querySelector('input');
        } else if (config.componentType === 'textarea') {
          inputElement = container.querySelector('textarea');
        } else if (config.componentType === 'select') {
          inputElement = container.querySelector('button[role="combobox"]');
        }
        
        expect(inputElement).toBeTruthy();
        
        if (inputElement) {
          const classList = Array.from(inputElement.classList);
          
          // Verify error styling is applied to the input field
          expect(classList).toContain('border-destructive/50');
          expect(classList).toContain('focus-visible:ring-destructive/30');
          
          // Verify aria-invalid is set to true for accessibility
          expect(inputElement.getAttribute('aria-invalid')).toBe('true');
          
          // Verify aria-describedby includes the error element ID for accessibility
          const ariaDescribedBy = inputElement.getAttribute('aria-describedby');
          expect(ariaDescribedBy).toBeTruthy();
          
          if (ariaDescribedBy) {
            const errorId = errorElement?.getAttribute('id');
            expect(errorId).toBeTruthy();
            expect(ariaDescribedBy).toContain(errorId!);
          }
        }
      }
    ), { 
      numRuns: 100,
      verbose: true 
    });
  });
});