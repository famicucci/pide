import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireRole } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, TableProperties, Clock, Users } from "lucide-react";

interface StatsRow extends RowDataPacket {
  total_orders: number;
  pending_orders: number;
  open_tables: number;
  active_tables: number;
}

export default async function AdminPage() {
  const session = await requireRole("admin");
  if (!session) redirect("/login");

  const [rows] = await db.execute<StatsRow[]>(`
    SELECT
      (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) AS total_orders,
      (SELECT COUNT(*) FROM orders WHERE status IN ('pending','ready')) AS pending_orders,
      (SELECT COUNT(*) FROM \`tables\` WHERE is_open = 1) AS open_tables,
      (SELECT COUNT(*) FROM \`tables\` WHERE active = 1) AS active_tables
  `);

  const stats = rows[0];

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Users className="h-4 w-4" /> Mesas abiertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${stats.open_tables > 0 ? "text-green-600" : "text-muted-foreground"}`}>
              {stats.open_tables}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Pedidos hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total_orders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending_orders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <TableProperties className="h-4 w-4" /> Mesas activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.active_tables}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
