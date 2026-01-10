import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DESIGN_TOKENS } from "@/lib/design-tokens";

interface FormInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'url';
  id?: string;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ 
    label, 
    error, 
    required, 
    disabled, 
    className, 
    description, 
    value, 
    onChange, 
    placeholder, 
    type = 'text',
    id,
    ...props 
  }, ref) => {
    const inputId = id || React.useId();
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

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
        
        <Input
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            descriptionId,
            errorId
          ).trim() || undefined}
          className={cn(
            DESIGN_TOKENS.backgrounds.input,
            DESIGN_TOKENS.borders.default,
            DESIGN_TOKENS.focus.ring,
            error && [
              DESIGN_TOKENS.borders.error,
              DESIGN_TOKENS.focus.errorRing
            ]
          )}
          {...props}
        />
        
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

FormInput.displayName = "FormInput";

export { FormInput };
export type { FormInputProps };