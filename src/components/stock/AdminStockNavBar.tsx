"use client";

import { AdminStockNav } from "@/components/stock/AdminStockNav";
import { useSearchMode } from "@/components/admin/search-mode";
import { cn } from "@/lib/utils";

export function AdminStockNavBar() {
  const { searchMode } = useSearchMode();

  return (
    <div
      className={cn(
        "sticky top-14 z-30 border-b bg-muted/95 py-2 backdrop-blur md:top-0 sm:px-8",
        searchMode ? "hidden md:block" : "block"
      )}
    >
      <div className="mx-auto max-w-5xl">
        <AdminStockNav />
      </div>
    </div>
  );
}
