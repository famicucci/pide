import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";
import { getStockLocalDate } from "@/lib/stock";
import { getStockUnit } from "@/lib/stock-units";

interface SeasonRow extends RowDataPacket {
  is_high: number;
}

interface AlertRow extends RowDataPacket {
  id: number;
  category_name: string;
  brand: string | null;
  name: string;
  unit: string;
  current_quantity: string;
  active_minimum: string;
  updated_at: string;
}

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const localDate = getStockLocalDate();
  const [seasonRows] = await db.execute<SeasonRow[]>(
    "SELECT EXISTS(SELECT 1 FROM stock_high_season_dates WHERE season_date = ?) AS is_high",
    [localDate]
  );
  const season = seasonRows[0]?.is_high ? "high" : "low";
  const minimumColumn =
    season === "high" ? "i.minimum_high_season" : "i.minimum_low_season";

  const [rows] = await db.execute<AlertRow[]>(`
    SELECT i.id, c.name AS category_name, i.brand, i.name, i.unit,
           i.current_quantity, ${minimumColumn} AS active_minimum, i.updated_at
    FROM stock_items i
    JOIN stock_categories c ON c.id = i.category_id
    WHERE i.active = 1
      AND c.active = 1
      AND ${minimumColumn} IS NOT NULL
      AND i.current_quantity <= ${minimumColumn}
    ORDER BY (${minimumColumn} - i.current_quantity) DESC, c.sort_order ASC, i.name ASC
  `);

  return NextResponse.json({
    count: rows.length,
    season,
    date: localDate,
    items: rows.map((row) => {
      const currentQuantity = Number(row.current_quantity);
      const activeMinimum = Number(row.active_minimum);
      const unit = getStockUnit(row.unit);
      return {
        ...row,
        unit: unit.value,
        unit_abbreviation: unit.abbreviation,
        current_quantity: currentQuantity,
        active_minimum: activeMinimum,
        shortage: Math.max(0, Number((activeMinimum - currentQuantity).toFixed(2))),
      };
    }),
  });
}
