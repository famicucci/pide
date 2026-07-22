import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const statements = [
  `CREATE TABLE IF NOT EXISTS \`tables\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`name\` VARCHAR(50) NOT NULL,
    \`token\` VARCHAR(64) NOT NULL UNIQUE,
    \`active\` TINYINT(1) NOT NULL DEFAULT 1,
    \`is_open\` TINYINT(1) NOT NULL DEFAULT 0,
    \`opened_at\` TIMESTAMP NULL DEFAULT NULL,
    \`session_key\` VARCHAR(100) NULL DEFAULT NULL,
    \`session_id\` VARCHAR(36) NULL DEFAULT NULL,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Add new columns to existing tables (idempotent)
  `ALTER TABLE \`tables\` ADD COLUMN IF NOT EXISTS \`is_open\` TINYINT(1) NOT NULL DEFAULT 0`,
  `ALTER TABLE \`tables\` ADD COLUMN IF NOT EXISTS \`opened_at\` TIMESTAMP NULL DEFAULT NULL`,
  `ALTER TABLE \`tables\` ADD COLUMN IF NOT EXISTS \`session_key\` VARCHAR(100) NULL DEFAULT NULL`,
  `ALTER TABLE \`tables\` ADD COLUMN IF NOT EXISTS \`session_id\` VARCHAR(36) NULL DEFAULT NULL`,

  `CREATE TABLE IF NOT EXISTS \`categories\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`name\` VARCHAR(100) NOT NULL,
    \`sort_order\` INT NOT NULL DEFAULT 0,
    \`active\` TINYINT(1) NOT NULL DEFAULT 1
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`products\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`category_id\` INT UNSIGNED NOT NULL,
    \`name\` VARCHAR(150) NOT NULL,
    \`description\` TEXT,
    \`price\` DECIMAL(10,2) NOT NULL,
    \`available\` TINYINT(1) NOT NULL DEFAULT 1,
    \`sort_order\` INT NOT NULL DEFAULT 0,
    FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`orders\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`table_id\` INT UNSIGNED NOT NULL,
    \`status\` ENUM('pending','in_progress','ready','delivered','cancelled') NOT NULL DEFAULT 'pending',
    \`notes\` TEXT,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (\`table_id\`) REFERENCES \`tables\`(\`id\`) ON DELETE RESTRICT,
    INDEX \`idx_orders_status_created\` (\`status\`, \`created_at\`),
    INDEX \`idx_orders_table_status\` (\`table_id\`, \`status\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`order_items\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`order_id\` INT UNSIGNED NOT NULL,
    \`product_id\` INT UNSIGNED NOT NULL,
    \`quantity\` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    \`unit_price\` DECIMAL(10,2) NOT NULL,
    \`notes\` TEXT,
    \`status\` ENUM('pending','ready') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE,
    FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE RESTRICT,
    INDEX \`idx_order_items_order\` (\`order_id\`),
    INDEX \`idx_order_items_status\` (\`status\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`name\` VARCHAR(100) NOT NULL,
    \`email\` VARCHAR(150) NOT NULL UNIQUE,
    \`password_hash\` VARCHAR(255) NOT NULL,
    \`role\` ENUM('admin','waiter','kitchen','stock') NOT NULL,
    \`active\` TINYINT(1) NOT NULL DEFAULT 1
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `ALTER TABLE \`users\`
    MODIFY COLUMN \`role\` ENUM('admin','waiter','kitchen','stock') NOT NULL`,

  `CREATE TABLE IF NOT EXISTS \`stock_categories\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`name\` VARCHAR(100) NOT NULL,
    \`sort_order\` INT NOT NULL DEFAULT 0,
    \`active\` TINYINT(1) NOT NULL DEFAULT 1,
    UNIQUE KEY \`uq_stock_categories_name\` (\`name\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`stock_items\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`category_id\` INT UNSIGNED NOT NULL,
    \`brand\` VARCHAR(100) NULL,
    \`name\` VARCHAR(150) NOT NULL,
    \`unit\` VARCHAR(50) NOT NULL,
    \`current_quantity\` DECIMAL(10,2) NOT NULL DEFAULT 0,
    \`minimum_low_season\` DECIMAL(10,2) NULL,
    \`minimum_high_season\` DECIMAL(10,2) NULL,
    \`sort_order\` INT NOT NULL DEFAULT 0,
    \`active\` TINYINT(1) NOT NULL DEFAULT 1,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (\`category_id\`) REFERENCES \`stock_categories\`(\`id\`) ON DELETE RESTRICT,
    INDEX \`idx_stock_items_category_active\` (\`category_id\`, \`active\`),
    INDEX \`idx_stock_items_name_brand\` (\`name\`, \`brand\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `UPDATE \`stock_items\`
   SET \`unit\` = CASE \`unit\`
     WHEN 'unidades' THEN 'unit'
     WHEN 'unidad' THEN 'unit'
     WHEN 'botellas' THEN 'bottle'
     WHEN 'botella' THEN 'bottle'
     WHEN 'latas' THEN 'can'
     WHEN 'lata' THEN 'can'
     WHEN 'kg' THEN 'kilogram'
     WHEN 'gramos' THEN 'gram'
     WHEN 'litros' THEN 'liter'
     WHEN 'ml' THEN 'milliliter'
     WHEN 'paquetes' THEN 'package'
     WHEN 'cajas' THEN 'box'
     WHEN 'bolsas' THEN 'bag'
     WHEN 'rollos' THEN 'roll'
     WHEN 'atados' THEN 'bundle'
     ELSE \`unit\`
   END
   WHERE \`unit\` IN (
     'unidades','unidad','botellas','botella','latas','lata','kg','gramos',
     'litros','ml','paquetes','cajas','bolsas','rollos','atados'
   )`,

  `CREATE TABLE IF NOT EXISTS \`stock_movements\` (
    \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`stock_item_id\` INT UNSIGNED NOT NULL,
    \`movement_type\` ENUM('initial','adjustment') NOT NULL,
    \`user_id\` INT UNSIGNED NOT NULL,
    \`previous_quantity\` DECIMAL(10,2) NULL,
    \`new_quantity\` DECIMAL(10,2) NOT NULL,
    \`difference\` DECIMAL(10,2) NOT NULL,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (\`stock_item_id\`) REFERENCES \`stock_items\`(\`id\`) ON DELETE RESTRICT,
    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT,
    INDEX \`idx_stock_movements_item_created\` (\`stock_item_id\`, \`created_at\`),
    INDEX \`idx_stock_movements_user_created\` (\`user_id\`, \`created_at\`),
    INDEX \`idx_stock_movements_created\` (\`created_at\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `ALTER TABLE \`stock_movements\`
    DROP COLUMN IF EXISTS \`notes\``,

  `CREATE TABLE IF NOT EXISTS \`stock_high_season_dates\` (
    \`season_date\` DATE PRIMARY KEY,
    \`created_by\` INT UNSIGNED NOT NULL,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

async function migrate() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  console.log("Running migrations...");

  for (const sql of statements) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS `(\w+)`/)?.[1]
      ?? sql.match(/ALTER TABLE `(\w+)`/)?.[1]
      ?? "?";
    await db.execute(sql);
    console.log(`  ✓ ${tableName}`);
  }

  await db.end();
  console.log("Migration complete.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
