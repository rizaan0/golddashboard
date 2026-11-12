"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { daysInMonth, formatDisplayDate, formatISODate, formatMonthLabel, isISODate, kolkataToday, parseISODate } from "@/lib/dates";
import { LiquidGlass } from "@/components/liquid-glass/liquid-glass";
import { useAnchoredMenu } from "@/components/ui/menu-layer";
import { Label } from "@/components/ui/fields";
import { cn } from "@/lib/utils";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1 };
}

function monthCells(year: number, month: number) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const prev = shiftMonth(year, month, -1);
  const prevCount = daysInMonth(prev.y, prev.m);
  const cells: { iso: string; inMonth: boolean }[] = [];
  for (let index = lead; index > 0; index -= 1) {
    cells.push({ iso: formatISODate(prev.y, prev.m, prevCount - index + 1), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth(year, month); day += 1) {
    cells.push({ iso: formatISODate(year, month, day), inMonth: true });
  }
  const next = shiftMonth(year, month, 1);
  let day = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ iso: formatISODate(next.y, next.m, day), inMonth: false });
    day += 1;
  }
  return cells;
}

export function DateMenu({
  name,
  value: defaultValue,
  id,
  label,
  labelTone = "field",
  className,
  required,
  "aria-label": ariaLabel,
}: {
  name: string;
  value: string;
  id?: string;
  label?: string;
  labelTone?: "field" | "filter";
  className?: string;
  required?: boolean;
  "aria-label"?: string;
}) {
  const buttonId = id ?? name;
  const menuId = useId();
  const titleId = useId();
  const labelId = useId();
  const valueId = useId();
  const today = kolkataToday();
  const [value, setValue] = useState(isISODate(defaultValue) ? defaultValue : today);
  const [open, setOpen] = useState(false);
  const parsed = isISODate(value) ? parseISODate(value) : parseISODate(today);
  const [cursor, setCursor] = useState({ y: parsed.y, m: parsed.m });
  const { triggerRef, menuRef, box } = useAnchoredMenu(open);
  const cells = monthCells(cursor.y, cursor.m);

  useEffect(() => {
    if (isISODate(defaultValue)) setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
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
  }, [open, triggerRef, menuRef]);

  function openMenu() {
    const next = isISODate(value) ? parseISODate(value) : parseISODate(today);
    setCursor({ y: next.y, m: next.m });
    setOpen(true);
  }

  function choose(iso: string) {
    setValue(iso);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function moveDay(iso: string, delta: number) {
    const { y, m, d } = parseISODate(iso);
    const date = new Date(Date.UTC(y, m - 1, d + delta));
    const next = formatISODate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    const shown = parseISODate(next);
    setCursor({ y: shown.y, m: shown.m });
    queueMicrotask(() => document.getElementById(`${menuId}-${next}`)?.focus());
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
          "flex h-11 w-full appearance-none items-center justify-between gap-2 rounded-full border border-black/10 bg-white px-4 text-left text-[17px] leading-[22px] tracking-[-0.43px] tabular-nums",
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={ariaLabel ? `${ariaLabel}, ${formatDisplayDate(value)}` : undefined}
        aria-labelledby={!ariaLabel && label ? `${labelId} ${valueId}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        <span id={valueId}>{formatDisplayDate(value)}</span>
        <Calendar className="size-4 shrink-0 text-zinc-500" aria-hidden />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="dialog"
              aria-modal="false"
              aria-labelledby={titleId}
              data-liquid-glass
              data-state="open"
              className="menu-surface fixed z-50 w-[312px] rounded-[14px]"
              style={box ? { top: box.top, left: box.left, width: box.width } : { top: 0, left: 0, visibility: "hidden" }}
              onKeyDown={(event) => {
                if (event.key !== "Tab" || !menuRef.current) return;
                const items = [...menuRef.current.querySelectorAll<HTMLElement>("button")];
                const first = items[0];
                const last = items[items.length - 1];
                if (!first || !last) return;
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first.focus();
                }
              }}
            >
              <LiquidGlass />
              <div className="relative z-[1] p-3">
              <div className="mb-2 flex items-center justify-between">
                <button type="button" className="grid size-11 place-items-center rounded-full text-[#007aff]" aria-label="Previous month" onClick={() => setCursor((current) => shiftMonth(current.y, current.m, -1))}>
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <p id={titleId} className="text-[17px] font-semibold tracking-[-0.43px]">
                  {formatMonthLabel(formatISODate(cursor.y, cursor.m, 1))}
                </p>
                <button type="button" className="grid size-11 place-items-center rounded-full text-[#007aff]" aria-label="Next month" onClick={() => setCursor((current) => shiftMonth(current.y, current.m, 1))}>
                  <ChevronRight className="size-5" aria-hidden />
                </button>
              </div>
              <div className="grid grid-cols-7 text-center text-[13px] font-semibold text-zinc-500">
                {weekdays.map((day) => (
                  <div key={day} className="py-1">
                    <span className="sr-only">{day}</span>
                    <span aria-hidden>{day.slice(0, 1)}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((cell) => {
                  const selected = cell.iso === value;
                  const isToday = cell.iso === today;
                  return (
                    <button
                      key={cell.iso}
                      id={`${menuId}-${cell.iso}`}
                      type="button"
                      aria-label={`${formatDisplayDate(cell.iso)}${isToday ? ", today" : ""}`}
                      aria-pressed={selected}
                      className={cn(
                        "mx-auto grid size-10 place-items-center rounded-full text-[17px] tabular-nums",
                        selected ? "bg-[#007aff] text-white" : "hover:bg-[rgb(120_120_128/0.16)]",
                        !cell.inMonth && !selected ? "text-zinc-400" : "",
                        isToday && !selected ? "ring-1 ring-[#007aff]" : "",
                      )}
                      onClick={() => choose(cell.iso)}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowLeft") {
                          event.preventDefault();
                          moveDay(cell.iso, -1);
                        } else if (event.key === "ArrowRight") {
                          event.preventDefault();
                          moveDay(cell.iso, 1);
                        } else if (event.key === "ArrowUp") {
                          event.preventDefault();
                          moveDay(cell.iso, -7);
                        } else if (event.key === "ArrowDown") {
                          event.preventDefault();
                          moveDay(cell.iso, 7);
                        }
                      }}
                    >
                      {Number(cell.iso.slice(8))}
                    </button>
                  );
                })}
              </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
