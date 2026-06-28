"use client";

import { useCallback } from "react";
import { usePolling } from "@/hooks/usePolling";
import { Order } from "@/types";
import { OrderCard } from "@/components/kitchen/OrderCard";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CocinaPage() {
  const router = useRouter();
  const { data: orders, loading, refetch } = usePolling<Order[]>(
    "/api/orders?status=pending,in_progress",
    { intervalMs: 5000 }
  );

  const handleItemReady = useCallback(
    async (orderId: number, itemId: number) => {
      await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ready" }),
      });
      refetch();
    },
    [refetch]
  );

  const handleOrderReady = useCallback(
    async (orderId: number) => {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ready" }),
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
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-yellow-400" />
          <span className="font-bold text-lg">Cocina</span>
          {orders && (
            <span className="bg-yellow-400 text-black text-xs font-bold rounded-full px-2 py-0.5">
              {orders.length}
            </span>
          )}
        </div>
        <button onClick={handleLogout} className="text-zinc-400 hover:text-white">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Orders grid */}
      <main className="p-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 bg-zinc-800 rounded-xl" />
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
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-2">
            <UtensilsCrossed className="h-10 w-10" />
            <p>Sin pedidos pendientes</p>
          </div>
        )}
      </main>
    </div>
  );
}
