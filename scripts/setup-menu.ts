import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

const args = process.argv.slice(2);
const envFlag = args.indexOf("--env");
const envFile = envFlag !== -1 ? args[envFlag + 1] : ".env.local";
dotenv.config({ path: envFile });

const categories = [
  { id: 1, name: "Pizzas",   sort_order: 1 },
  { id: 2, name: "Comidas",  sort_order: 2 },
  { id: 3, name: "Bebidas",  sort_order: 3 },
  { id: 4, name: "Cervezas", sort_order: 4 },
  { id: 5, name: "Tragos",   sort_order: 5 },
];

const products = [
  // Pizzas
  { category_id: 1, name: "Pizza muzza",        price: 24000, sort_order: 1 },
  { category_id: 1, name: "Pizza fugazza",       price: 26000, sort_order: 2 },
  { category_id: 1, name: "Pizza napolitana",    price: 26000, sort_order: 3 },
  { category_id: 1, name: "Pizza jamón crudo",   price: 30000, sort_order: 4 },
  // Comidas
  { category_id: 2, name: "Hamburguesa con fritas", price: 18000, sort_order: 1 },
  { category_id: 2, name: "Lomito con fritas",      price: 18000, sort_order: 2 },
  { category_id: 2, name: "Pancho con fritas",      price: 14000, sort_order: 3 },
  { category_id: 2, name: "Fritas",                 price: 13000, sort_order: 4 },
  // Bebidas
  { category_id: 3, name: "Agua 500ml",          price: 5000, sort_order: 1 },
  { category_id: 3, name: "Agua con gas 500ml",  price: 5000, sort_order: 2 },
  { category_id: 3, name: "Coca-Cola 500ml",     price: 5000, sort_order: 3 },
  { category_id: 3, name: "Sprite 500ml",        price: 5000, sort_order: 4 },
  // Cervezas
  { category_id: 4, name: "Pinta", price: 6000, sort_order: 1 },
  { category_id: 4, name: "Lata",  price: 6000, sort_order: 2 },
  // Tragos
  { category_id: 5, name: "Fernet con Coca",  price: 7000, sort_order: 1 },
  { category_id: 5, name: "Gin tónica",       price: 7000, sort_order: 2 },
  { category_id: 5, name: "Aperol con soda",  price: 7000, sort_order: 3 },
  { category_id: 5, name: "Campari con soda", price: 7000, sort_order: 4 },
  { category_id: 5, name: "Mojito",           price: 9000, sort_order: 5 },
  { category_id: 5, name: "Gin con limón",    price: 9000, sort_order: 6 },
  { category_id: 5, name: "Gin con pomelo",   price: 9000, sort_order: 7 },
  { category_id: 5, name: "Gin con naranja",  price: 9000, sort_order: 8 },
  { category_id: 5, name: "Aperol Spritz",    price: 9000, sort_order: 9 },
];

async function setupMenu() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  console.log(`Setting up menu in ${process.env.DB_NAME}@${process.env.DB_HOST}...\n`);

  // Clear existing sample data (safe: no orders in fresh DBs)
  await db.execute("SET FOREIGN_KEY_CHECKS = 0");
  await db.execute("TRUNCATE TABLE products");
  await db.execute("TRUNCATE TABLE categories");
  await db.execute("SET FOREIGN_KEY_CHECKS = 1");

  // Insert categories
  for (const cat of categories) {
    await db.execute(
      "INSERT INTO categories (id, name, sort_order) VALUES (?, ?, ?)",
      [cat.id, cat.name, cat.sort_order]
    );
    console.log(`  ✓ Categoría: ${cat.name}`);
  }

  // Insert products
  console.log("");
  for (const p of products) {
    await db.execute(
      "INSERT INTO products (category_id, name, price, sort_order) VALUES (?, ?, ?, ?)",
      [p.category_id, p.name, p.price, p.sort_order]
    );
    console.log(`  ✓ ${p.name} — $${p.price.toLocaleString("es-AR")}`);
  }

  // Insert 20 tables
  console.log("");
  const { v4: uuidv4 } = await import("uuid");
  for (let i = 1; i <= 20; i++) {
    await db.execute(
      "INSERT IGNORE INTO `tables` (name, token) VALUES (?, ?)",
      [`Mesa ${i}`, uuidv4()]
    );
    console.log(`  ✓ Mesa ${i}`);
  }

  await db.end();
  console.log("\nDone.");
}

setupMenu().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
