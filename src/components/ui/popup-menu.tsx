"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LiquidGlass } from "@/components/liquid-glass/liquid-glass";
import { useAnchoredMenu } from "@/components/ui/menu-layer";
import { Label } from "@/components/ui/fields";
import { cn } from "@/lib/utils";

export type MenuOption = { value: string; label: string; disabled?: boolean };

export function PopupMenu({
  name,
  value: defaultValue,
  options,
  id,
  label,
  labelTone = "field",
  className,
  required,
}: {
  name: string;
  value: string;
  options: MenuOption[];
  id?: string;
  label?: string;
  labelTone?: "field" | "filter";
  className?: string;
  required?: boolean;
}) {
  const buttonId = id ?? name;
  const menuId = useId();
  const labelId = useId();
  const valueId = useId();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const { triggerRef, menuRef, box } = useAnchoredMenu(open);
  const current = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (!open) return;
    const index = Math.max(0, options.findIndex((option) => option.value === value));
    setActive(index);
    itemRefs.current[index]?.focus();
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" || event.key === "Tab") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, options, value, triggerRef, menuRef]);

  function move(delta: number) {
    const enabled = options.map((option, index) => (option.disabled ? -1 : index)).filter((index) => index >= 0);
    if (enabled.length === 0) return;
    const at = Math.max(0, enabled.indexOf(active));
    const next = enabled[(at + delta + enabled.length) % enabled.length] ?? enabled[0];
    setActive(next);
    itemRefs.current[next]?.focus();
  }

  function choose(next: string) {
    setValue(next);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className={cn("min-w-44", className)}>
      {label ? (
        labelTone === "filter" ? (
          <label id={labelId} htmlFor={buttonId} className="mb-1 block text-center text-sm text-zinc-600">
            {label}
          </label>
        ) : (
          <Label id={labelId} htmlFor={buttonId} className="mb-1.5 block">
            {label}
          </Label>
        )
      ) : null}
      <input type="hidden" name={name} value={value} required={required} />
      <button
        ref={triggerRef}
        id={buttonId}
        type="button"
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 border border-black/10 bg-white px-4 text-left text-[17px] leading-[22px] tracking-[-0.43px]",
          labelTone === "filter" ? "rounded-full" : "rounded-lg",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-labelledby={label ? `${labelId} ${valueId}` : undefined}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span id={valueId} className="truncate">
          {current?.label}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-zinc-500" aria-hidden />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-labelledby={buttonId}
              data-liquid-glass
              data-state="open"
              className="menu-surface fixed z-50 rounded-[14px]"
              style={box ? { top: box.top, left: box.left, width: box.width } : { top: 0, left: 0, visibility: "hidden" }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  move(1);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  move(-1);
                }
              }}
            >
              <LiquidGlass />
              <div className="relative z-[1] p-1.5">
              {options.map((option, index) => {
                const selected = option.value === value;
                return (
                  <button
                    key={option.value}
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    disabled={option.disabled}
                    tabIndex={index === active ? 0 : -1}
                    className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-left text-[17px] leading-[22px] tracking-[-0.43px] hover:bg-[rgb(120_120_128/0.16)] focus-visible:bg-[rgb(120_120_128/0.16)] disabled:opacity-40"
                    onClick={() => choose(option.value)}
                    onMouseEnter={() => setActive(index)}
                  >
                    <span className="flex-1">{option.label}</span>
                    {selected ? <Check className="size-4 text-[#007aff]" aria-hidden /> : <span className="size-4" />}
                  </button>
                );
              })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
