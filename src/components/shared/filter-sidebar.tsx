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
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-lg">Filters</h3>
          <button onClick={clearFilters} className="text-sm text-brand-600 hover:underline">Clear All</button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm text-text-primary">Categories</h4>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={currentCategory === cat.slug}
                  onChange={() => toggleFilter("category", cat.slug)}
                  className="rounded-full text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-text-secondary">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3 border-t border-surface-200 pt-4">
          <h4 className="font-medium text-sm text-text-primary">Availability</h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => toggleFilter("inStock", e.target.checked ? "true" : null)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-text-secondary">In Stock Only</span>
          </label>
        </div>
      </div>
    </div>
  );
}
