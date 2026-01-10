import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface FormLabelProps extends React.ComponentProps<typeof Label> {
  required?: boolean;
  children: React.ReactNode;
}

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  FormLabelProps
>(({ required, children, className, ...props }, ref) => {
  return (
    <Label
      ref={ref}
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </Label>
  );
});

FormLabel.displayName = "FormLabel";

export { FormLabel };
export type { FormLabelProps };