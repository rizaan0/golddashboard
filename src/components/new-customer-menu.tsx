"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ActionForm } from "@/components/action-form";
import { LiquidGlass } from "@/components/liquid-glass/liquid-glass";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/fields";
import { useAnchoredMenu, useGlassPresence } from "@/components/ui/menu-layer";
import { createCustomerAction } from "@/server/actions";

const PANEL_TINT = { r: 255, g: 255, b: 255, a: 0.62 };

export function NewCustomerMenu({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const formId = useId().replace(/:/g, "");
  const nameRef = useRef<HTMLInputElement>(null);
  const present = useGlassPresence(open);
  const { triggerRef, menuRef, box } = useAnchoredMenu(open || present, "end");

  useEffect(() => {
    if (!open) return;
    nameRef.current?.focus();
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, triggerRef, menuRef]);

  function close() {
    setOpen(false);
    const url = new URL(window.location.href);
    if (!url.searchParams.has("compose")) return;
    url.searchParams.delete("compose");
    const next = url.pathname + (url.searchParams.size ? `?${url.searchParams}` : "");
    window.history.replaceState(null, "", next);
  }

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="primary"
        className="shrink-0"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        New Customer
      </Button>
      {present
        ? createPortal(
            <div
              ref={menuRef}
              role="dialog"
              aria-label="New customer"
              data-liquid-glass
              data-state={box ? (open ? "open" : "closed") : undefined}
              className="menu-surface glass-menu fixed z-50 overflow-hidden rounded-[26px]"
              style={{
                top: box?.top ?? 0,
                left: box?.left ?? 0,
                width: "min(36rem, calc(100vw - 1rem))",
                visibility: box ? "visible" : "hidden",
              }}
            >
              <LiquidGlass preserveShape tint={PANEL_TINT} />
              <ActionForm action={createCustomerAction} className="glass-form flex flex-col gap-6 p-6">
                <h2 className="text-balance text-zinc-950">New customer</h2>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`${formId}-name`}>Full name</Label>
                    <Input ref={nameRef} id={`${formId}-name`} name="fullName" autoComplete="name" required className="w-full rounded-[26px]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`${formId}-phone`}>Phone</Label>
                    <Input id={`${formId}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="10-digit mobile" className="w-full rounded-[26px]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`${formId}-address`}>Address</Label>
                    <Textarea id={`${formId}-address`} name="address" className="min-h-28 w-full rounded-[26px]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`${formId}-notes`}>Notes</Label>
                    <Textarea id={`${formId}-notes`} name="notes" className="min-h-28 w-full rounded-[26px]" />
                  </div>
                </div>
                <SubmitButton>Save Customer</SubmitButton>
              </ActionForm>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
