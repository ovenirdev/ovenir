import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type KbdProps = HTMLAttributes<HTMLElement>;

function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd className={cn("kbd", className)} {...props}>
      {children}
    </kbd>
  );
}

export { Kbd };
