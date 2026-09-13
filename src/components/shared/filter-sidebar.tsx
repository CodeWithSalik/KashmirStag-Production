"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

interface FilterSidebarProps {
  categories: { id: string; name: string; slug: string }[];
}

export function FilterSidebar({ categories }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const currentCategory = searchParams.get("category");
  const inStock = searchParams.get("inStock") === "true";

  const toggleFilter = (name: string, value: string | null) => {
    router.push("?" + createQueryString(name, value), { scroll: false });
  };

  const clearFilters = () => {
    router.push("?", { scroll: false });
  };

  return (
    <div className="w-full lg:w-64 shrink-0">
      <div className="flex items-center justify-between lg:hidden mb-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      <div className={`space-y-6 ${isOpen ? "block" : "hidden"} lg:block`}>
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="font-semibold text-base text-text">Filters</h3>
          <button onClick={clearFilters} className="text-xs font-medium text-brand-700 hover:text-brand-800 transition-colors">Clear All</button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm text-text">Categories</h4>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="category"
                  checked={currentCategory === cat.slug}
                  onChange={() => toggleFilter("category", cat.slug)}
                  className="rounded-full text-brand-700 focus:ring-brand-700 accent-brand-700"
                />
                <span className={`text-sm transition-colors ${currentCategory === cat.slug ? 'font-medium text-text' : 'text-text-secondary group-hover:text-text'}`}>
                  {cat.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <h4 className="font-medium text-sm text-text">Availability</h4>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => toggleFilter("inStock", e.target.checked ? "true" : null)}
              className="rounded text-brand-700 focus:ring-brand-700 accent-brand-700"
            />
            <span className={`text-sm transition-colors ${inStock ? 'font-medium text-text' : 'text-text-secondary group-hover:text-text'}`}>
              In Stock Only
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
