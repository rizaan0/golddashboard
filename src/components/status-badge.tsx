import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  completed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  active: "bg-blue-50 text-blue-700 ring-blue-200",
  overdue: "bg-red-50 text-red-800 ring-red-200",
  due: "bg-blue-50 text-blue-700 ring-blue-200",
  upcoming: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  inactive: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  archived: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  reversed: "bg-zinc-100 text-zinc-500 ring-zinc-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", tones[status] ?? tones.upcoming)}>
      {status === "bank_transfer" ? "Bank transfer" : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
