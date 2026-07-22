import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import * as dotenv from "dotenv";

const args = process.argv.slice(2);
const envFlag = args.indexOf("--env");
const envFile = envFlag !== -1 ? args[envFlag + 1] : ".env.local";
dotenv.config({ path: envFile });

const catalog = [
  {
    category: "Vermuts",
    items: [
      ["Lunfa", "Vermut Rosso", "botellas"],
      ["Lunfa", "Vermut Rosado", "botellas"],
      ["La Fuerza", "Vermut Blanco", "botellas"],
      ["La Fuerza", "Vermut Primavera", "botellas"],
      ["La Fuerza", "Vermut Rojo", "botellas"],
      ["Il Nero", "Vermut Rosso", "botellas"],
      ["Ramazzotti", "Vermut Rosado", "botellas"],
      ["Martini", "Vermut Rosso", "botellas"],
    ],
  },
  {
    category: "Gin",
    items: [
      ["Beefeater", "Gin London Dry", "botellas"],
      ["Beefeater", "Gin Pink", "botellas"],
      ["Beefeater", "Gin Blackberry", "botellas"],
      ["Beefeater", "Gin Orange", "botellas"],
      ["Bombay", "Gin", "botellas"],
      ["Der Schwarzer", "Gin London Dry", "botellas"],
      ["Der Schwarzer", "Gin London Dry Blue", "botellas"],
    ],
  },
  {
    category: "Destilados y aperitivos",
    items: [
      ["Absolut", "Pears", "botellas"],
      ["Absolut", "Mandarin", "botellas"],
      ["Absolut", "Apeach", "botellas"],
      ["Absolut", "Raspberry", "botellas"],
      ["Absolut", "Mango", "botellas"],
      ["Absolut", "Wildberrie", "botellas"],
      ["Smirnoff", "Clásico", "botellas"],
      ["Smirnoff", "Manzana", "botellas"],
      ["Smirnoff", "Raspberry", "botellas"],
      ["Wyborowa", "Clásico", "botellas"],
      ["Wyborowa", "Raspberry", "botellas"],
      ["Jack Daniel's", "Whisky", "botellas"],
      ["Jameson", "Whisky", "botellas"],
      ["JW Black Label", "Whisky", "botellas"],
      ["Campari", "Campari", "botellas"],
      ["Varios", "Ron blanco", "botellas"],
      ["Varios", "Ron dorado", "botellas"],
      ["Malibú", "Malibú", "botellas"],
      ["Velho Barreiro", "Cachaça", "botellas"],
      ["Jägermeister", "Jäger", "botellas"],
      ["Branca", "Fernet Branca", "botellas"],
      ["Buhero", "Fernet Buhero", "botellas"],
      ["Gancia", "Gancia", "botellas"],
      ["Aperol", "Aperol", "botellas"],
      ["Amarula", "Amarula", "botellas"],
      ["Baileys", "Baileys", "botellas"],
    ],
  },
  {
    category: "Vinos y espumantes",
    items: [
      ["El Enemigo", "Alma Negra", "botellas"],
      ["Animal", "Malbec orgánico", "botellas"],
      ["D.V. Catena", "Malbec", "botellas"],
      ["Saint Felicien", "Malbec", "botellas"],
      ["Santa Julia", "Chenin Dulce", "botellas"],
      ["Santa Julia", "Rosé lata", "latas"],
      ["Baron B", "Champagne Brut Nature", "botellas"],
      ["Nieto Senetiner", "Champagne Brut Nature", "botellas"],
      ["Mumm", "Champagne Extra Brut", "botellas"],
    ],
  },
  {
    category: "Frutas y mixers",
    items: [
      [null, "Frutos rojos", "kg"],
      [null, "Frutilla", "kg"],
      [null, "Limón", "kg"],
      [null, "Pomelo", "kg"],
      [null, "Naranja", "kg"],
      [null, "Lima", "kg"],
      [null, "Jengibre", "kg"],
      [null, "Menta", "atados"],
      [null, "Azúcar", "kg"],
      [null, "Azúcar sobres", "paquetes"],
      [null, "Maní", "paquetes"],
      [null, "Edulcorante", "paquetes"],
    ],
  },
  {
    category: "Insumos",
    items: [
      [null, "Lata frutilla", "latas"],
      [null, "Lata ananá", "latas"],
      [null, "Lata durazno", "latas"],
      [null, "Papel comandera", "rollos"],
      [null, "Guantes", "cajas"],
      [null, "Sorbetes", "paquetes"],
      [null, "Fajinador", "unidades"],
      [null, "Servilletas", "paquetes"],
      [null, "Bolsas consorcio", "paquetes"],
      [null, "Hielo", "bolsas"],
      [null, "Sobrecitos mayonesa", "unidades"],
      [null, "Sobrecitos ketchup", "unidades"],
      [null, "Sobrecitos mostaza", "unidades"],
    ],
  },
] as const;

interface IdRow extends RowDataPacket {
  id: number;
}

const unitCodes: Record<string, string> = {
  unidades: "unit",
  botellas: "bottle",
  latas: "can",
  kg: "kilogram",
  atados: "bundle",
  paquetes: "package",
  rollos: "roll",
  cajas: "box",
  bolsas: "bag",
  litros: "liter",
};

async function seedStock() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const [users] = await db.execute<IdRow[]>(
    "SELECT id FROM users WHERE email = 'javier@pide.local' LIMIT 1"
  );
  if (!users[0]) {
    throw new Error("Primero ejecutá npm run create-users para crear a Javier.");
  }

  console.log("Cargando catálogo de stock...");
  let categoryOrder = 0;
  for (const group of catalog) {
    categoryOrder += 1;
    await db.execute(
      `INSERT INTO stock_categories (name, sort_order)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order), active = 1`,
      [group.category, categoryOrder]
    );
    const [categoryRows] = await db.execute<IdRow[]>(
      "SELECT id FROM stock_categories WHERE name = ? LIMIT 1",
      [group.category]
    );
    const categoryId = categoryRows[0].id;

    let itemOrder = 0;
    for (const [brand, name, unit] of group.items) {
      itemOrder += 1;
      const unitCode = unitCodes[unit] ?? "unit";
      const [existing] = await db.execute<IdRow[]>(
        "SELECT id FROM stock_items WHERE category_id = ? AND brand <=> ? AND name = ? LIMIT 1",
        [categoryId, brand, name]
      );
      if (existing[0]) continue;

      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO stock_items
          (category_id, brand, name, unit, current_quantity, sort_order)
         VALUES (?, ?, ?, ?, 0, ?)`,
        [categoryId, brand, name, unitCode, itemOrder]
      );
      await db.execute(
        `INSERT INTO stock_movements
          (stock_item_id, movement_type, user_id, previous_quantity, new_quantity, difference)
         VALUES (?, 'initial', ?, NULL, 0, 0)`,
        [result.insertId, users[0].id]
      );
      console.log(`  ✓ ${brand ? `${brand} · ` : ""}${name}`);
    }
  }

  await db.end();
  console.log("Catálogo de stock listo.");
}

seedStock().catch((error) => {
  console.error("No se pudo cargar el catálogo:", error.message);
  process.exit(1);
});
