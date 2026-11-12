import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-[15px] leading-5 font-semibold tracking-[-0.23px] text-zinc-700", className)} {...props} />;
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-[17px] leading-[22px] tracking-[-0.43px] outline-none focus:border-[#007aff]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[17px] leading-[22px] tracking-[-0.43px] outline-none focus:border-[#007aff]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-[17px] leading-[22px] tracking-[-0.43px] outline-none focus:border-[#007aff]",
        className,
      )}
      {...props}
    />
  );
}
