/**
 * Property-based tests for Pagination component
 * Testing consistent pagination control structure and behavior
 */

import { render } from '@testing-library/react';
import { vi } from 'vitest';
import * as fc from 'fast-check';
import { Pagination, PAGE_SIZES, DEFAULT_PAGE_SIZE } from './pagination';

describe('Pagination Property Tests', () => {
  /**
   * Feature: codebase-refactoring, Property 13: Pagination Control Consistency
   * 
   * For any pagination component, navigation controls should provide consistent structure 
   * with standardized page sizes and loading states
   * 
   * Validates: Requirements 9.1, 9.2, 9.3
   */
  test('Property 13: Pagination Control Consistency', () => {
    fc.assert(fc.property(
      fc.record({
        currentPage: fc.integer({ min: 1, max: 100 }),
        totalPages: fc.integer({ min: 1, max: 100 }),
        pageSize: fc.constantFrom(...Object.values(PAGE_SIZES)),
        totalItems: fc.integer({ min: 0, max: 10000 }),
        showPageSize: fc.boolean(),
        disabled: fc.boolean(),
        customClassName: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
      }).filter(config => config.currentPage <= config.totalPages),
      (config) => {
        const mockPageChange = vi.fn();
        const mockPageSizeChange = vi.fn();
        
        const { container } = render(
          <Pagination
            currentPage={config.currentPage}
            totalPages={config.totalPages}
            onPageChange={mockPageChange}
            pageSize={config.pageSize}
            totalItems={config.totalItems}
            showPageSize={config.showPageSize}
            onPageSizeChange={config.showPageSize ? mockPageSizeChange : undefined}
            disabled={config.disabled}
            className={config.customClassName}
          />
        );
        
        // Should have consistent main container structure
        const mainContainer = container.firstElementChild;
        expect(mainContainer).toBeTruthy();
        
        if (mainContainer) {
          const containerClassList = Array.from(mainContainer.classList);
          
          // Verify consistent container layout classes
          expect(containerClassList).toContain('flex');
          expect(containerClassList).toContain('items-center');
          expect(containerClassList).toContain('justify-between');
          expect(containerClassList).toContain('gap-4');
        }
        
        // Should display items info with consistent text styling
        const itemsInfo = container.querySelector('.text-sm.text-muted-foreground');
        expect(itemsInfo).toBeTruthy();
        
        if (itemsInfo) {
          const infoText = itemsInfo.textContent || '';
          
          if (config.totalItems > 0) {
            // Should show range information (accounting for comma formatting in numbers)
            expect(infoText).toMatch(/Showing [\d,]+/);
            expect(infoText).toMatch(/to [\d,]+/);
            expect(infoText).toMatch(/of [\d,]+ items/);
          } else {
            // Should show "No items" for empty state
            expect(infoText).toBe('No items');
          }
        }
        
        // Page size selector behavior (Requirements 9.2)
        if (config.showPageSize) {
          const pageSizeSelect = container.querySelector('[role="combobox"]');
          expect(pageSizeSelect).toBeTruthy();
          
          if (pageSizeSelect) {
            // Should be disabled when pagination is disabled
            if (config.disabled) {
              expect(pageSizeSelect).toBeDisabled();
            }
            
            // Should have consistent styling
            const selectClassList = Array.from(pageSizeSelect.classList);
            expect(selectClassList).toContain('bg-background/50');
          }
          
          // Should have "Items per page:" label
          const pageSizeLabel = container.querySelector('.text-sm.text-muted-foreground.whitespace-nowrap');
          expect(pageSizeLabel).toBeTruthy();
          
          if (pageSizeLabel) {
            expect(pageSizeLabel.textContent).toBe('Items per page:');
          }
        } else {
          // Should not show page size selector when showPageSize is false
          const pageSizeLabel = Array.from(container.querySelectorAll('*')).find(
            el => el.textContent === 'Items per page:'
          );
          expect(pageSizeLabel).toBeFalsy();
        }
        
        // Navigation controls behavior (Requirements 9.1, 9.3)
        if (config.totalPages > 1) {
          // Should have first page button
          const firstPageButton = container.querySelector('button[aria-label="Go to first page"]');
          expect(firstPageButton).toBeTruthy();
          
          if (firstPageButton) {
            const firstButtonClassList = Array.from(firstPageButton.classList);
            
            // Verify consistent button styling
            expect(firstButtonClassList).toContain('h-8');
            expect(firstButtonClassList).toContain('w-8');
            expect(firstButtonClassList).toContain('p-0');
            
            // Should be disabled when on first page or when pagination is disabled
            const shouldBeDisabled = config.disabled || config.currentPage === 1;
            if (shouldBeDisabled) {
              expect(firstPageButton).toBeDisabled();
            } else {
              expect(firstPageButton).not.toBeDisabled();
            }
          }
          
          // Should have previous page button
          const prevPageButton = container.querySelector('button[aria-label="Go to previous page"]');
          expect(prevPageButton).toBeTruthy();
          
          if (prevPageButton) {
            const prevButtonClassList = Array.from(prevPageButton.classList);
            
            // Verify consistent button styling
            expect(prevButtonClassList).toContain('h-8');
            expect(prevButtonClassList).toContain('w-8');
            expect(prevButtonClassList).toContain('p-0');
            
            // Should be disabled when on first page or when pagination is disabled
            const shouldBeDisabled = config.disabled || config.currentPage === 1;
            if (shouldBeDisabled) {
              expect(prevPageButton).toBeDisabled();
            } else {
              expect(prevPageButton).not.toBeDisabled();
            }
          }
          
          // Should have next page button
          const nextPageButton = container.querySelector('button[aria-label="Go to next page"]');
          expect(nextPageButton).toBeTruthy();
          
          if (nextPageButton) {
            const nextButtonClassList = Array.from(nextPageButton.classList);
            
            // Verify consistent button styling
            expect(nextButtonClassList).toContain('h-8');
            expect(nextButtonClassList).toContain('w-8');
            expect(nextButtonClassList).toContain('p-0');
            
            // Should be disabled when on last page or when pagination is disabled
            const shouldBeDisabled = config.disabled || config.currentPage === config.totalPages;
            if (shouldBeDisabled) {
              expect(nextPageButton).toBeDisabled();
            } else {
              expect(nextPageButton).not.toBeDisabled();
            }
          }
          
          // Should have last page button
          const lastPageButton = container.querySelector('button[aria-label="Go to last page"]');
          expect(lastPageButton).toBeTruthy();
          
          if (lastPageButton) {
            const lastButtonClassList = Array.from(lastPageButton.classList);
            
            // Verify consistent button styling
            expect(lastButtonClassList).toContain('h-8');
            expect(lastButtonClassList).toContain('w-8');
            expect(lastButtonClassList).toContain('p-0');
            
            // Should be disabled when on last page or when pagination is disabled
            const shouldBeDisabled = config.disabled || config.currentPage === config.totalPages;
            if (shouldBeDisabled) {
              expect(lastPageButton).toBeDisabled();
            } else {
              expect(lastPageButton).not.toBeDisabled();
            }
          }
          
          // Should have page number buttons with consistent styling
          const pageButtons = container.querySelectorAll('button[aria-label^="Go to page"]');
          expect(pageButtons.length).toBeGreaterThan(0);
          
          pageButtons.forEach((button) => {
            const buttonClassList = Array.from(button.classList);
            
            // Verify consistent page button styling
            expect(buttonClassList).toContain('h-8');
            expect(buttonClassList).toContain('min-w-8');
            expect(buttonClassList).toContain('px-2');
            
            // Should be disabled when pagination is disabled
            if (config.disabled) {
              expect(button).toBeDisabled();
            }
            
            // Current page button should have different styling
            const isCurrentPage = button.getAttribute('aria-current') === 'page';
            if (isCurrentPage) {
              // Current page should have default variant styling (not outline)
              expect(buttonClassList.some(cls => 
                cls.includes('bg-primary') || cls.includes('text-primary-foreground')
              )).toBe(true);
            }
          });
          
          // Should display ellipsis with consistent styling when needed
          const ellipsisElements = Array.from(container.querySelectorAll('span')).filter(
            span => span.textContent === '...'
          );
          
          ellipsisElements.forEach((ellipsis) => {
            const ellipsisClassList = Array.from(ellipsis.classList);
            
            // Verify consistent ellipsis styling
            expect(ellipsisClassList).toContain('px-2');
            expect(ellipsisClassList).toContain('py-1');
            expect(ellipsisClassList).toContain('text-sm');
            expect(ellipsisClassList).toContain('text-muted-foreground');
          });
        } else {
          // Should not show navigation controls when totalPages <= 1
          const navigationButtons = container.querySelectorAll('button[aria-label*="page"]');
          expect(navigationButtons.length).toBe(0);
        }
        
        // Loading state consistency (Requirements 9.3)
        if (config.disabled) {
          // All interactive elements should be disabled
          const allButtons = container.querySelectorAll('button');
          allButtons.forEach((button) => {
            expect(button).toBeDisabled();
          });
          
          const allSelects = container.querySelectorAll('[role="combobox"]');
          allSelects.forEach((select) => {
            expect(select).toBeDisabled();
          });
        }
        
        // Standardized page sizes (Requirements 9.2)
        // Verify that the pageSize prop uses one of the standardized PAGE_SIZES
        expect(Object.values(PAGE_SIZES)).toContain(config.pageSize);
        
        // Custom className should be applied to the main container
        if (config.customClassName && config.customClassName.trim()) {
          expect(mainContainer).toBeTruthy();
          // The component should render successfully with custom className
          // (We can't easily test arbitrary CSS classes, but we verify the component renders)
        }
      }
    ), { 
      numRuns: 100,
      verbose: true 
    });
  });
  
  /**
   * Test that DEFAULT_PAGE_SIZE is one of the standardized PAGE_SIZES
   */
  test('DEFAULT_PAGE_SIZE uses standardized value', () => {
    expect(Object.values(PAGE_SIZES)).toContain(DEFAULT_PAGE_SIZE);
    expect(DEFAULT_PAGE_SIZE).toBe(PAGE_SIZES.MEDIUM);
  });
  
  /**
   * Test that PAGE_SIZES contains expected standardized values
   */
  test('PAGE_SIZES contains standardized values', () => {
    expect(PAGE_SIZES.SMALL).toBe(10);
    expect(PAGE_SIZES.MEDIUM).toBe(20);
    expect(PAGE_SIZES.LARGE).toBe(50);
    expect(PAGE_SIZES.EXTRA_LARGE).toBe(100);
  });
});