"use client";

import { useEffect, useState } from "react";
import { CategoryWithProducts } from "@/types";
import { useCart } from "@/hooks/useCart";
import { ProductCard } from "@/components/menu/ProductCard";
import { Cart } from "@/components/menu/Cart";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle } from "lucide-react";

interface Props {
  tableId: number;
  tableName: string;
  tableToken: string;
}

export function MenuClient({ tableName, tableToken }: Props) {
  const [menu, setMenu] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const { items, total, count, addItem, updateQuantity, updateNotes, clear } = useCart();

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data: CategoryWithProducts[]) => {
        setMenu(data);
        if (data.length > 0) setActiveCategory(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(orderNotes: string) {
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableToken,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          notes: i.notes,
        })),
        notes: orderNotes,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      setOrderId(data.orderId);
      setConfirmed(true);
      clear();
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 gap-4">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h1 className="text-2xl font-bold">¡Pedido enviado!</h1>
        <p className="text-muted-foreground">
          Tu pedido #{orderId} fue recibido. En breve lo estamos preparando.
        </p>
        <button
          onClick={() => setConfirmed(false)}
          className="mt-4 text-primary underline text-sm"
        >
          Hacer otro pedido
        </button>
      </div>
    );
  }

  const currentCategory = menu.find((c) => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-primary">🍺 Pide</h1>
          <p className="text-xs text-muted-foreground">{tableName}</p>
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 pb-2 gap-2">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
              ))
            : menu.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat.id
                      ? "bg-primary text-white"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
        </div>
      </header>

      {/* Product list */}
      <main className="px-4 pb-32">
        {loading ? (
          <div className="space-y-4 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="pt-2">
            {currentCategory?.products.map((product) => {
              const cartItem = items.find((i) => i.product.id === product.id);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={cartItem?.quantity ?? 0}
                  onAdd={() => addItem(product)}
                  onRemove={() => updateQuantity(product.id, (cartItem?.quantity ?? 1) - 1)}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Cart */}
      <Cart
        items={items}
        total={total}
        count={count}
        onUpdateQuantity={updateQuantity}
        onUpdateNotes={updateNotes}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
