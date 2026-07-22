import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireRole } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, PackageOpen, TriangleAlert } from "lucide-react";
import { getStockLocalDate } from "@/lib/stock";

interface StatsRow extends RowDataPacket {
  active_items: number;
  low_stock_items: number;
}

export default async function AdminPage() {
  const session = await requireRole("admin");
  if (!session) redirect("/login");

  const localDate = getStockLocalDate();
  const [rows] = await db.execute<StatsRow[]>(`
    SELECT
      COUNT(*) AS active_items,
      SUM(
        CASE
          WHEN season.is_high = 1 AND i.minimum_high_season IS NOT NULL
            AND i.current_quantity <= i.minimum_high_season THEN 1
          WHEN season.is_high = 0 AND i.minimum_low_season IS NOT NULL
            AND i.current_quantity <= i.minimum_low_season THEN 1
          ELSE 0
        END
      ) AS low_stock_items
    FROM stock_items i
    JOIN stock_categories c ON c.id = i.category_id
    CROSS JOIN (
      SELECT EXISTS(
        SELECT 1 FROM stock_high_season_dates WHERE season_date = ?
      ) AS is_high
    ) season
    WHERE i.active = 1 AND c.active = 1
  `, [localDate]);

  const stats = rows[0] ?? { active_items: 0, low_stock_items: 0 };
  const lowStockCount = Number(stats.low_stock_items ?? 0);

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Hola, {session.name}</p>
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <Link
        href={lowStockCount > 0 ? "/admin/stock/alertas" : "/admin/stock"}
        className={`block rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
          lowStockCount > 0
            ? "border-amber-300 bg-amber-50"
            : "border-emerald-200 bg-emerald-50"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              lowStockCount > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {lowStockCount > 0 ? (
              <TriangleAlert className="h-6 w-6" />
            ) : (
              <CheckCircle2 className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold">
              {lowStockCount > 0
                ? `${lowStockCount} ${lowStockCount === 1 ? "artículo necesita" : "artículos necesitan"} atención`
                : "El stock está en orden"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {lowStockCount > 0
                ? "Hay artículos que alcanzaron el mínimo configurado para hoy."
                : "Todos los artículos están por encima de su mínimo configurado."}
            </p>
            <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <PackageOpen className="h-4 w-4" />
              {lowStockCount > 0 ? "Ver artículos" : "Gestionar stock"} →
            </span>
          </div>
        </div>
      </Link>

      <div className="mt-4 rounded-2xl border bg-white p-5">
        <p className="text-sm text-muted-foreground">Artículos activos</p>
        <p className="mt-1 text-3xl font-bold">{Number(stats.active_items)}</p>
      </div>
    </div>
  );
}
