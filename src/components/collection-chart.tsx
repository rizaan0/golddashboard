"use client";

import { useEffect, useRef, useState } from "react";
import { formatINR } from "@/lib/money";

export function CollectionChart({ data }: { data: { key: string; paise: number }[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [width, setWidth] = useState(640);
  const frameRef = useRef<HTMLElement>(null);
  const plotRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => setWidth(Math.max(280, frame.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  if (data.length === 0) {
    return <p className="text-sm text-zinc-500">No collections in this range.</p>;
  }

  const total = data.reduce((sum, row) => sum + row.paise, 0);
  const peak = Math.max(...data.map((row) => row.paise), 0);
  const ticks = axisTicks(peak);
  const top = Math.max(ticks[ticks.length - 1] ?? 0, 1);
  const labelEvery = data.length <= 8 ? 1 : Math.ceil(data.length / 5);
  const height = 248;
  const padTop = 36;
  const padBottom = 28;
  const padEnd = 56;
  const plotBottom = height - padBottom;

  function selectAt(clientX: number) {
    const svg = plotRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * width;
    const plotWidth = width - padEnd;
    const index = Math.min(data.length - 1, Math.max(0, Math.floor((x / plotWidth) * data.length)));
    setSelected(index);
  }

  function move(index: number, key: string) {
    if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "Home" && key !== "End") return;
    const next = key === "Home" ? 0 : key === "End" ? data.length - 1 : key === "ArrowLeft" ? index - 1 : index + 1;
    if (next < 0 || next >= data.length) return;
    setSelected(next);
    plotRef.current?.querySelectorAll<SVGRectElement>("[data-chart-mark]")[next]?.focus();
  }

  const active = selected === null ? null : data[selected];

  return (
    <figure ref={frameRef}>
      <p className="text-[28px] font-semibold tabular-nums tracking-tight">{formatINR(total)}</p>
      <p className="sr-only">
        Bar chart of collections in rupees. The vertical axis starts at zero and ends at {formatINR(peak === 0 ? 0 : top)}. {data.length}{" "}
        {data.length === 1 ? "period" : "periods"}.
      </p>
      <svg
        ref={plotRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        className="mt-2 touch-pan-y"
        role="group"
        aria-label="Collections"
        onPointerMove={(event) => {
          if (event.pointerType === "mouse" || event.buttons > 0) selectAt(event.clientX);
        }}
        onPointerDown={(event) => selectAt(event.clientX)}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setSelected(null);
        }}
      >
        <g aria-hidden="true">
          {ticks.map((tick) => {
            const y = plotBottom - (tick / top) * (plotBottom - padTop);
            return (
              <g key={tick}>
                <line className="chart-grid" x1={0} x2={width - padEnd} y1={y} y2={y} stroke="rgb(60 60 67 / 0.12)" strokeWidth={1} />
                <text className="chart-tick" x={632} y={y + 4} textAnchor="end" fill="#8e8e93" fontSize={12}>
                  {compactINR(tick)}
                </text>
              </g>
            );
          })}
        </g>
        {data.map((row, index) => {
          const slot = (width - padEnd) / data.length;
          const barWidth = Math.min(22, slot * 0.62);
          const x = index * slot + (slot - barWidth) / 2;
          const barHeight = top === 0 ? 0 : (row.paise / top) * (plotBottom - padTop);
          const y = plotBottom - barHeight;
          const showLabel = index === 0 || index === data.length - 1 || index % labelEvery === 0;
          const spoken = `${spokenDate(row.key)}, collected ${formatINR(row.paise)}`;
          return (
            <g key={row.key}>
              <rect
                data-chart-mark
                role="button"
                tabIndex={index === (selected ?? 0) ? 0 : -1}
                aria-label={spoken}
                aria-pressed={selected === index}
                x={index * slot}
                y={padTop}
                width={slot}
                height={plotBottom - padTop}
                fill="transparent"
                className="cursor-pointer outline-none focus-visible:fill-[rgb(0_122_255/0.08)]"
                onFocus={() => setSelected(index)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Home" || event.key === "End") {
                    event.preventDefault();
                    move(index, event.key);
                  }
                }}
              />
              {barHeight > 0 ? (
                <path
                  className="chart-bar pointer-events-none"
                  d={barPath(x, y, barWidth, barHeight, 5)}
                  fill="#007aff"
                  opacity={selected === null || selected === index ? 1 : 0.35}
                />
              ) : null}
              {showLabel ? (
                <text aria-hidden="true" x={index * slot + slot / 2} y={height - 8} textAnchor="middle" fill="#8e8e93" fontSize={12}>
                  {axisDate(row.key, data.length > 8 && index !== 0 && index !== data.length - 1)}
                </text>
              ) : null}
              {selected === index ? (
                <g aria-hidden="true">
                  <Callout plotWidth={width} x={index * slot + slot / 2} y={Math.max(16, y - 10)} text={formatINR(row.paise)} />
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
      <p className="sr-only" aria-live="polite">
        {active ? `${spokenDate(active.key)}, collected ${formatINR(active.paise)}` : ""}
      </p>
      <table className="sr-only">
        <caption>Collections by period</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Collected</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.key}>
              <td>{spokenDate(row.key)}</td>
              <td>{formatINR(row.paise)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Callout({ plotWidth, x, y, text }: { plotWidth: number; x: number; y: number; text: string }) {
  const width = Math.max(88, text.length * 7.4);
  const left = Math.min(plotWidth - 56 - width / 2, Math.max(width / 2, x));
  return (
    <g>
      <rect x={left - width / 2} y={y - 18} width={width} height={22} rx={11} fill="#1c1c1e" />
      <text x={left} y={y - 3} textAnchor="middle" fill="#ffffff" fontSize={12}>
        {text}
      </text>
    </g>
  );
}

function barPath(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  return `M ${x} ${y + height} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + width - r} ${y} Q ${x + width} ${y} ${x + width} ${y + r} L ${x + width} ${y + height} Z`;
}

function axisTicks(max: number) {
  if (max <= 0) return [0];
  if (max < 100) return [0, 100];
  const rough = max / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((value) => value >= rough) ?? magnitude * 10;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 1000; value += step) ticks.push(Math.round(value));
  return ticks;
}

function compactINR(paise: number) {
  const rupees = paise / 100;
  if (rupees >= 10000000) return `₹${trim(rupees / 10000000)}Cr`;
  if (rupees >= 100000) return `₹${trim(rupees / 100000)}L`;
  if (rupees >= 1000) return `₹${trim(rupees / 1000)}k`;
  return `₹${trim(rupees)}`;
}

function trim(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function dateFromKey(key: string) {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  const day = key.length >= 10 ? Number(key.slice(8, 10)) : 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function axisDate(key: string, dayOnly: boolean) {
  return new Intl.DateTimeFormat("en-IN", {
    day: key.length >= 10 ? "numeric" : undefined,
    month: key.length >= 10 && dayOnly ? undefined : "short",
    year: key.length < 10 ? "numeric" : undefined,
    timeZone: "UTC",
  }).format(dateFromKey(key));
}

function spokenDate(key: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: key.length >= 10 ? "numeric" : undefined,
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateFromKey(key));
}
