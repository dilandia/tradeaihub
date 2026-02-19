"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, Server } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  platform: "MT4" | "MT5";
  id?: string;
  placeholder?: string;
  className?: string;
};

type BrokersResult = {
  brokers: Record<string, string[]>;
};

/** Flat list of { broker, server } from the API result */
type ServerOption = {
  broker: string;
  server: string;
};

export function ServerAutocomplete({
  value,
  onChange,
  platform,
  id,
  placeholder = "Ex: ICMarketsSC-Demo",
  className,
}: Props) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<ServerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync external value → internal query
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchServers = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const version = platform === "MT4" ? "4" : "5";
        const res = await fetch(
          `/api/mt-servers?query=${encodeURIComponent(q)}&version=${version}`
        );
        const data: BrokersResult = await res.json();

        const flat: ServerOption[] = [];
        for (const [broker, servers] of Object.entries(data.brokers)) {
          for (const server of servers) {
            flat.push({ broker, server });
          }
        }

        setOptions(flat);
        if (flat.length > 0) setOpen(true);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [platform]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    // Debounce API call
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchServers(val), 400);
  }

  function handleSelect(opt: ServerOption) {
    setQuery(opt.server);
    onChange(opt.server);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (options.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground",
            "placeholder:text-muted-foreground/50",
            "focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-1 focus:ring-offset-background",
            "transition-colors",
            className
          )}
          autoComplete="off"
        />
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && options.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
          {options.map((opt, i) => (
            <button
              key={`${opt.broker}-${opt.server}-${i}`}
              type="button"
              onClick={() => handleSelect(opt)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                "text-foreground hover:bg-muted"
              )}
            >
              <Server className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{opt.server}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {opt.broker}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {open && !loading && query.length >= 2 && options.length === 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-border bg-card p-3 text-center text-xs text-muted-foreground shadow-lg">
          Nenhum servidor encontrado. Você pode digitar o nome manualmente.
        </div>
      )}
    </div>
  );
}
