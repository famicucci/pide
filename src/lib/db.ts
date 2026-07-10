import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z",
  // Keep connections alive and discard stale ones so ETIMEDOUT on
  // idle connections (common with remote shared hosting) is avoided.
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// Force UTC timezone on every new connection so timestamps
// are always returned in UTC regardless of the DB server's local timezone.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pool as any).pool.on("connection", (conn: any) => {
  conn.query("SET time_zone = '+00:00'");
});

export default pool;
