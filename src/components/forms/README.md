# Form Components

Standardized form field components with consistent styling and behavior.

## Components

### FormInput

Text input component with consistent styling and validation support.

```tsx
import { FormInput } from "@/components/forms";

<FormInput
  label="Email"
  value={email}
  onChange={setEmail}
  type="email"
  required
  error={emailError}
  placeholder="Enter your email"
/>
```

### FormTextarea

Multi-line text input with character counting and validation.

```tsx
import { FormTextarea } from "@/components/forms";

<FormTextarea
  label="Description"
  value={description}
  onChange={setDescription}
  maxLength={500}
  showCharCount
  rows={4}
  error={descriptionError}
/>
```

### FormSelect

Dropdown selection component with enum support and localization.

```tsx
import { FormSelect } from "@/components/forms";

<FormSelect
  label="Category"
  value={category}
  onChange={setCategory}
  options={[
    { value: "tech", label: "Technology" },
    { value: "design", label: "Design" },
  ]}
  error={categoryError}
/>
```

### FormLabel

Consistent label component for form fields.

```tsx
import { FormLabel } from "@/components/forms";

<FormLabel required>
  Field Name
</FormLabel>
```

### FormError

Error message display component.

```tsx
import { FormError } from "@/components/forms";

<FormError message="This field is required" />
```

## Styling Standards

All form components follow consistent styling patterns:

- Background: `bg-background/50`
- Border: `border-border/50`
- Focus ring: `focus-visible:ring-1 focus-visible:ring-primary/30`
- Error state: `border-destructive/50 focus-visible:ring-destructive/30`

## Migration Guide

Replace custom form inputs with standardized components:

```tsx
// Before
<div className="space-y-2">
  <Label htmlFor="name">Name *</Label>
  <Input
    id="name"
    value={name}
    onChange={(e) => setName(e.target.value)}
    className="bg-background/50 border-border/50"
  />
  {nameError && (
    <p className="text-sm text-destructive">{nameError}</p>
  )}
</div>

// After
<FormInput
  label="Name"
  value={name}
  onChange={setName}
  required
  error={nameError}
/>
```

## Props Reference

### FormInput Props

- `label?: string` - Field label
- `value: string` - Input value
- `onChange: (value: string) => void` - Change handler
- `type?: 'text' | 'email' | 'password' | 'url'` - Input type
- `placeholder?: string` - Placeholder text
- `required?: boolean` - Whether field is required
- `disabled?: boolean` - Whether field is disabled
- `error?: string` - Error message to display
- `description?: string` - Help text below field
- `className?: string` - Additional CSS classes

### FormTextarea Props

- `label?: string` - Field label
- `value: string` - Textarea value
- `onChange: (value: string) => void` - Change handler
- `placeholder?: string` - Placeholder text
- `rows?: number` - Number of rows
- `maxLength?: number` - Maximum character count
- `showCharCount?: boolean` - Whether to show character counter
- `required?: boolean` - Whether field is required
- `disabled?: boolean` - Whether field is disabled
- `error?: string` - Error message to display
- `description?: string` - Help text below field
- `className?: string` - Additional CSS classes

### FormSelect Props

- `label?: string` - Field label
- `value: string` - Selected value
- `onChange: (value: string) => void` - Change handler
- `options: Array<{ value: string; label: string }>` - Select options
- `placeholder?: string` - Placeholder text
- `required?: boolean` - Whether field is required
- `disabled?: boolean` - Whether field is disabled
- `error?: string` - Error message to display
- `description?: string` - Help text below field
- `className?: string` - Additional CSS classes