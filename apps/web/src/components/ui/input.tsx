import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "input",
          error && "border-danger focus:border-danger focus:shadow-[0_0_0_3px_var(--color-danger-subtle)]",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
