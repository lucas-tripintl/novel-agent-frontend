/**
 * Hooks exports
 * Provides centralized access to all custom hooks
 */

// State management hooks
export { useMutationLoading } from "./use-mutation-loading";
export { useDeleteWithConfirmation } from "./use-delete-with-confirmation";
export { useErrorHandler } from "./use-error-handler";

// Data fetching hooks
export { useProjects } from "./use-projects";
export { useSkills } from "./use-skills";
export { usePatterns } from "./use-patterns";
export { useTasks } from "./use-tasks";

// UI state hooks
export { useIsMobile } from "./use-mobile";
export { useUnsavedChangesWarning } from "./use-unsaved-changes-warning";

// Specialized hooks
export { useInlineEdit } from "./use-inline-edit";
export { usePolling } from "./use-polling";