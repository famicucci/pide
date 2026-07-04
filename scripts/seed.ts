import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

if (process.env.NODE_ENV === "production") {
  console.error("❌ seed no puede ejecutarse en producción.");
  process.exit(1);
}

async function seed() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  console.log("Seeding database...");

  // Admin user
  const passwordHash = await bcrypt.hash("admin123", 10);
  await db.execute(
    "INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    ["Admin", "admin@pide.local", passwordHash, "admin"]
  );

  // Sample categories
  await db.execute(
    "INSERT IGNORE INTO categories (id, name, sort_order) VALUES (1, 'Bebidas', 1), (2, 'Comidas', 2), (3, 'Postres', 3)"
  );

  // Sample products
  await db.execute(`
    INSERT IGNORE INTO products (id, category_id, name, price, sort_order) VALUES
      (1, 1, 'Cerveza artesanal', 800.00, 1),
      (2, 1, 'Vino copa', 700.00, 2),
      (3, 1, 'Gaseosa', 400.00, 3),
      (4, 2, 'Picada', 1800.00, 1),
      (5, 2, 'Tostado', 900.00, 2),
      (6, 3, 'Brownie', 600.00, 1)
  `);

  // Sample tables
  const tableToken1 = uuidv4();
  const tableToken2 = uuidv4();
  await db.execute(
    "INSERT IGNORE INTO `tables` (id, name, token) VALUES (1, 'Mesa 1', ?), (2, 'Mesa 2', ?)",
    [tableToken1, tableToken2]
  );

  await db.end();

  console.log("✓ Seed complete.");
  console.log("  Admin login: admin@pide.local / admin123");
  console.log(`  Table 1 token: ${tableToken1}`);
  console.log(`  Table 2 token: ${tableToken2}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
