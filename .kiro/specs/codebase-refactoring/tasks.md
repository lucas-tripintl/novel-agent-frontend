# Implementation Plan: Codebase Refactoring

## Overview

This implementation plan systematically refactors the Novel Agent Frontend codebase to reduce code duplication by 30-40% while improving maintainability and consistency. The approach follows a phased migration strategy, starting with foundational components and gradually replacing existing implementations.

## Tasks

- [x] 1. Create foundational base components and utilities
  - Create design token constants and styling utilities
  - Implement base form dialog component with consistent structure
  - Set up component testing infrastructure with property-based testing
  - _Requirements: 1.1, 8.1, 8.2, 8.3, 8.4_

- [x]* 1.1 Write property test for design token consistency
  - **Property 12: Design Token Application Consistency**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 2. Implement standardized form components
  - [x] 2.1 Create FormInput component with consistent styling
    - Implement text input with bg-background/50 and consistent focus states
    - Add label, error message, and description support
    - _Requirements: 3.1, 3.2_

  - [x] 2.2 Create FormTextarea component with character counting
    - Implement multi-line input with consistent styling
    - Add character count display and validation
    - _Requirements: 3.4_

  - [x] 2.3 Create FormSelect component with enum support
    - Implement dropdown with consistent styling
    - Add integration with enum localization system
    - _Requirements: 3.1, 6.3_

  - [x] 2.4 Create FormLabel and FormError components
    - Implement consistent label typography and spacing
    - Add error message display with destructive styling
    - _Requirements: 3.2, 3.3_

- [x] 2.5 Write property test for form field styling consistency

  - **Property 3: Form Field Styling Consistency**
  - **Validates: Requirements 3.1, 3.2, 3.5**

- [x] 2.6 Write property test for form validation error display

  - **Property 7: Form Validation Error Display**
  - **Validates: Requirements 3.3, 4.2**

- [x] 3. Implement loading state management system
  - [x] 3.1 Create useMutationLoading hook
    - Implement local loading state management to avoid race conditions
    - Add proper error handling and state reset
    - _Requirements: 2.1, 2.4_

  - [x] 3.2 Write property test for mutation loading state management

    - **Property 5: Mutation Loading State Management**
    - **Validates: Requirements 2.1, 2.4**

  - [x] 3.3 Create loading UI components
    - Implement consistent Loader2 icons and disabled states
    - Add loading overlay and skeleton components
    - _Requirements: 2.2, 2.3_

  - [x] 3.4 Write property test for loading UI consistency

    - **Property 6: Loading UI Consistency**
    - **Validates: Requirements 2.2, 2.3**

- [x] 4. Checkpoint - Ensure foundational components work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement display and layout components
  - [x] 5.1 Create EmptyState component
    - Implement consistent icon, title, and description layout
    - Add optional action button support
    - _Requirements: 1.2_

  - [x] 5.2 Write property test for empty state layout consistency

    - **Property 2: Empty State Layout Consistency**
    - **Validates: Requirements 1.2**

  - [x] 5.3 Create skeleton loading components
    - Implement SkeletonCard, SkeletonList, and SkeletonForm
    - Add consistent animation and sizing
    - _Requirements: 1.4_

  - [x] 5.4 Write property test for skeleton component structure

    - **Property 4: Skeleton Component Structure Consistency**
    - **Validates: Requirements 1.4**

  - [x] 5.5 Create Pagination component
    - Implement consistent navigation controls and page size management
    - Add loading states and standardized PAGE_SIZE constants
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 5.6 Write property test for pagination control consistency

    - **Property 13: Pagination Control Consistency**
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] 6. Implement enum localization components
  - [x] 6.1 Enhance existing EnumLabel component
    - Add fallback handling for missing labels
    - Implement consistent error handling
    - _Requirements: 6.1, 6.5_

  - [ ]* 6.2 Write property test for enum localization consistency
    - **Property 10: Enum Localization Consistency**
    - **Validates: Requirements 6.1, 6.5**

  - [x] 6.3 Create EnumBadge and EnumSelect components
    - Implement styled badge with color mapping
    - Add dropdown selector with localized options
    - _Requirements: 6.2, 6.3_

  - [ ]* 6.4 Write property test for enum component styling consistency
    - **Property 11: Enum Component Styling Consistency**
    - **Validates: Requirements 6.2, 6.3**

- [x] 7. Implement error handling system
  - [x] 7.1 Create error boundary components
    - Implement DefaultErrorFallback with retry functionality
    - Add error logging and recovery mechanisms
    - _Requirements: 4.3_

  - [x] 7.2 Create standardized error display components
    - Implement consistent toast notifications for mutations
    - Add inline error message components
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ]* 7.3 Write property test for error handling consistency
    - **Property 8: Error Handling Consistency**
    - **Validates: Requirements 4.1, 4.3, 4.4**

- [-] 8. Implement delete confirmation system
  - [x] 8.1 Create useDeleteWithConfirmation hook
    - Implement consistent delete flow with confirmation dialog
    - Add loading states and error handling
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 8.2 Write property test for delete operation flow consistency
    - **Property 9: Delete Operation Flow Consistency**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 9. Checkpoint - Ensure all base components are complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Begin systematic component migration
  - [x] 10.1 Migrate CreateProjectDialog to BaseFormDialog
    - Replace custom dialog implementation with base component
    - Maintain existing functionality and styling
    - _Requirements: 1.1_

  - [x] 10.2 Migrate ProjectEditDialog to BaseFormDialog
    - Replace custom dialog implementation with base component
    - Update form fields to use new FormInput components
    - _Requirements: 1.1, 3.1_

  - [x] 10.3 Migrate AddSkillDialog to BaseFormDialog
    - Replace custom dialog implementation with base component
    - Update form fields to use new FormInput components
    - _Requirements: 1.1, 3.1_

  - [x] 10.4 Migrate EntityDetailDialog to BaseFormDialog
    - Replace custom dialog implementation with base component
    - Update character counting to use FormTextarea
    - _Requirements: 1.1, 3.1, 3.4_

- [ ]* 10.5 Write property test for component structure consistency
  - **Property 1: Component Structure Consistency**
  - **Validates: Requirements 1.1**

- [x] 11. Migrate empty states and loading components
  - [x] 11.1 Replace custom empty states with EmptyState component
    - Update dashboard EmptyState and other components
    - Ensure consistent icon and messaging
    - _Requirements: 1.2_

  - [x] 11.2 Replace custom skeleton loaders with Skeleton components
    - Update loading states across list and form components
    - Ensure consistent animation and sizing
    - _Requirements: 1.4_

  - [x] 11.3 Update loading states to use useMutationLoading hook
    - Replace local loading state management in dialogs
    - Update CreateProjectDialog, AddSkillDialog, and EntityDetailDialog
    - _Requirements: 2.1, 2.4_

- [x] 12. Migrate enum display logic
  - [x] 12.1 Replace custom enum localization in EntityDetailDialog
    - Remove getTagLabel function and use EnumLabel component
    - Update enum badge styling to use EnumBadge
    - _Requirements: 6.1, 6.2_

  - [x] 12.2 Replace custom enum styling in FusionTaskCard
    - Update entity type badges to use EnumBadge component
    - Ensure consistent color mapping
    - _Requirements: 6.2_

  - [x] 12.3 Update enum selectors to use EnumSelect component
    - Replace custom dropdown implementations
    - Ensure localized options are displayed
    - _Requirements: 6.3_

- [x] 13. Standardize delete operations
  - [x] 13.1 Update EntityDetailDialog to use useDeleteWithConfirmation
    - Replace custom delete logic with standardized hook
    - Ensure consistent confirmation dialog
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 13.2 Update other components with delete functionality
    - Apply useDeleteWithConfirmation to all delete operations
    - Ensure consistent error handling and loading states
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 14. Apply design token standardization
  - [x] 14.1 Update color usage across components
    - Replace inconsistent color classes with design tokens
    - Ensure text-primary, text-muted-foreground usage
    - _Requirements: 8.1_

  - [x] 14.2 Standardize spacing and typography
    - Update padding, margin, and gap classes to use consistent values
    - Ensure font sizes and weights follow design system
    - _Requirements: 8.2, 8.4_

  - [x] 14.3 Standardize border styling
    - Update border opacity levels to use consistent tokens
    - Ensure border-border/50 usage across components
    - _Requirements: 8.3_

- [x] 15. Update pagination implementations
  - [x] 15.1 Replace custom pagination in AddSkillDialog
    - Use Pagination component with standardized controls
    - Update page size to use PAGE_SIZE constants
    - _Requirements: 9.1, 9.2_

  - [x] 15.2 Standardize infinite scroll implementations
    - Ensure useInfiniteQuery patterns are consistent
    - Update loading states to use standard components
    - _Requirements: 9.3_

- [-] 16. Final integration and cleanup
  - [x] 16.1 Remove duplicate component implementations
    - Delete old dialog, form, and display components
    - Update imports to use new base components
    - _Requirements: 1.5, 6.4_

  - [x] 16.2 Update component exports and documentation
    - Add proper TypeScript exports for all new components
    - Update component documentation and usage examples
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 16.3 Verify no regression in functionality
    - Test all migrated components for proper behavior
    - Ensure styling consistency across the application
    - _Requirements: All requirements_

- [x] 16.4 Write integration tests for migrated components

  - Test complete user flows with new components
  - Verify error handling and loading states work correctly
  - _Requirements: All requirements_

- [x] 17. Final checkpoint - Ensure all refactoring is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow for user feedback
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Migration tasks maintain backward compatibility during transition
- The refactoring follows a phased approach to minimize risk and allow for iterative feedback