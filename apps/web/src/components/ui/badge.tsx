import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "danger" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn("badge", `badge-${variant}`, className)}
      {...props}
    />
  );
}

export { Badge };
