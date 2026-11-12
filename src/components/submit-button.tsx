"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  variant = "primary",
  pendingLabel = "Saving…",
  className,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "cancel" | "destructive";
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} aria-busy={pending} className={`disabled:opacity-100 ${className ?? ""}`}>
      {pending ? <Spinner /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
    />
  );
}
