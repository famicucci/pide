"use client";

import { Order, OrderItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

interface Props {
  order: Order;
  onItemReady: (itemId: number) => void;
  onOrderReady: (orderId: number) => void;
}

function elapsed(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "ahora";
  if (mins === 1) return "1 min";
  return `${mins} min`;
}

export function OrderCard({ order, onItemReady, onOrderReady }: Props) {
  const allReady = order.items?.every((i) => i.status === "ready") ?? false;

  return (
    <div
      className={`rounded-xl border-2 p-4 space-y-3 bg-white ${
        allReady ? "border-green-500" : "border-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-bold text-lg">{order.table?.name}</span>
          <span className="ml-2 text-muted-foreground text-sm">#{order.id}</span>
        </div>
        <span className="text-muted-foreground text-sm">{elapsed(order.created_at)}</span>
      </div>

      {/* Order notes */}
      {order.notes && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          {order.notes}
        </p>
      )}

      {/* Items */}
      <div className="space-y-2">
        {order.items?.map((item: OrderItem) => (
          <div
            key={item.id}
            className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 ${
              item.status === "ready" ? "bg-green-50 border border-green-200" : "bg-muted"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{item.quantity}×</span>
                <span className="text-sm truncate">{item.product?.name}</span>
              </div>
              {item.notes && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.notes}</p>
              )}
            </div>
            {item.status === "ready" ? (
              <Button
                size="sm"
                disabled
                className="shrink-0 text-sm bg-green-100 text-green-700 border border-green-300 opacity-100 cursor-default"
              >
                Listo ✓
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-sm"
                onClick={() => onItemReady(item.id)}
              >
                Marcar listo
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Mark all ready */}
      {allReady && (
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={() => onOrderReady(order.id)}
        >
          <CheckCheck className="h-4 w-4 mr-2" />
          Pedido completo
        </Button>
      )}
    </div>
  );
}
