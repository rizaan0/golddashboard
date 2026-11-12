"use client";

import { Delete } from "lucide-react";
import { LiquidGlass } from "@/components/liquid-glass/liquid-glass";
import { PASSCODE_LENGTH } from "@/lib/passcode";

const KEY_TINT = { r: 8, g: 12, b: 28, a: 0.16 };

const KEYS: { digit: string; letters: string }[] = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
];

export function PasscodePad({
  title,
  value,
  shake,
  message,
  onChange,
  compact = false,
  onGlass = false,
}: {
  title: string;
  value: string;
  shake: number;
  message?: string;
  onChange: (next: string) => void;
  compact?: boolean;
  onGlass?: boolean;
}) {
  const press = (digit: string) => {
    if (onGlass && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(12);
    if (value.length >= PASSCODE_LENGTH) return;
    onChange(value + digit);
  };

  const keyClass = "bg-white/70 text-zinc-950 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.8),0_8px_20px_-12px_rgb(0_0_0/0.45)]";

  return (
    <div className={`relative flex flex-col items-center justify-center px-6 py-8 ${compact ? "" : "min-h-dvh"}`}>
      <div className="relative flex flex-col items-center">
      <div className="relative flex flex-col items-center">
        {onGlass ? <div aria-hidden="true" className="pointer-events-none absolute -inset-x-16 -top-6 -bottom-4 -z-10 rounded-full bg-[#050714]/60 blur-2xl" /> : null}
      <h1 className={`text-center text-[28px] leading-[34px] font-medium tracking-[0.36px] ${onGlass ? "text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.55)]" : ""}`}>{title}</h1>
      <div key={shake} className="mt-6 flex gap-4 motion-safe:data-[shake=true]:animate-none" data-shake={shake > 0}>
        <div className={`flex gap-4 ${shake > 0 ? "passcode-shake" : ""}`}>
          {Array.from({ length: PASSCODE_LENGTH }, (_, index) => (
            <span
              key={index}
              className={`size-3.5 rounded-full border-2 ${onGlass ? "border-white shadow-[0_0_0_3px_rgb(5_7_20/0.45)]" : "border-zinc-900"} ${index < value.length ? (onGlass ? "bg-white" : "bg-zinc-900") : "bg-transparent"}`}
            />
          ))}
        </div>
      </div>
      <p role="status" className={`mt-4 min-h-5 text-center text-[15px] leading-5 text-[#ff3b30] ${onGlass && message ? "rounded-full bg-[#050714]/75 px-3 py-1 font-medium" : ""}`}>{message}</p>
      </div>
      <div className="mt-6 grid w-full max-w-[320px] grid-cols-3 justify-items-center gap-5">
        {KEYS.map((key) =>
          onGlass ? (
            <button
              key={key.digit}
              type="button"
              data-liquid-glass
              className="passcode-key relative flex size-[76px] flex-col items-center justify-center rounded-full bg-transparent text-white"
              onClick={() => press(key.digit)}
            >
              <LiquidGlass preserveShape live tint={KEY_TINT} />
              <span className="relative z-[2] text-[32px] leading-8 font-normal [text-shadow:0_1px_2px_rgb(0_0_0/0.45)]">{key.digit}</span>
              <span className="relative z-[2] mt-0.5 h-3 text-[10px] leading-3 tracking-[0.12em] text-white/80">{key.letters}</span>
            </button>
          ) : (
            <button
              key={key.digit}
              type="button"
              className={`flex size-[76px] flex-col items-center justify-center rounded-full backdrop-blur-md ${keyClass}`}
              onClick={() => press(key.digit)}
            >
              <span className="text-[32px] leading-8 font-normal">{key.digit}</span>
              <span className="mt-0.5 h-3 text-[10px] leading-3 tracking-[0.12em] text-zinc-500">{key.letters}</span>
            </button>
          ),
        )}
        <span />
        {onGlass ? (
          <button
            type="button"
            data-liquid-glass
            className="passcode-key relative flex size-[76px] flex-col items-center justify-center rounded-full bg-transparent text-white"
            onClick={() => press("0")}
          >
            <LiquidGlass preserveShape live tint={KEY_TINT} />
            <span className="relative z-[2] text-[32px] leading-8 font-normal [text-shadow:0_1px_2px_rgb(0_0_0/0.45)]">0</span>
          </button>
        ) : (
          <button
            type="button"
            className={`flex size-[76px] flex-col items-center justify-center rounded-full backdrop-blur-md ${keyClass}`}
            onClick={() => press("0")}
          >
            <span className="text-[32px] leading-8 font-normal">0</span>
          </button>
        )}
        {onGlass ? (
          <button
            type="button"
            aria-label="Delete"
            className="flex size-[76px] items-center justify-center rounded-full text-white"
            onClick={() => onChange(value.slice(0, -1))}
          >
            <Delete className="size-7" strokeWidth={1.75} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Delete"
            className="flex size-[76px] items-center justify-center rounded-full text-zinc-900"
            onClick={() => onChange(value.slice(0, -1))}
          >
            <Delete className="size-7" strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </div>
      {onGlass ? (
        <button type="button" className="mt-8 min-h-11 px-4 text-[17px] text-white" onClick={() => onChange("")}>
          Cancel
        </button>
      ) : (
        <button type="button" className="mt-8 min-h-11 px-4 text-[17px] text-zinc-800" onClick={() => onChange("")}>
          Cancel
        </button>
      )}
      </div>
    </div>
  );
}
