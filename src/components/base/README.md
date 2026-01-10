# Base Components

Base components provide foundational UI patterns for consistent user experience across the application.

## BaseFormDialog

A standardized dialog component for forms with consistent structure and behavior.

### Features

- Consistent header with title, optional icon, and description
- Scrollable content area with proper overflow handling
- Standardized footer with cancel/action buttons
- Loading state management with disabled interactions
- Keyboard navigation support (Enter to submit, Escape to close)
- Responsive sizing with predefined width options

### Usage

```tsx
import { BaseFormDialog } from "@/components/base";
import { FormInput, FormTextarea } from "@/components/forms";
import { useMutationLoading } from "@/hooks";

function CreateItemDialog({ open, onOpenChange }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { mutate: createItem, isLoading } = useMutationLoading({
    mutationFn: async (data) => {
      // API call
    },
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createItem({ name, description });
  };

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Item"
      description="Add a new item to your collection"
      icon={Plus}
      maxWidth="md"
      loading={isLoading}
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        <FormInput
          label="Name"
          value={name}
          onChange={setName}
          required
        />
        <FormTextarea
          label="Description"
          value={description}
          onChange={setDescription}
          maxLength={500}
          showCharCount
        />
      </div>
    </BaseFormDialog>
  );
}
```

### Props

- `open: boolean` - Whether the dialog is open
- `onOpenChange: (open: boolean) => void` - Callback when dialog open state changes
- `title: string` - Dialog title
- `description?: string` - Optional description below title
- `icon?: React.ComponentType` - Optional icon next to title
- `maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'` - Dialog width
- `loading?: boolean` - Whether the dialog is in loading state
- `onSubmit?: (e: React.FormEvent) => void` - Form submit handler
- `children: React.ReactNode` - Dialog content
- `footer?: React.ReactNode` - Custom footer content
- `showDefaultFooter?: boolean` - Whether to show default cancel/submit buttons
- `submitText?: string` - Custom submit button text
- `cancelText?: string` - Custom cancel button text

### Migration from Custom Dialogs

Replace custom dialog implementations:

```tsx
// Before
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Create Item</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      {/* form content */}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

// After
<BaseFormDialog
  open={open}
  onOpenChange={onOpenChange}
  title="Create Item"
  maxWidth="md"
  loading={isLoading}
  onSubmit={handleSubmit}
>
  {/* form content */}
</BaseFormDialog>
```