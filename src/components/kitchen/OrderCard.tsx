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
      className={`rounded-xl border-2 p-4 space-y-3 ${
        allReady ? "border-green-400 bg-green-950/30" : "border-zinc-700 bg-zinc-900"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-white font-bold text-lg">{order.table?.name}</span>
          <span className="ml-2 text-zinc-400 text-sm">#{order.id}</span>
        </div>
        <span className="text-zinc-400 text-sm">{elapsed(order.created_at)}</span>
      </div>

      {/* Order notes */}
      {order.notes && (
        <p className="text-xs text-yellow-300 bg-yellow-900/30 rounded px-2 py-1">
          {order.notes}
        </p>
      )}

      {/* Items */}
      <div className="space-y-2">
        {order.items?.map((item: OrderItem) => (
          <div
            key={item.id}
            className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 ${
              item.status === "ready" ? "bg-green-900/40" : "bg-zinc-800"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">{item.quantity}×</span>
                <span className="text-white text-sm truncate">{item.product?.name}</span>
              </div>
              {item.notes && (
                <p className="text-xs text-zinc-400 mt-0.5 truncate">{item.notes}</p>
              )}
            </div>
            {item.status === "ready" ? (
              <Badge variant="ready" className="shrink-0">Listo</Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 h-7 text-xs border-zinc-600 text-white hover:bg-zinc-700"
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
