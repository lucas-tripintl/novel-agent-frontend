import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { useEnumStore } from "@/stores/enum-store";
import type { KnownEnumName } from "@/types/enums";

interface FormSelectProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  // Enum support
  enumName?: KnownEnumName | string;
  // Manual options (when not using enum)
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
}

const FormSelect = React.forwardRef<HTMLButtonElement, FormSelectProps>(
  ({ 
    label, 
    error, 
    required, 
    disabled, 
    className, 
    description, 
    value, 
    onChange, 
    placeholder = "请选择...",
    id,
    enumName,
    options = [],
    ...props 
  }, ref) => {
    const inputId = id || React.useId();
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    // Get enum data if enumName is provided
    const getEnumItems = useEnumStore((state) => state.getEnumItems);
    const enumItems = enumName ? getEnumItems(enumName) : [];

    // Use enum items if available, otherwise use manual options
    const selectOptions = enumName && enumItems.length > 0 
      ? enumItems.map(item => ({
          value: item.value,
          label: item.label,
          disabled: false
        }))
      : options;

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label htmlFor={inputId} className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        
        {description && (
          <p 
            id={descriptionId}
            className={cn("text-xs", DESIGN_TOKENS.colors.secondary)}
          >
            {description}
          </p>
        )}
        
        <Select
          value={value}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              descriptionId,
              errorId
            ).trim() || undefined}
            className={cn(
              "w-full",
              DESIGN_TOKENS.backgrounds.input,
              DESIGN_TOKENS.borders.default,
              DESIGN_TOKENS.focus.ring,
              error && [
                DESIGN_TOKENS.borders.error,
                DESIGN_TOKENS.focus.errorRing
              ]
            )}
            {...props}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          
          <SelectContent>
            {selectOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {error && (
          <p 
            id={errorId}
            className={cn("text-xs", DESIGN_TOKENS.colors.error)}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";

export { FormSelect };
export type { FormSelectProps };