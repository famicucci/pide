import { notFound } from "next/navigation";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { SessionGate } from "./SessionGate";

interface TableRow extends RowDataPacket {
  id: number;
  name: string;
  token: string;
}

interface Props {
  params: Promise<{ token: string }>;
}

export default async function MesaPage({ params }: Props) {
  const { token } = await params;

  const [rows] = await db.execute<TableRow[]>(
    "SELECT id, name, token FROM `tables` WHERE token = ? AND active = 1 LIMIT 1",
    [token]
  );

  if (!rows.length) notFound();

  const table = rows[0];

  return <SessionGate tableId={table.id} tableName={table.name} tableToken={table.token} />;
}
