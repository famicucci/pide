"use client";

import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

interface Props {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function ProductCard({ product, quantity, onAdd, onRemove }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 py-4 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-base leading-snug">{product.name}</p>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{product.description}</p>
        )}
        <p className="text-base font-semibold text-primary mt-1">
          ${product.price.toLocaleString("es-AR")}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {quantity > 0 ? (
          <>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={onRemove}
              aria-label="Quitar uno"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-6 text-center font-semibold text-base">{quantity}</span>
          </>
        ) : null}
        <Button
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={onAdd}
          aria-label="Agregar"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
