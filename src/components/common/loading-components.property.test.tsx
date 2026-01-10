/**
 * Property-based tests for loading UI components
 * Testing consistent loading state behavior and styling
 */

import { render } from '@testing-library/react';
import { vi } from 'vitest';
import * as fc from 'fast-check';
import { LoadingOverlay } from './loading-overlay';
import { LoadingButton } from './loading-button';
import { SkeletonCard, SkeletonList, SkeletonForm, SkeletonText } from './skeleton-card';

describe('Loading Components Property Tests', () => {
  /**
   * Feature: codebase-refactoring, Property 6: Loading UI Consistency
   * 
   * For any component in loading state, interactive elements should be disabled 
   * and Loader2 icons should be displayed with consistent styling
   * 
   * Validates: Requirements 2.2, 2.3
   */
  test('Property 6: Loading UI Consistency', () => {
    fc.assert(fc.property(
      fc.record({
        componentType: fc.constantFrom('loadingButton', 'loadingOverlay'),
        isLoading: fc.boolean(),
        // LoadingButton specific props
        buttonText: fc.string({ maxLength: 50 }),
        loadingText: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
        disabled: fc.boolean(),
        variant: fc.constantFrom('default', 'destructive', 'outline', 'secondary', 'ghost', 'link'),
        size: fc.constantFrom('default', 'sm', 'lg', 'icon'),
        // LoadingOverlay specific props
        overlayMessage: fc.option(fc.string({ maxLength: 100 }).filter(s => !s.includes('\n')), { nil: undefined }),
        overlaySize: fc.constantFrom('sm', 'md', 'lg'),
        hasChildren: fc.boolean(),
        childrenText: fc.string({ maxLength: 100 }),
      }),
      (config) => {
        const mockOnClick = vi.fn();
        let component;
        
        // Render the appropriate loading component based on type
        switch (config.componentType) {
          case 'loadingButton':
            component = render(
              <LoadingButton
                loading={config.isLoading}
                loadingText={config.loadingText}
                disabled={config.disabled}
                variant={config.variant}
                size={config.size}
                onClick={mockOnClick}
              >
                {config.buttonText}
              </LoadingButton>
            );
            break;
            
          case 'loadingOverlay':
            component = render(
              <LoadingOverlay
                isLoading={config.isLoading}
                message={config.overlayMessage}
                size={config.overlaySize}
              >
                {config.hasChildren ? <div>{config.childrenText}</div> : undefined}
              </LoadingOverlay>
            );
            break;
            
          default:
            throw new Error(`Unknown component type: ${config.componentType}`);
        }

        const { container } = component;
        
        if (config.componentType === 'loadingButton') {
          // Test LoadingButton loading state consistency
          const buttonElement = container.querySelector('button');
          expect(buttonElement).toBeTruthy();
          
          if (buttonElement) {
            // When loading or disabled, button should be disabled
            const shouldBeDisabled = config.isLoading || config.disabled;
            expect(buttonElement.disabled).toBe(shouldBeDisabled);
            
            if (config.isLoading) {
              // When loading, should display Loader2 icon with consistent styling
              // The Loader2 icon might not have data-lucide attribute, so look for the SVG with animate-spin
              const loaderIcon = container.querySelector('svg.animate-spin') || 
                                container.querySelector('svg[data-lucide="loader-2"]');
              expect(loaderIcon).toBeTruthy();
              
              if (loaderIcon) {
                const iconClassList = Array.from(loaderIcon.classList);
                
                // Verify consistent Loader2 icon styling
                expect(iconClassList).toContain('animate-spin');
                expect(iconClassList).toContain('h-4');
                expect(iconClassList).toContain('w-4');
                expect(iconClassList).toContain('mr-2');
              }
              
              // When loading, should show loading text if provided, otherwise original text
              // Focus on core loading behavior rather than exact whitespace matching
              const expectedText = (config.loadingText && config.loadingText.trim()) ? config.loadingText : config.buttonText;
              if (expectedText.trim()) {
                // Use a more flexible check that handles whitespace normalization
                const buttonText = buttonElement.textContent || '';
                expect(buttonText.trim()).toBe(expectedText.trim());
              }
            } else {
              // When not loading, should not have Loader2 icon
              const loaderIcon = container.querySelector('svg.animate-spin') || 
                                container.querySelector('svg[data-lucide="loader-2"]');
              expect(loaderIcon).toBeFalsy();
              
              // Should show original button text
              if (config.buttonText.trim()) {
                // Use a more flexible check that handles whitespace normalization
                const buttonText = buttonElement.textContent || '';
                expect(buttonText.trim()).toBe(config.buttonText.trim());
              }
            }
          }
        }
        
        if (config.componentType === 'loadingOverlay') {
          if (config.isLoading) {
            // When loading, should display overlay with Loader2 icon
            const overlayElement = container.querySelector('.absolute.inset-0');
            expect(overlayElement).toBeTruthy();
            
            if (overlayElement) {
              const overlayClassList = Array.from(overlayElement.classList);
              
              // Verify consistent overlay styling
              expect(overlayClassList).toContain('bg-background/80');
              expect(overlayClassList).toContain('backdrop-blur-sm');
              expect(overlayClassList).toContain('flex');
              expect(overlayClassList).toContain('items-center');
              expect(overlayClassList).toContain('justify-center');
              expect(overlayClassList).toContain('z-50');
            }
            
            // Should display Loader2 icon with consistent styling
            const loaderIcon = container.querySelector('svg.animate-spin') || 
                              container.querySelector('svg[data-lucide="loader-2"]');
            expect(loaderIcon).toBeTruthy();
            
            if (loaderIcon) {
              const iconClassList = Array.from(loaderIcon.classList);
              
              // Verify consistent Loader2 icon styling
              expect(iconClassList).toContain('animate-spin');
              expect(iconClassList).toContain('text-primary');
              
              // Verify size-specific classes based on config
              switch (config.overlaySize) {
                case 'sm':
                  expect(iconClassList).toContain('h-4');
                  expect(iconClassList).toContain('w-4');
                  break;
                case 'md':
                  expect(iconClassList).toContain('h-6');
                  expect(iconClassList).toContain('w-6');
                  break;
                case 'lg':
                  expect(iconClassList).toContain('h-8');
                  expect(iconClassList).toContain('w-8');
                  break;
              }
            }
            
            // If message is provided, should display it with consistent styling
            if (config.overlayMessage && config.overlayMessage.trim()) {
              const messageElement = container.querySelector('p');
              expect(messageElement).toBeTruthy();
              expect(messageElement).toHaveTextContent(config.overlayMessage.trim());
              
              if (messageElement) {
                const messageClassList = Array.from(messageElement.classList);
                expect(messageClassList).toContain('text-sm');
                expect(messageClassList).toContain('text-muted-foreground');
                expect(messageClassList).toContain('font-medium');
              }
            }
          } else {
            // When not loading, should not display overlay
            const overlayElement = container.querySelector('.absolute.inset-0');
            expect(overlayElement).toBeFalsy();
            
            // Should not display Loader2 icon
            const loaderIcon = container.querySelector('svg.animate-spin') || 
                              container.querySelector('svg[data-lucide="loader-2"]');
            expect(loaderIcon).toBeFalsy();
          }
          
          // Children should always be rendered (if provided)
          if (config.hasChildren && config.childrenText.trim()) {
            // Use a more flexible text content check that handles whitespace normalization
            const containerText = container.textContent || '';
            expect(containerText.includes(config.childrenText.trim())).toBe(true);
          }
        }
      }
    ), { 
      numRuns: 100,
      verbose: true 
    });
  });

  /**
   * Feature: codebase-refactoring, Property 4: Skeleton Component Structure Consistency
   * 
   * For any skeleton component, the rendered output should contain placeholder elements 
   * with consistent animation and sizing classes
   * 
   * Validates: Requirements 1.4
   */
  test('Property 4: Skeleton Component Structure Consistency', () => {
    fc.assert(fc.property(
      fc.record({
        componentType: fc.constantFrom('skeletonCard', 'skeletonList', 'skeletonForm', 'skeletonText'),
        // SkeletonCard props
        showHeader: fc.boolean(),
        showFooter: fc.boolean(),
        cardLines: fc.integer({ min: 1, max: 10 }),
        // SkeletonList props
        listCount: fc.integer({ min: 1, max: 20 }),
        itemHeight: fc.integer({ min: 40, max: 120 }),
        showDividers: fc.boolean(),
        // SkeletonForm props
        fieldCount: fc.integer({ min: 1, max: 10 }),
        formShowHeader: fc.boolean(),
        formShowFooter: fc.boolean(),
        // SkeletonText props
        textLines: fc.integer({ min: 1, max: 15 }),
      }),
      (config) => {
        let component;
        
        // Render the appropriate skeleton component based on type
        switch (config.componentType) {
          case 'skeletonCard':
            component = render(
              <SkeletonCard
                showHeader={config.showHeader}
                showFooter={config.showFooter}
                lines={config.cardLines}
              />
            );
            break;
            
          case 'skeletonList':
            component = render(
              <SkeletonList
                count={config.listCount}
                itemHeight={config.itemHeight}
                showDividers={config.showDividers}
              />
            );
            break;
            
          case 'skeletonForm':
            component = render(
              <SkeletonForm
                fieldCount={config.fieldCount}
                showHeader={config.formShowHeader}
                showFooter={config.formShowFooter}
              />
            );
            break;
            
          case 'skeletonText':
            component = render(
              <SkeletonText lines={config.textLines} />
            );
            break;
            
          default:
            throw new Error(`Unknown component type: ${config.componentType}`);
        }

        const { container } = component;
        
        // All skeleton components should have skeleton elements with consistent animation
        const skeletonElements = container.querySelectorAll('[data-slot="skeleton"]');
        expect(skeletonElements.length).toBeGreaterThan(0);
        
        // Verify each skeleton element has consistent animation classes
        skeletonElements.forEach((skeleton) => {
          const classList = Array.from(skeleton.classList);
          
          // All skeleton elements should have animate-pulse for consistent animation
          expect(classList).toContain('animate-pulse');
          
          // All skeleton elements should have consistent background
          expect(classList).toContain('bg-accent');
          
          // All skeleton elements should have rounded corners (may vary: rounded-md, rounded-full)
          expect(classList.some(cls => cls.startsWith('rounded'))).toBe(true);
        });
        
        // Component-specific structure validation
        if (config.componentType === 'skeletonCard') {
          // Should have card structure
          const cardElement = container.querySelector('[data-slot="card"]');
          expect(cardElement).toBeTruthy();
          
          if (config.showHeader) {
            // Should have header with avatar and text skeletons
            const headerElement = container.querySelector('[data-slot="card-header"]');
            expect(headerElement).toBeTruthy();
            
            // Should have avatar skeleton (rounded-full)
            const avatarSkeleton = container.querySelector('.rounded-full');
            expect(avatarSkeleton).toBeTruthy();
          }
          
          // Should have correct number of content line skeletons
          const contentContainer = container.querySelector('[data-slot="card-content"]');
          expect(contentContainer).toBeTruthy();
          
          if (contentContainer) {
            // Count only the direct content line skeletons (not footer skeletons)
            const directContentSkeletons = Array.from(contentContainer.children).filter(
              (child) => child.hasAttribute('data-slot') && child.getAttribute('data-slot') === 'skeleton'
            );
            expect(directContentSkeletons.length).toBe(config.cardLines);
          }
          
          if (config.showFooter) {
            // Should have footer with button skeletons
            const footerSkeletons = container.querySelectorAll('.flex.gap-2 [data-slot="skeleton"]');
            expect(footerSkeletons.length).toBeGreaterThan(0);
          }
        }
        
        if (config.componentType === 'skeletonList') {
          // Should have correct number of list items
          const listItems = container.querySelectorAll('.flex.items-center');
          expect(listItems.length).toBe(config.listCount);
          
          // Each item should have consistent structure (avatar + text + badge)
          listItems.forEach((item) => {
            const itemSkeletons = item.querySelectorAll('[data-slot="skeleton"]');
            expect(itemSkeletons.length).toBeGreaterThanOrEqual(3); // avatar + 2 text lines + badge
          });
          
          if (config.showDividers && config.listCount > 1) {
            // Should have dividers between items
            const dividers = container.querySelectorAll('.border-b');
            expect(dividers.length).toBe(config.listCount - 1);
          }
        }
        
        if (config.componentType === 'skeletonForm') {
          if (config.formShowHeader) {
            // Should have header skeletons
            const headerSkeletons = container.querySelectorAll('.space-y-2:first-child [data-slot="skeleton"]');
            expect(headerSkeletons.length).toBeGreaterThanOrEqual(2); // title + description
          }
          
          // Should have correct number of form field skeletons
          const fieldContainers = container.querySelectorAll('.space-y-4 > .space-y-2');
          expect(fieldContainers.length).toBe(config.fieldCount);
          
          // Each field should have label + input skeleton
          fieldContainers.forEach((field) => {
            const fieldSkeletons = field.querySelectorAll('[data-slot="skeleton"]');
            expect(fieldSkeletons.length).toBe(2); // label + input
          });
          
          if (config.formShowFooter) {
            // Should have footer with button skeletons
            const footerSkeletons = container.querySelectorAll('.flex.gap-2 [data-slot="skeleton"]');
            expect(footerSkeletons.length).toBeGreaterThan(0);
          }
        }
        
        if (config.componentType === 'skeletonText') {
          // Should have correct number of text line skeletons
          const textSkeletons = container.querySelectorAll('[data-slot="skeleton"]');
          expect(textSkeletons.length).toBe(config.textLines);
          
          // Last line should be shorter (3/4 width) for natural text appearance
          if (config.textLines > 1) {
            const lastSkeleton = textSkeletons[textSkeletons.length - 1];
            const lastSkeletonClasses = Array.from(lastSkeleton.classList);
            expect(lastSkeletonClasses).toContain('w-3/4');
          }
        }
      }
    ), { 
      numRuns: 100,
      verbose: true 
    });
  });
});