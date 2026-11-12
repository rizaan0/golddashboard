"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";

export function CustomerPicker({
  customers,
}: {
  customers: { id: string; fullName: string; customerCode: string; phone: string }[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [active, setActive] = useState(0);
  const chosen = customers.find((customer) => customer.id === selected);
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || chosen) return [];
    return customers
      .filter((customer) => {
        return (
          customer.fullName.toLowerCase().includes(needle) ||
          customer.customerCode.toLowerCase().includes(needle) ||
          customer.phone.includes(needle.replace(/\D/g, "") || needle)
        );
      })
      .slice(0, 8);
  }, [chosen, customers, query]);

  const choose = (customer: (typeof customers)[number]) => {
    setSelected(customer.id);
    setQuery("");
    setActive(0);
  };

  return (
    <div>
      <div className="search-field flex min-h-11 flex-wrap items-center gap-1 rounded-[26px] border border-black/10 bg-white px-4">
        {chosen ? (
          <span className="inline-flex items-center rounded-full bg-white text-zinc-900">
            <span className="px-2 text-[15px] leading-5">
              {chosen.fullName}
              <span className="ml-2 text-zinc-500">{chosen.customerCode}</span>
            </span>
            <button
              type="button"
              aria-label={`Remove ${chosen.fullName}`}
              className="inline-flex size-7 items-center justify-center rounded-full"
              onClick={() => setSelected("")}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ) : null}
        <input
          id="customer-query"
          value={query}
          placeholder={chosen ? "" : "Search"}
          autoComplete="off"
          aria-controls="customer-matches"
          aria-expanded={matches.length > 0}
          className="h-11 min-w-24 flex-1 bg-transparent text-[17px] leading-[22px] tracking-[-0.43px] outline-none"
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            if (chosen) setSelected("");
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(matches.length - 1, index + 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(0, index - 1));
            }
            if (event.key === "Enter" && matches[active]) {
              event.preventDefault();
              choose(matches[active]);
            }
            if ((event.key === "Backspace" || event.key === "Delete") && query === "" && chosen) {
              event.preventDefault();
              setSelected("");
            }
          }}
        />
      </div>
      <input type="hidden" name="customerId" value={selected} />
      {matches.length > 0 ? (
        <ul id="customer-matches" role="listbox" aria-label="Matching customers" className="mt-2 max-h-48 overflow-auto rounded-lg border border-black/10 bg-white">
          {matches.map((customer, index) => (
            <li key={customer.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(customer)}
                className={`block min-h-11 w-full px-3 py-2 text-left text-[15px] leading-5 ${index === active ? "bg-[#007aff]/10" : ""}`}
              >
                <span className="font-medium">{customer.fullName}</span>
                <span className="ml-2 text-zinc-500">
                  {customer.customerCode} · {customer.phone}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {query.trim() && matches.length === 0 && !chosen ? <p className="mt-2 text-[15px] leading-5 text-zinc-600">No matching customers.</p> : null}
    </div>
  );
}
