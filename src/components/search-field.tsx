"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { searchFilterKey, searchHref } from "@/lib/search";

export function SearchField({
  path,
  label,
  placeholder,
  query,
  tokens,
  scopes,
  scope,
  resultLabel,
  action,
}: {
  path: string;
  label: string;
  placeholder: string;
  query: string;
  tokens: string[];
  scopes: { id: string; label: string }[];
  scope: string;
  resultLabel?: string;
  action?: ReactNode;
}) {
  const router = useRouter();
  const [text, setText] = useState(query);
  const [terms, setTerms] = useState(tokens);
  const [activeScope, setActiveScope] = useState(scope || "all");
  const [selected, setSelected] = useState<number | null>(null);
  const submitted = useRef(searchFilterKey(query, tokens, scope || "all"));
  const localKey = searchFilterKey(text, terms, activeScope);
  const localKeyRef = useRef(localKey);
  localKeyRef.current = localKey;

  useEffect(() => {
    const incoming = searchFilterKey(query, tokens, scope || "all");
    const local = localKeyRef.current;
    if (incoming === local || incoming === submitted.current) return;
    if (local !== submitted.current) return;
    submitted.current = incoming;
    setText(query);
    setTerms(tokens);
    setActiveScope(scope || "all");
  }, [query, scope, tokens]);

  useEffect(() => {
    const next = searchFilterKey(text, terms, activeScope);
    if (next === searchFilterKey(query, tokens, scope || "all")) return;
    const handle = window.setTimeout(() => {
      submitted.current = next;
      router.replace(searchHref(path, text, terms, activeScope), { scroll: false });
    }, 200);
    return () => window.clearTimeout(handle);
  }, [activeScope, path, query, router, scope, terms, text, tokens]);

  const commit = () => {
    const value = text.trim().replace(/,+$/, "");
    if (!value) return;
    setText("");
    setSelected(null);
    setTerms((current) => [...current, value]);
  };

  const removeTerm = (index: number) => {
    setSelected(null);
    setTerms((current) => current.filter((_, item) => item !== index));
  };

  return (
    <div className="mb-4" role="search">
      <div className="flex flex-wrap items-center gap-3">
      <div className="search-field flex min-h-11 min-w-0 flex-1 flex-wrap items-center gap-1 rounded-full bg-[rgb(120_120_128/0.12)] px-3">
        <Search className="size-5 shrink-0 text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
        {terms.map((term, index) => (
          <span key={`${term}-${index}`} className={`inline-flex items-center rounded-full ${selected === index ? "bg-[#007aff] text-white" : "bg-white text-zinc-900"}`}>
            <button
              type="button"
              aria-pressed={selected === index}
              className="min-h-7 px-2 text-[15px] leading-5"
              onClick={() => setSelected(index)}
            >
              {term}
            </button>
            <button type="button" aria-label={`Remove ${term}`} className="inline-flex size-7 items-center justify-center rounded-full" onClick={() => removeTerm(index)}>
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        <label htmlFor={`${path}-search`} className="sr-only">
          {label}
        </label>
        <input
          id={`${path}-search`}
          value={text}
          placeholder={terms.length === 0 ? placeholder : ""}
          autoComplete="off"
          className="h-11 min-w-24 flex-1 bg-transparent text-[17px] leading-[22px] tracking-[-0.43px] outline-none"
          onChange={(event) => {
            setSelected(null);
            setText(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Backspace" && text === "" && terms.length > 0) {
              event.preventDefault();
              if (selected === null) setSelected(terms.length - 1);
              else removeTerm(selected);
            }
          }}
        />
        {text || terms.length > 0 ? (
          <button
            type="button"
            aria-label="Clear search"
            className="inline-flex size-7 items-center justify-center rounded-full text-zinc-700"
            onClick={() => {
              setText("");
              setTerms([]);
              setSelected(null);
            }}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {action}
      </div>
      <div role="radiogroup" aria-label="Search scope" className="mt-3 flex flex-wrap gap-2">
        {scopes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={activeScope === item.id}
            className={`min-h-11 rounded-full px-4 text-[15px] leading-5 ${activeScope === item.id ? "bg-[#007aff] text-white" : "bg-white text-zinc-800"}`}
            onClick={() => setActiveScope(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {resultLabel ? <p role="status" className="sr-only">{resultLabel}</p> : null}
    </div>
  );
}
