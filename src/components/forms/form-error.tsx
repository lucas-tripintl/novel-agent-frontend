import * as React from "react";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS } from "@/lib/design-tokens";

interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ children, className, ...props }, ref) => {
    if (!children) return null;

    return (
      <p
        ref={ref}
        className={cn(
          "text-xs",
          DESIGN_TOKENS.colors.error,
          "leading-tight"
        )}
        role="alert"
        {...props}
      >
        {children}
      </p>
    );
  }
);

FormError.displayName = "FormError";

export { FormError };
export type { FormErrorProps };