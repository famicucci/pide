import { AdminStockNavBar } from "@/components/stock/AdminStockNavBar";

export default function StockLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminStockNavBar />
      {children}
    </div>
  );
}
