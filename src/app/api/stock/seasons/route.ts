import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { z } from "zod";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";
import { getStockLocalDate } from "@/lib/stock";

interface DateRow extends RowDataPacket {
  season_date: string;
}

interface CurrentSeasonRow extends RowDataPacket {
  is_high: number;
}

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const datesSchema = z.object({
  dates: z.array(dateString).min(1).max(730),
});

export async function GET(request: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const year =
    Number(request.nextUrl.searchParams.get("year")) || Number(getStockLocalDate().slice(0, 4));
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const currentDate = getStockLocalDate();
  const [[rows], [currentSeasonRows]] = await Promise.all([
    db.execute<DateRow[]>(
      `SELECT DATE_FORMAT(season_date, '%Y-%m-%d') AS season_date
       FROM stock_high_season_dates
       WHERE season_date >= ? AND season_date < ?
       ORDER BY season_date ASC`,
      [`${year}-01-01`, `${year + 1}-01-01`]
    ),
    db.execute<CurrentSeasonRow[]>(
      `SELECT EXISTS(
         SELECT 1 FROM stock_high_season_dates WHERE season_date = ?
       ) AS is_high`,
      [currentDate]
    ),
  ]);

  return NextResponse.json({
    year,
    dates: rows.map((row) => row.season_date),
    current_date: currentDate,
    current_season: currentSeasonRows[0]?.is_high ? "high" : "low",
  });
}

export async function POST(request: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = datesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const dates = [...new Set(parsed.data.dates)];
  const placeholders = dates.map(() => "(?, ?)").join(", ");
  const values = dates.flatMap((date) => [date, session.userId]);
  await db.execute(
    `INSERT IGNORE INTO stock_high_season_dates (season_date, created_by)
     VALUES ${placeholders}`,
    values
  );

  return NextResponse.json({ ok: true, dates });
}

export async function DELETE(request: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = datesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const dates = [...new Set(parsed.data.dates)];
  const placeholders = dates.map(() => "?").join(", ");
  await db.execute(
    `DELETE FROM stock_high_season_dates WHERE season_date IN (${placeholders})`,
    dates
  );

  return NextResponse.json({ ok: true, dates });
}
