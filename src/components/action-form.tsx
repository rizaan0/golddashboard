"use client";

import { useActionState, useEffect, useRef } from "react";
import { emptyActionState, type ActionState } from "@/lib/action-state";

export function ActionForm({
  action,
  children,
  className,
  autoComplete,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  autoComplete?: string;
}) {
  const [state, formAction] = useActionState(action, emptyActionState);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);
  return (
    <form action={formAction} className={className} autoComplete={autoComplete}>
      {state.error ? (
        <p ref={errorRef} tabIndex={-1} role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>
      ) : null}
      {children}
    </form>
  );
}
