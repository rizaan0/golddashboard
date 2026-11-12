export function parseRupeesToPaise(value: string): number | null {
  const cleaned = value.replace(/,/g, "").trim();
  const match = cleaned.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const rupees = Number(match[1]);
  const fraction = (match[2] ?? "").padEnd(2, "0");
  const paise = rupees * 100 + Number(fraction);
  if (!Number.isSafeInteger(paise) || paise <= 0) return null;
  return paise;
}

export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export function formatRupeesInput(paise: number): string {
  return (paise / 100).toFixed(paise % 100 === 0 ? 0 : 2);
}
