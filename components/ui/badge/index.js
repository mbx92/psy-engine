import { cva } from "class-variance-authority";

export { default as Badge } from "./Badge.vue";

export const badgeVariants = cva(
  "inline-flex gap-1 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        pending:
          "border-transparent bg-muted text-muted-foreground",
        in_progress:
          "border-transparent bg-brand-blue/10 text-brand-blue",
        completed:
          "border-transparent bg-success-bg text-success-text",
        verified:
          "border-transparent bg-brand-purple/10 text-brand-purple",
        abandoned:
          "border-transparent bg-brand-coral/10 text-brand-coral",
        draft:
          "border-transparent bg-amber-500/10 text-amber-700",
        final:
          "border-transparent bg-success-bg text-success-text",
        recommended:
          "border-transparent bg-brand-blue/10 text-brand-blue",
        not_recommended:
          "border-transparent bg-brand-coral/10 text-brand-coral",
        rating_R:
          "border-transparent bg-red-600/10 text-red-700",
        rating_K:
          "border-transparent bg-amber-500/10 text-amber-700",
        rating_C:
          "border-transparent bg-blue-500/10 text-blue-700",
        rating_B:
          "border-transparent bg-emerald-600/10 text-emerald-700",
        rating_T:
          "border-transparent bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
