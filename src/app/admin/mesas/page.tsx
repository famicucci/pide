"use client";

import { useEffect, useState, useCallback } from "react";
import { Table } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, QrCode, Printer, RotateCcw, EyeOff, Eye } from "lucide-react";

export default function MesasPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [qrTable, setQrTable] = useState<Table | null>(null);
  const [creating, setCreating] = useState(false);

  const loadTables = useCallback(async () => {
    const res = await fetch("/api/tables");
    const data = await res.json();
    setTables(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadTables(); }, [loadTables]);

  async function createTable() {
    setCreating(true);
    await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setCreating(false);
    setCreateDialog(false);
    setNewName("");
    loadTables();
  }

  async function toggleTable(table: Table) {
    await fetch(`/api/tables/${table.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !table.active }),
    });
    loadTables();
  }

  async function resetTable(table: Table) {
    if (!confirm(`¿Cancelar todos los pedidos activos de ${table.name}?`)) return;
    await fetch(`/api/tables/${table.id}/reset`, { method: "POST" });
  }

  function printQR(table: Table) {
    const url = `/api/tables/${table.id}/qr`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR - ${table.name}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            img { width: 300px; height: 300px; }
            h2 { margin-top: 16px; font-size: 24px; }
            p { color: #666; font-size: 12px; margin-top: 8px; word-break: break-all; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <img src="${url}" alt="QR ${table.name}" />
          <h2>${table.name}</h2>
          <p>${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/mesa/${table.token}</p>
          <br/>
          <button onclick="window.print()">Imprimir</button>
        </body>
      </html>
    `);
    win.document.close();
  }

  if (loading) return <div className="p-4 sm:p-8 text-muted-foreground">Cargando...</div>;

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mesas</h1>
        <Button onClick={() => { setNewName(""); setCreateDialog(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nueva mesa
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`border rounded-xl bg-white p-4 space-y-3 ${!table.active ? "opacity-50" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">{table.name}</span>
              <Badge variant={table.active ? "default" : "secondary"}>
                {table.active ? "Activa" : "Inactiva"}
              </Badge>
            </div>

            {/* QR preview */}
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/tables/${table.id}/qr`}
                alt={`QR ${table.name}`}
                className="w-32 h-32"
              />
            </div>

            <p className="text-xs text-muted-foreground text-center truncate">
              /mesa/{table.token.slice(0, 8)}...
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setQrTable(table); }}
              >
                <QrCode className="h-4 w-4 mr-1" /> Ver QR
              </Button>
              <Button size="sm" variant="outline" onClick={() => printQR(table)}>
                <Printer className="h-4 w-4 mr-1" /> Imprimir
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toggleTable(table)}>
                {table.active ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {table.active ? "Desactivar" : "Activar"}
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => resetTable(table)}>
                <RotateCcw className="h-4 w-4 mr-1" /> Resetear
              </Button>
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <p className="text-muted-foreground col-span-3 text-center py-12">
            No hay mesas creadas todavía.
          </p>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva mesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Mesa 1, Barra, Terraza..."
              onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) createTable(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancelar</Button>
            <Button onClick={createTable} disabled={!newName.trim() || creating}>
              {creating ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR detail dialog */}
      <Dialog open={!!qrTable} onOpenChange={() => setQrTable(null)}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle>{qrTable?.name}</DialogTitle>
          </DialogHeader>
          {qrTable && (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/tables/${qrTable.id}/qr`}
                alt={`QR ${qrTable.name}`}
                className="w-64 h-64"
              />
              <p className="text-xs text-muted-foreground break-all px-4">
                {process.env.NEXT_PUBLIC_BASE_URL}/mesa/{qrTable.token}
              </p>
              <Button onClick={() => printQR(qrTable)}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir QR
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
