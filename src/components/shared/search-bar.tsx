"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data.products || []);
          setIsOpen(true);
        })
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={ref}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Input
            type="search"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            className="w-full pl-10 pr-4 py-2"
            aria-expanded={isOpen}
            role="combobox"
            aria-controls="search-suggestions"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </form>

      {isOpen && suggestions.length > 0 && (
        <div id="search-suggestions" className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg border border-surface-200 z-50 overflow-hidden">
          <ul className="py-1">
            {suggestions.map((p) => (
              <li key={p._id}>
                <Link
                  href={`/product/${p.slug}`}
                  onClick={() => { setIsOpen(false); setQuery(""); }}
                  className="block px-4 py-2 text-sm text-text-primary hover:bg-surface-50 hover:text-brand-600"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
