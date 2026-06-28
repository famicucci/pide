"use client";

import { useState } from "react";
import { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Plus, Minus, X, ChevronUp } from "lucide-react";

interface Props {
  items: CartItem[];
  total: number;
  count: number;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onUpdateNotes: (productId: number, notes: string) => void;
  onSubmit: (orderNotes: string) => Promise<void>;
  submitting: boolean;
}

export function Cart({ items, total, count, onUpdateQuantity, onUpdateNotes, onSubmit, submitting }: Props) {
  const [open, setOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");

  if (count === 0) return null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Cart sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "80vh" }}
      >
        <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 80px)" }}>
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-lg">Tu pedido</h2>
            <button onClick={() => setOpen(false)} className="p-1">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium flex-1">{item.product.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="h-7 w-7 rounded-full border flex items-center justify-center"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="h-7 w-7 rounded-full border flex items-center justify-center"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-primary w-20 text-right">
                    ${(item.product.price * item.quantity).toLocaleString("es-AR")}
                  </span>
                </div>
                <Textarea
                  placeholder="Aclaraciones (sin sal, sin cebolla...)"
                  value={item.notes}
                  onChange={(e) => onUpdateNotes(item.product.id, e.target.value)}
                  className="text-xs min-h-[40px] resize-none"
                  rows={1}
                />
              </div>
            ))}
          </div>

          <div className="px-4 pb-2">
            <Textarea
              placeholder="Comentarios del pedido (opcional)"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
              rows={2}
            />
          </div>
        </div>

        <div className="p-4 border-t bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-lg text-primary">
              ${total.toLocaleString("es-AR")}
            </span>
          </div>
          <Button
            className="w-full h-12 text-base"
            onClick={() => onSubmit(orderNotes)}
            disabled={submitting}
          >
            {submitting ? "Enviando..." : "Enviar pedido"}
          </Button>
        </div>
      </div>

      {/* Sticky cart button */}
      <div className="fixed bottom-4 left-4 right-4 z-30">
        <Button
          className="w-full h-14 text-base shadow-lg flex items-center justify-between px-5"
          onClick={() => setOpen(true)}
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="bg-white text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {count}
            </span>
          </span>
          <span>Ver pedido</span>
          <span className="font-bold">${total.toLocaleString("es-AR")}</span>
        </Button>
      </div>
    </>
  );
}
