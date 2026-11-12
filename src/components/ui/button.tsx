import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "ui-button inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[17px] leading-[22px] font-semibold tracking-[-0.43px] select-none disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-[#007aff] text-white",
        secondary: "bg-[#e5e5ea] text-[#007aff]",
        cancel: "bg-transparent text-[#007aff]",
        destructive: "bg-[#ff3b30] text-white",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export function Button({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-variant={variant ?? "primary"} className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export { buttonVariants };
