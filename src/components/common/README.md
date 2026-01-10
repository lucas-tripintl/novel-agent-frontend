# Common Components

Shared components for consistent UI patterns across the application.

## Display Components

### EmptyState

Consistent empty state UI for lists and grids.

```tsx
import { EmptyState } from "@/components/common";
import { FileText } from "lucide-react";

<EmptyState
  icon={FileText}
  title="No projects found"
  description="Create your first project to get started with novel writing."
  action={{
    label: "Create Project",
    onClick: () => setCreateDialogOpen(true)
  }}
/>
```

### Pagination

Standardized pagination controls with page size management.

```tsx
import { Pagination, PAGE_SIZES } from "@/components/common";

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  pageSize={PAGE_SIZES.MEDIUM}
  totalItems={totalItems}
  showPageSize
  onPageSizeChange={setPageSize}
/>
```

## Loading Components

### SkeletonCard

Placeholder loading component for card layouts.

```tsx
import { SkeletonCard, SkeletonList } from "@/components/common";

// Single skeleton card
<SkeletonCard showHeader showFooter lines={3} />

// Multiple skeleton items
<SkeletonList count={5} itemHeight={120} />
```

### LoadingOverlay

Full-screen loading overlay component.

```tsx
import { LoadingOverlay } from "@/components/common";

<LoadingOverlay message="Loading projects..." />
```

### LoadingButton

Button component with integrated loading state.

```tsx
import { LoadingButton } from "@/components/common";

<LoadingButton
  loading={isSubmitting}
  onClick={handleSubmit}
  loadingText="Saving..."
>
  Save Changes
</LoadingButton>
```

## Error Handling Components

### ErrorBoundary

React error boundary with fallback UI and retry functionality.

```tsx
import { ErrorBoundary, withErrorBoundary } from "@/components/common";

// Wrap components
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// Or use HOC
const SafeComponent = withErrorBoundary(MyComponent);
```

### ErrorMessage

Standardized error message display.

```tsx
import { ErrorMessage, FieldErrorMessage } from "@/components/common";

// General error message
<ErrorMessage 
  message="Something went wrong" 
  variant="error" 
  size="md" 
/>

// Field-specific error
<FieldErrorMessage message="This field is required" />
```

### ErrorFallback

Error fallback UI with retry functionality.

```tsx
import { ErrorFallback } from "@/components/common";

<ErrorFallback
  error={error}
  retry={() => refetch()}
  compact={false}
/>
```

## Utility Components

### EnumLabel / EnumBadge

Localized enum value display components.

```tsx
import { EnumLabel, EnumBadge } from "@/components/common";

// Text label
<EnumLabel enumName="EntityType" value="character" />

// Styled badge
<EnumBadge 
  enumName="CharacterRole" 
  value="protagonist"
  variant="default"
/>
```

### ConfirmDeleteDialog

Standardized delete confirmation dialog.

```tsx
import { ConfirmDeleteDialog } from "@/components/common";

<ConfirmDeleteDialog
  open={showConfirm}
  onOpenChange={setShowConfirm}
  targetName="Project Alpha"
  onConfirm={handleDelete}
  loading={isDeleting}
/>
```

## Constants

### PAGE_SIZES

Standardized page size options for pagination.

```tsx
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from "@/components/common";

const PAGE_SIZE = PAGE_SIZES.MEDIUM; // 20
const DEFAULT_SIZE = DEFAULT_PAGE_SIZE; // 20
```

Available sizes:
- `SMALL`: 10 items
- `MEDIUM`: 20 items (default)
- `LARGE`: 50 items
- `EXTRA_LARGE`: 100 items

## Migration Examples

### Replace Custom Empty States

```tsx
// Before
<div className="flex flex-col items-center justify-center py-16">
  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
  <h3 className="text-lg font-semibold mb-2">No projects found</h3>
  <p className="text-muted-foreground text-center">
    Create your first project to get started.
  </p>
  <Button onClick={() => setCreateOpen(true)} className="mt-4">
    Create Project
  </Button>
</div>

// After
<EmptyState
  icon={FileText}
  title="No projects found"
  description="Create your first project to get started."
  action={{
    label: "Create Project",
    onClick: () => setCreateOpen(true)
  }}
/>
```

### Replace Custom Loading States

```tsx
// Before
{isLoading ? (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    ))}
  </div>
) : (
  // content
)}

// After
{isLoading ? (
  <SkeletonList count={5} />
) : (
  // content
)}
```