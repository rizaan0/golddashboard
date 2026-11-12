"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConfirmSubmit({
  action,
  title,
  description,
  confirmLabel,
  triggerLabel,
  fields,
  danger = false,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel: string;
  triggerLabel: string;
  fields: Record<string, string>;
  danger?: boolean;
  className?: string;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger data-variant={danger ? "destructive" : "secondary"} className={cn(buttonVariants({ variant: danger ? "destructive" : "secondary" }), className)}>
        {triggerLabel}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-black/35" />
        <Dialog.Content className="dialog-content fixed top-1/2 left-1/2 z-50 w-[92vw] max-w-md rounded-xl border p-6">
          <Dialog.Title className="text-[20px] leading-[25px] font-normal tracking-[0.38px] text-zinc-900">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 max-w-[68ch] text-[15px] leading-5 tracking-[-0.23px] text-zinc-600">{description}</Dialog.Description>
          <form action={action} className="mt-5 flex justify-end gap-2">
            {Object.entries(fields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <Dialog.Close data-variant="cancel" className={buttonVariants({ variant: "cancel" })}>Cancel</Dialog.Close>
            <button type="submit" data-variant={danger ? "destructive" : "primary"} className={buttonVariants({ variant: danger ? "destructive" : "primary" })}>
              {confirmLabel}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
