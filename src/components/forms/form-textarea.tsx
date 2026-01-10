import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DESIGN_TOKENS } from "@/lib/design-tokens";

interface FormTextareaProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  showCharCount?: boolean;
  rows?: number;
  id?: string;
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
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
    maxLength,
    showCharCount = false,
    rows = 4,
    id,
    ...props 
  }, ref) => {
    const inputId = id || React.useId();
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const charCountId = showCharCount ? `${inputId}-char-count` : undefined;

    const currentLength = value.length;
    const isOverLimit = maxLength ? currentLength > maxLength : false;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      
      // If maxLength is set, enforce it
      if (maxLength && newValue.length > maxLength) {
        return; // Don't update if over limit
      }
      
      onChange(newValue);
    };

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
        
        <div className="relative">
          <Textarea
            ref={ref}
            id={inputId}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              descriptionId,
              errorId,
              charCountId
            ).trim() || undefined}
            className={cn(
              DESIGN_TOKENS.backgrounds.input,
              DESIGN_TOKENS.borders.default,
              DESIGN_TOKENS.focus.ring,
              error && [
                DESIGN_TOKENS.borders.error,
                DESIGN_TOKENS.focus.errorRing
              ],
              showCharCount && "pb-8" // Add padding for character count
            )}
            {...props}
          />
          
          {showCharCount && (
            <div 
              id={charCountId}
              className={cn(
                "absolute bottom-2 right-3 text-xs",
                isOverLimit ? DESIGN_TOKENS.colors.error : DESIGN_TOKENS.colors.secondary
              )}
            >
              {currentLength}
              {maxLength && (
                <>
                  <span className="mx-1">/</span>
                  <span>{maxLength}</span>
                </>
              )}
            </div>
          )}
        </div>
        
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

FormTextarea.displayName = "FormTextarea";

export { FormTextarea };
export type { FormTextareaProps };