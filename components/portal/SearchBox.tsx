"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { useUrlParams } from "@/components/portal/useUrlParams";

interface Props {
  placeholder: string;
  label: string;
  /** Query-param name, default `q`. */
  param?: string;
  /** Current server-parsed value (keeps input in sync on back/forward). */
  value: string;
}

/** Live search: debounced (300 ms) and written to `?q=` with history replace. */
export default function SearchBox({ placeholder, label, param = "q", value }: Props) {
  const { update, pending } = useUrlParams();
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => setText(value), [value]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const commit = (v: string) =>
    update((p) => {
      const t = v.trim();
      if (t) p.set(param, t);
      else p.delete(param);
    }, "replace");

  return (
    <div role="search" className="relative flex-1">
      <label htmlFor={`search-${param}`} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        id={`search-${param}`}
        type="search"
        value={text}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          setText(e.target.value);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => commit(e.target.value), 300);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            clearTimeout(timer.current);
            commit(text);
          }
        }}
        className="h-11 w-full rounded-full border border-slate-300 bg-white pl-11 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-label="Memuat" />
        ) : text ? (
          <button
            type="button"
            aria-label="Hapus pencarian"
            onClick={() => {
              setText("");
              commit("");
            }}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </span>
    </div>
  );
}
