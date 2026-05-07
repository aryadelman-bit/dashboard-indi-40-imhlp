import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-xs font-medium leading-5",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-muted text-foreground",
        outline: "border-border bg-card text-foreground",
        red: "border-red-200 bg-red-50 text-red-700",
        orange: "border-orange-200 bg-orange-50 text-orange-700",
        yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
        green: "border-emerald-200 bg-emerald-50 text-emerald-700",
        blue: "border-blue-200 bg-blue-50 text-blue-700",
        gray: "border-slate-200 bg-slate-50 text-slate-700"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
