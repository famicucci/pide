"use client";

import { useCallback, useState } from "react";
import { usePolling } from "@/hooks/usePolling";
import { Order, OpenTable } from "@/types";
import { OrderCard } from "@/components/kitchen/OrderCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LogOut, UtensilsCrossed, LayoutGrid, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";

function TableCard({
  table,
  closingId,
  onClose,
}: {
  table: OpenTable;
  closingId: number | null;
  onClose: (id: number, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggleDetail() {
    if (!expanded && orders === null) {
      setLoading(true);
      const res = await fetch(`/api/orders?status=pending,ready&table_id=${table.id}`);
      const data = await res.json();
      setOrders(data);
      setLoading(false);
    }
    setExpanded((v) => !v);
  }

  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="p-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-lg">{table.name}</p>
          <p className="text-muted-foreground text-sm mt-0.5">
            Total:{" "}
            <span className="text-foreground font-semibold">
              ${table.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleDetail}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Ver detalle"
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          <Button
            onClick={() => onClose(table.id, table.name)}
            disabled={closingId === table.id}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {closingId === table.id ? "Cerrando..." : "Cerrar mesa"}
          </Button>
        </div>
      </div>

      {/* Detail */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 bg-muted/30 space-y-3">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-8 rounded" />
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-1">
              {orders.flatMap((order) =>
                (order.items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 text-sm py-1 border-b last:border-0">
                    <span className="flex-1">
                      <span className="font-medium">{item.quantity}×</span>{" "}
                      {item.product?.name}
                      {item.notes && (
                        <span className="text-muted-foreground text-xs ml-1">({item.notes})</span>
                      )}
                    </span>
                    <span className="font-medium shrink-0">
                      ${(item.unit_price * item.quantity).toLocaleString("es-AR")}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">Sin pedidos activos.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CocinaPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"pedidos" | "mesas">("pedidos");
  const [closingId, setClosingId] = useState<number | null>(null);

  const { data: orders, loading: loadingOrders, refetch: refetchOrders } = usePolling<Order[]>(
    "/api/orders?status=pending,ready",
    { intervalMs: 5000 }
  );

  const { data: openTables, loading: loadingTables, refetch: refetchTables } = usePolling<OpenTable[]>(
    "/api/tables/open",
    { intervalMs: 5000 }
  );

  const handleItemReady = useCallback(
    async (orderId: number, itemId: number) => {
      await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ready" }),
      });
      refetchOrders();
    },
    [refetchOrders]
  );

  const handleOrderReady = useCallback(
    async (orderId: number) => {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ready" }),
      });
      refetchOrders();
    },
    [refetchOrders]
  );

  const handleCloseTable = useCallback(
    async (tableId: number, tableName: string) => {
      if (!confirm(`¿Cerrar mesa "${tableName}"? Esto marcará todos los pedidos como entregados.`)) return;
      setClosingId(tableId);
      await fetch(`/api/tables/${tableId}/close`, { method: "POST" });
      setClosingId(null);
      refetchOrders();
      refetchTables();
    },
    [refetchOrders, refetchTables]
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const pendingCount = orders?.length ?? 0;
  const openTablesCount = openTables?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg">Barra / Cocina</span>
        </div>
        <button onClick={handleLogout} className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setTab("pedidos")}
          className={`flex items-center gap-2 px-5 py-3.5 text-base font-medium transition-colors ${
            tab === "pedidos"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          Pedidos
          {pendingCount > 0 && (
            <span className="bg-primary text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("mesas")}
          className={`flex items-center gap-2 px-5 py-3.5 text-base font-medium transition-colors ${
            tab === "mesas"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Mesas
          {openTablesCount > 0 && (
            <span className="bg-muted text-foreground text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
              {openTablesCount}
            </span>
          )}
        </button>
      </div>

      {/* Pedidos tab */}
      {tab === "pedidos" && (
        <main className="p-4 bg-muted/30 min-h-[calc(100vh-112px)]">
          {loadingOrders ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onItemReady={(itemId) => handleItemReady(order.id, itemId)}
                  onOrderReady={handleOrderReady}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
              <UtensilsCrossed className="h-10 w-10" />
              <p>Sin pedidos pendientes</p>
            </div>
          )}
        </main>
      )}

      {/* Mesas tab */}
      {tab === "mesas" && (
        <main className="p-4 max-w-2xl mx-auto space-y-3">
          {loadingTables ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : openTables && openTables.length > 0 ? (
            openTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                closingId={closingId}
                onClose={handleCloseTable}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
              <LayoutGrid className="h-10 w-10" />
              <p>No hay mesas con pedidos activos</p>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
