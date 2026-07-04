import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

const args = process.argv.slice(2);
const envFlag = args.indexOf("--env");
const envFile = envFlag !== -1 ? args[envFlag + 1] : ".env.local";

dotenv.config({ path: envFile });

const users = [
  { name: "Eliseo del Castillo", email: "eliseo@pide.local", password: "eliseo1234", role: "admin" },
  { name: "Diego Ramírez",       email: "diego@pide.local",  password: "diego1234",  role: "admin" },
  { name: "Francisco",           email: "francisco@pide.local", password: "francisco1234", role: "kitchen" },
  { name: "Javier",              email: "javier@pide.local", password: "javier1234", role: "kitchen" },
  { name: "Maike",               email: "maike@pide.local",  password: "maike1234",  role: "waiter" },
  { name: "Rocío",               email: "rocio@pide.local",  password: "rocio1234",  role: "waiter" },
];

async function createUsers() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  console.log(`Creating users in ${process.env.DB_NAME}@${process.env.DB_HOST}...\n`);

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    await db.execute(
      "INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [user.name, user.email, hash, user.role]
    );
    console.log(`  ✓ ${user.name} (${user.role}) — ${user.email} / ${user.password}`);
  }

  await db.end();
  console.log("\nDone.");
}

createUsers().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
