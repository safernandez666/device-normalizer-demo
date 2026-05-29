import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm grid grid-cols-[20px_1fr] items-start gap-x-3 gap-y-1 [&>svg]:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "border-border bg-card/40 text-foreground [&>svg]:text-muted",
        destructive: "border-red-500/30 bg-red-500/5 text-foreground [&>svg]:text-red-400",
        warning: "border-amber-500/30 bg-amber-500/5 text-foreground [&>svg]:text-amber-400",
        info: "border-blue-500/30 bg-blue-500/5 text-foreground [&>svg]:text-blue-400",
        success: "border-emerald-500/30 bg-emerald-500/5 text-foreground [&>svg]:text-emerald-400",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, role = "alert", ...props }: AlertProps) {
  return <div role={role} className={cn(alertVariants({ variant, className }))} {...props} />;
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn("col-start-2 font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn("col-start-2 text-xs leading-relaxed text-muted [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}
