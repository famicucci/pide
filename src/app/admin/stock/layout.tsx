import { AdminStockNav } from "@/components/stock/AdminStockNav";

export default function StockLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="sticky top-14 z-30 border-b bg-muted/95 px-4 backdrop-blur md:top-0 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <AdminStockNav />
        </div>
      </div>
      {children}
    </div>
  );
}
