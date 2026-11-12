"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ActionForm } from "@/components/action-form";
import { CustomerPicker } from "@/components/customer-picker";
import { LiquidGlass } from "@/components/liquid-glass/liquid-glass";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { DateMenu } from "@/components/ui/date-menu";
import { Input, Label } from "@/components/ui/fields";
import { useAnchoredMenu, useGlassPresence } from "@/components/ui/menu-layer";
import { kolkataToday } from "@/lib/dates";
import { createSchemeAction } from "@/server/actions";

const PANEL_TINT = { r: 255, g: 255, b: 255, a: 0.62 };

type CustomerOption = { id: string; fullName: string; customerCode: string; phone: string };

export function NewSchemeMenu({
  customers,
  presetId,
  defaultOpen = false,
}: {
  customers: CustomerOption[];
  presetId?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const formId = useId().replace(/:/g, "");
  const amountRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("");
  const [amountLocked, setAmountLocked] = useState(true);
  const preset = customers.find((customer) => customer.id === presetId);
  const present = useGlassPresence(open);
  const { triggerRef, menuRef, box } = useAnchoredMenu(open || present, "end");

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setAmountLocked(true);
    let frames = 0;
    let frame = 0;
    const clearFilled = () => {
      const field = amountRef.current;
      if (field?.readOnly && field.value !== "") field.value = "";
      frames += 1;
      if (frames < 40) frame = window.requestAnimationFrame(clearFilled);
    };
    frame = window.requestAnimationFrame(clearFilled);
    menuRef.current?.querySelector("input")?.focus();
    function onPointer(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest("[data-liquid-glass]")) return;
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
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, triggerRef, menuRef]);

  function close() {
    setOpen(false);
    const url = new URL(window.location.href);
    if (!url.searchParams.has("compose") && !url.searchParams.has("customerId")) return;
    url.searchParams.delete("compose");
    url.searchParams.delete("customerId");
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
        New Scheme
      </Button>
      {present
        ? createPortal(
            <div
              ref={menuRef}
              role="dialog"
              aria-label="New scheme"
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
              <ActionForm action={createSchemeAction} autoComplete="off" className="glass-form flex flex-col gap-6 p-6">
                <h2 className="text-balance text-zinc-950">New scheme</h2>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={preset ? undefined : "customer-query"}>Customer</Label>
                    {preset ? <input type="hidden" name="customerId" value={preset.id} /> : null}
                    {preset ? (
                      <p className="rounded-[26px] bg-white px-3 py-2 text-[17px] leading-[22px]">
                        {preset.customerCode} · {preset.fullName}
                      </p>
                    ) : (
                      <CustomerPicker customers={customers} />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`${formId}-amount`}>Monthly installment (₹)</Label>
                    <Input
                      ref={amountRef}
                      id={`${formId}-amount`}
                      name="monthlyRupees"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder=""
                      required
                      readOnly={amountLocked}
                      value={amount}
                      onFocus={() => setAmountLocked(false)}
                      onChange={(event) => setAmount(event.target.value)}
                      className="w-full rounded-[26px]"
                    />
                  </div>
                  <DateMenu id={`${formId}-start`} name="startDate" label="Start date" required value={kolkataToday()} />
                </div>
                <SubmitButton>Create Scheme</SubmitButton>
              </ActionForm>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
