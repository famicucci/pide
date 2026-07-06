import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import { requireRole } from "@/lib/session";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface TableRow extends RowDataPacket {
  id: number;
  name: string;
}

interface ProductRow extends RowDataPacket {
  id: number;
  price: string;
  available: number;
}

interface OrderRow extends RowDataPacket {
  id: number;
  table_id: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  table_name: string;
  item_id: number | null;
  product_id: number | null;
  quantity: number | null;
  unit_price: string | null;
  item_notes: string | null;
  item_status: string | null;
  product_name: string | null;
}

const createOrderSchema = z.object({
  tableToken: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(99),
        notes: z.string().max(200).optional().default(""),
      })
    )
    .min(1),
  notes: z.string().max(500).optional().default(""),
});

export async function GET(request: NextRequest) {
  const session = await requireRole("admin", "waiter", "kitchen");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const statusParam = searchParams.get("status");
  const tableId = searchParams.get("table_id");

  let query = `
    SELECT
      o.id, o.table_id, o.status, o.notes, o.created_at, o.updated_at,
      t.name AS table_name,
      oi.id AS item_id, oi.product_id, oi.quantity, oi.unit_price,
      oi.notes AS item_notes, oi.status AS item_status,
      p.name AS product_name
    FROM orders o
    JOIN \`tables\` t ON t.id = o.table_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (statusParam) {
    const statuses = statusParam.split(",").map((s) => s.trim());
    query += ` AND o.status IN (${statuses.map(() => "?").join(",")})`;
    params.push(...statuses);
  }

  if (tableId) {
    query += " AND o.table_id = ?";
    params.push(Number(tableId));
  }

  // Restrict to the table's current open session (orders since it was opened)
  if (tableId && searchParams.get("session") === "current") {
    query += " AND o.status != 'cancelled' AND o.created_at >= (SELECT opened_at FROM `tables` WHERE id = ?)";
    params.push(Number(tableId));
  }

  query += " ORDER BY o.created_at ASC, oi.id ASC";

  const [rows] = await db.execute<OrderRow[]>(query, params);

  // Group flat rows into nested order objects
  const ordersMap = new Map<number, ReturnType<typeof buildOrder>>();

  function buildOrder(row: OrderRow) {
    return {
      id: row.id,
      table_id: row.table_id,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      table: { id: row.table_id, name: row.table_name },
      items: [] as {
        id: number;
        product_id: number;
        quantity: number;
        unit_price: number;
        notes: string | null;
        status: string;
        product: { id: number; name: string };
      }[],
    };
  }

  for (const row of rows) {
    if (!ordersMap.has(row.id)) {
      ordersMap.set(row.id, buildOrder(row));
    }
    if (row.item_id !== null) {
      ordersMap.get(row.id)!.items.push({
        id: row.item_id,
        product_id: row.product_id!,
        quantity: row.quantity!,
        unit_price: Number(row.unit_price),
        notes: row.item_notes,
        status: row.item_status!,
        product: { id: row.product_id!, name: row.product_name! },
      });
    }
  }

  return NextResponse.json(Array.from(ordersMap.values()));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { tableToken, items, notes } = parsed.data;

  const [tableRows] = await db.execute<TableRow[]>(
    "SELECT id, name FROM `tables` WHERE token = ? AND active = 1 LIMIT 1",
    [tableToken]
  );

  if (!tableRows.length) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  const table = tableRows[0];
  const productIds = items.map((i) => i.productId);

  const [productRows] = await db.execute<ProductRow[]>(
    `SELECT id, price, available FROM products WHERE id IN (${productIds.map(() => "?").join(",")}) AND available = 1`,
    productIds
  );

  if (productRows.length !== productIds.length) {
    return NextResponse.json({ error: "One or more products are unavailable" }, { status: 422 });
  }

  const priceMap = Object.fromEntries(productRows.map((p) => [p.id, Number(p.price)]));

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.execute<ResultSetHeader>(
      "INSERT INTO orders (table_id, status, notes) VALUES (?, 'pending', ?)",
      [table.id, notes || null]
    );
    const orderId = orderResult.insertId;

    // Open the table on its first order of a new session.
    // opened_at is stamped only when the table was closed; assignment order
    // matters in MySQL (opened_at is evaluated before is_open is updated).
    await conn.execute(
      "UPDATE `tables` SET opened_at = IF(is_open = 0, NOW(), opened_at), is_open = 1 WHERE id = ?",
      [table.id]
    );

    for (const item of items) {
      await conn.execute(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price, notes) VALUES (?, ?, ?, ?, ?)",
        [orderId, item.productId, item.quantity, priceMap[item.productId], item.notes || null]
      );
    }

    await conn.commit();
    return NextResponse.json({ orderId }, { status: 201 });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
