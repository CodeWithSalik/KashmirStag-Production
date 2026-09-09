"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";

export function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "newest";

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push("?" + params.toString(), { scroll: false });
  };

  const options = [
    { value: "newest", label: "Newest Arrivals" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "popular", label: "Most Popular" },
    { value: "rating", label: "Best Rated" }
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-muted whitespace-nowrap">Sort by:</span>
      <Select
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        options={options}
        className="w-48"
      />
    </div>
  );
}
