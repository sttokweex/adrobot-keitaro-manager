import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { OfferChoice } from "../types";
import { Icon } from "./Icon";
export function OfferSearch({
  onSelect,
  placeholder,
}: {
  onSelect: (offer: OfferChoice) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OfferChoice[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setOpen(false);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await api<OfferChoice[]>(
          `/api/offers?q=${encodeURIComponent(q)}`,
        );
        if (active) {
          setResults(rows);
          setOpen(true);
        }
      } catch {
        if (active) {
          setResults([]);
          setOpen(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 220);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);
  return (
    <div className="offer-search">
      <div className="search-box">
        <Icon name="search" size={15} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder={placeholder}
        />
      </div>
      {open && (
        <div className="search-results">
          {loading ? (
            <div className="search-empty">Поиск…</div>
          ) : results.length ? (
            results.map((row) => (
              <button
                type="button"
                key={row.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(row);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span>{row.name}</span>
                <small>#{row.id}</small>
              </button>
            ))
          ) : (
            <div className="search-empty">Ничего не найдено</div>
          )}
        </div>
      )}
    </div>
  );
}
