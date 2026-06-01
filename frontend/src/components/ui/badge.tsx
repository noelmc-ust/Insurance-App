import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-slate-700 text-slate-100",
      pending: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
      approved: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
      rejected: "bg-rose-500/20 text-rose-300 border border-rose-500/40"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export function Badge({
  className,
  variant,
  children
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)}>{children}</div>;
}
