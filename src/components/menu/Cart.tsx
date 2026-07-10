"use client";

import { useState, useEffect } from "react";
import { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Plus, Minus, X, MessageSquare, CheckCircle2 } from "lucide-react";

interface Props {
  items: CartItem[];
  total: number;
  count: number;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onUpdateNotes: (productId: number, notes: string) => void;
  onSubmit: (orderNotes: string) => Promise<void>;
  submitting: boolean;
}

function CartItemRow({
  item,
  onUpdateQuantity,
  onUpdateNotes,
}: {
  item: CartItem;
  onUpdateQuantity: (id: number, qty: number) => void;
  onUpdateNotes: (id: number, notes: string) => void;
}) {
  const [expanded, setExpanded] = useState(!!item.notes);
  const hasNote = item.notes.trim().length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-medium flex-1 leading-snug">{item.product.name}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
              hasNote ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Agregar aclaración"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
            className="h-9 w-9 rounded-full border flex items-center justify-center"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center text-base font-semibold">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
            className="h-9 w-9 rounded-full border flex items-center justify-center"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      {expanded && (
        <Textarea
          autoFocus
          placeholder="Aclaraciones (sin sal, sin cebolla...)"
          value={item.notes}
          onChange={(e) => onUpdateNotes(item.product.id, e.target.value)}
          className="text-sm min-h-[48px] resize-none"
          rows={1}
        />
      )}
    </div>
  );
}

export function Cart({ items, total, count, onUpdateQuantity, onUpdateNotes, onSubmit, submitting }: Props) {
  const [open, setOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [confirming, setConfirming] = useState(false);

  // Lock body scroll when confirmation modal is open
  useEffect(() => {
    if (confirming) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [confirming]);

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
            <h2 className="font-semibold text-xl">Tu pedido</h2>
            <button onClick={() => setOpen(false)} className="p-2 -mr-2">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {items.map((item) => (
              <CartItemRow
                key={item.product.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateNotes={onUpdateNotes}
              />
            ))}
          </div>

          <div className="px-4 pb-2">
            <Textarea
              placeholder="Comentarios generales del pedido (opcional)"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="text-sm min-h-[56px] resize-none"
              rows={2}
            />
          </div>
        </div>

        <div className="p-4 border-t bg-white">
          <Button
            className="w-full h-12 text-base"
            onClick={() => setConfirming(true)}
            disabled={submitting}
          >
            {submitting ? "Enviando..." : "Enviar pedido"}
          </Button>
        </div>
      </div>

      {/* Confirm modal */}
      {confirming && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirming(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="bg-primary/10 rounded-full p-3">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">¿Confirmás el pedido?</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Una vez enviado, el pedido va directo a la barra.
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-xl px-4 py-3 space-y-1.5">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{item.quantity}×</span>{" "}
                    {item.product.name}
                    {item.notes && <span className="italic"> ({item.notes})</span>}
                  </span>
                </div>
              ))}
              {orderNotes && (
                <p className="text-xs text-muted-foreground italic border-t pt-1.5 mt-1">
                  "{orderNotes}"
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirming(false)}
                disabled={submitting}
              >
                Revisar
              </Button>
              <Button
                className="flex-1"
                disabled={submitting}
                onClick={async () => {
                  await onSubmit(orderNotes);
                  setConfirming(false);
                }}
              >
                {submitting ? "Enviando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
          <span />
        </Button>
      </div>
    </>
  );
}
