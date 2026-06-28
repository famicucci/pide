import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { CategoryWithProducts, Product } from "@/types";

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  sort_order: number;
}

interface ProductRow extends RowDataPacket {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: string;
  available: number;
  sort_order: number;
}

export async function GET() {
  const [categories] = await db.execute<CategoryRow[]>(
    "SELECT id, name, sort_order FROM categories WHERE active = 1 ORDER BY sort_order ASC, name ASC"
  );

  const [products] = await db.execute<ProductRow[]>(
    "SELECT id, category_id, name, description, price, available, sort_order FROM products WHERE available = 1 ORDER BY sort_order ASC, name ASC"
  );

  const productsByCategory = products.reduce<Record<number, Product[]>>((acc, p) => {
    if (!acc[p.category_id]) acc[p.category_id] = [];
    acc[p.category_id].push({ ...p, price: Number(p.price), available: Boolean(p.available) });
    return acc;
  }, {});

  const menu: CategoryWithProducts[] = categories
    .map((c) => ({
      ...c,
      active: true,
      products: productsByCategory[c.id] ?? [],
    }))
    .filter((c) => c.products.length > 0);

  return NextResponse.json(menu);
}
