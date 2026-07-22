import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";
import { getStockLocalDate, toNullableNumber } from "@/lib/stock";
import { getStockUnit, STOCK_UNIT_VALUES } from "@/lib/stock-units";

interface SeasonRow extends RowDataPacket {
  is_high: number;
}

interface ItemRow extends RowDataPacket {
  id: number;
  category_id: number;
  category_name: string;
  brand: string | null;
  name: string;
  unit: string;
  current_quantity: string;
  minimum_low_season: string | null;
  minimum_high_season: string | null;
  sort_order: number;
  active: number;
  created_at: string;
  updated_at: string;
}

const createSchema = z.object({
  category_id: z.number().int().positive(),
  brand: z.string().trim().max(100).optional().default(""),
  name: z.string().trim().min(1).max(150),
  unit: z.enum(STOCK_UNIT_VALUES),
  current_quantity: z.number().nonnegative().default(0),
  minimum_low_season: z.number().nonnegative().nullable().optional().default(null),
  minimum_high_season: z.number().nonnegative().nullable().optional().default(null),
  sort_order: z.number().int().default(0),
});

export async function GET(request: NextRequest) {
  const session = await requireRole("admin", "stock");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const includeInactive =
    session.role === "admin" && request.nextUrl.searchParams.get("include_inactive") === "1";
  const search = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const localDate = getStockLocalDate();

  const [seasonRows] = await db.execute<SeasonRow[]>(
    "SELECT EXISTS(SELECT 1 FROM stock_high_season_dates WHERE season_date = ?) AS is_high",
    [localDate]
  );
  const season = seasonRows[0]?.is_high ? "high" : "low";

  const conditions: string[] = [];
  const values: Array<string> = [];
  if (!includeInactive) conditions.push("i.active = 1", "c.active = 1");
  if (search) {
    conditions.push("(i.name LIKE ? OR i.brand LIKE ?)");
    values.push(`%${search}%`, `%${search}%`);
  }

  const [rows] = await db.execute<ItemRow[]>(
    `SELECT i.id, i.category_id, c.name AS category_name, i.brand, i.name, i.unit,
            i.current_quantity, i.minimum_low_season, i.minimum_high_season,
            i.sort_order, i.active, i.created_at, i.updated_at
     FROM stock_items i
     JOIN stock_categories c ON c.id = i.category_id
     ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
     ORDER BY c.sort_order ASC, c.name ASC, i.sort_order ASC, i.name ASC`,
    values
  );

  return NextResponse.json({
    season,
    date: localDate,
    items: rows.map((row) => {
      const currentQuantity = Number(row.current_quantity);
      const minimumLow = toNullableNumber(row.minimum_low_season);
      const minimumHigh = toNullableNumber(row.minimum_high_season);
      const activeMinimum = season === "high" ? minimumHigh : minimumLow;
      const isLowStock = activeMinimum !== null && currentQuantity <= activeMinimum;
      const unit = getStockUnit(row.unit);

      return {
        ...row,
        unit: unit.value,
        unit_label: unit.label,
        unit_abbreviation: unit.abbreviation,
        current_quantity: currentQuantity,
        minimum_low_season: minimumLow,
        minimum_high_season: minimumHigh,
        active: Boolean(row.active),
        season,
        active_minimum: activeMinimum,
        is_low_stock: isLowStock,
        shortage: isLowStock ? Math.max(0, activeMinimum - currentQuantity) : null,
      };
    }),
  });
}

export async function POST(request: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO stock_items
        (category_id, brand, name, unit, current_quantity, minimum_low_season,
         minimum_high_season, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.category_id,
        data.brand || null,
        data.name,
        data.unit,
        data.current_quantity,
        data.minimum_low_season,
        data.minimum_high_season,
        data.sort_order,
      ]
    );

    await connection.execute(
      `INSERT INTO stock_movements
        (stock_item_id, movement_type, user_id, previous_quantity, new_quantity, difference)
       VALUES (?, 'initial', ?, NULL, ?, ?)`,
      [result.insertId, session.userId, data.current_quantity, data.current_quantity]
    );

    await connection.commit();
    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
