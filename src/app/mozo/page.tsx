"use client";

import { useCallback } from "react";
import { usePolling } from "@/hooks/usePolling";
import { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, ClipboardList, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En preparación",
  ready: "Listo para entregar",
  delivered: "Entregado",
};

function elapsed(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "ahora";
  if (mins === 1) return "1 min";
  return `${mins} min`;
}

export default function MozoPage() {
  const router = useRouter();
  const { data: orders, loading, refetch } = usePolling<Order[]>(
    "/api/orders?status=pending,in_progress,ready",
    { intervalMs: 8000 }
  );

  const handleDeliver = useCallback(
    async (orderId: number) => {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      });
      refetch();
    },
    [refetch]
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg">Mozo</span>
          {orders && orders.length > 0 && (
            <span className="bg-primary text-white text-xs font-bold rounded-full px-2 py-0.5">
              {orders.length}
            </span>
          )}
        </div>
        <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Orders list */}
      <main className="p-4 space-y-3 max-w-2xl mx-auto">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))
        ) : orders && orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
              {/* Order header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">{order.table?.name}</span>
                  <span className="text-muted-foreground text-sm">#{order.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{elapsed(order.created_at)}</span>
                  <Badge
                    variant={
                      order.status === "ready"
                        ? "ready"
                        : order.status === "in_progress"
                        ? "in_progress"
                        : "pending"
                    }
                  >
                    {STATUS_LABEL[order.status]}
                  </Badge>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span>
                      <span className="font-medium">{item.quantity}×</span> {item.product?.name}
                      {item.notes && (
                        <span className="text-muted-foreground text-xs ml-1">({item.notes})</span>
                      )}
                    </span>
                    <Badge
                      variant={item.status === "ready" ? "ready" : "pending"}
                      className="text-xs"
                    >
                      {item.status === "ready" ? "Listo" : "Prep."}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Order notes */}
              {order.notes && (
                <p className="text-xs text-muted-foreground italic">{order.notes}</p>
              )}

              {/* Deliver button */}
              {order.status === "ready" && (
                <Button
                  className="w-full"
                  onClick={() => handleDeliver(order.id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como entregado
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
            <ClipboardList className="h-10 w-10" />
            <p>Sin pedidos activos</p>
          </div>
        )}
      </main>
    </div>
  );
}
