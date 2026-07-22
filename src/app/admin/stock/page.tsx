"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import { AdminStockNav } from "@/components/stock/AdminStockNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { StockCategory, StockItem } from "@/types";

interface ItemResponse {
  season: "low" | "high";
  items: StockItem[];
}

interface ItemForm {
  category_id: string;
  brand: string;
  name: string;
  unit: string;
  current_quantity: string;
  minimum_low_season: string;
  minimum_high_season: string;
}

const emptyForm: ItemForm = {
  category_id: "",
  brand: "",
  name: "",
  unit: "unidades",
  current_quantity: "0",
  minimum_low_season: "",
  minimum_high_season: "",
};

export default function AdminStockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<StockCategory[]>([]);
  const [season, setSeason] = useState<"low" | "high">("low");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "low" | "inactive">("all");
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyForm);
  const [savingItem, setSavingItem] = useState(false);
  const [formError, setFormError] = useState("");
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [itemsRes, categoriesRes] = await Promise.all([
      fetch("/api/stock/items?include_inactive=1"),
      fetch("/api/stock/categories"),
    ]);
    if (itemsRes.ok) {
      const payload = (await itemsRes.json()) as ItemResponse;
      setItems(payload.items);
      setSeason(payload.season);
    }
    if (categoriesRes.ok) setCategories(await categoriesRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return items.filter((item) => {
      const matchesSearch =
        !term ||
        `${item.brand ?? ""} ${item.name} ${item.category_name}`
          .toLocaleLowerCase("es")
          .includes(term);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "low" && item.active && item.is_low_stock) ||
        (statusFilter === "inactive" && !item.active);
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const activeCount = items.filter((item) => item.active).length;
  const lowCount = items.filter((item) => item.active && item.is_low_stock).length;

  function openNewItem() {
    setEditingItem(null);
    setItemForm({
      ...emptyForm,
      category_id: String(categories.find((category) => category.active)?.id ?? ""),
    });
    setFormError("");
    setItemDialog(true);
  }

  function openEditItem(item: StockItem) {
    setEditingItem(item);
    setItemForm({
      category_id: String(item.category_id),
      brand: item.brand ?? "",
      name: item.name,
      unit: item.unit,
      current_quantity: String(item.current_quantity),
      minimum_low_season: item.minimum_low_season === null ? "" : String(item.minimum_low_season),
      minimum_high_season:
        item.minimum_high_season === null ? "" : String(item.minimum_high_season),
    });
    setFormError("");
    setItemDialog(true);
  }

  async function saveItem() {
    setSavingItem(true);
    setFormError("");
    const payload = {
      category_id: Number(itemForm.category_id),
      brand: itemForm.brand.trim() || null,
      name: itemForm.name.trim(),
      unit: itemForm.unit.trim(),
      minimum_low_season:
        itemForm.minimum_low_season === "" ? null : Number(itemForm.minimum_low_season),
      minimum_high_season:
        itemForm.minimum_high_season === "" ? null : Number(itemForm.minimum_high_season),
      ...(editingItem ? {} : { current_quantity: Number(itemForm.current_quantity) }),
    };

    const response = await fetch(
      editingItem ? `/api/stock/items/${editingItem.id}` : "/api/stock/items",
      {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    setSavingItem(false);

    if (!response.ok) {
      setFormError("No se pudo guardar. Revisá los campos e intentá nuevamente.");
      return;
    }
    setItemDialog(false);
    load();
  }

  async function toggleItem(item: StockItem) {
    await fetch(`/api/stock/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    load();
  }

  async function saveCategory() {
    setSavingCategory(true);
    const response = await fetch("/api/stock/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: categoryName }),
    });
    setSavingCategory(false);
    if (!response.ok) return;
    setCategoryDialog(false);
    setCategoryName("");
    load();
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Gestión de inventario</p>
            <h1 className="text-2xl font-bold">Stock</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1 sm:flex-none">
              <Link href="/stock">Actualizar stock</Link>
            </Button>
            <Button onClick={openNewItem} className="flex-1 sm:flex-none">
              <PackagePlus className="mr-2 h-4 w-4" />
              Nuevo artículo
            </Button>
          </div>
        </div>

        <AdminStockNav />

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs text-muted-foreground">Artículos activos</p>
            <p className="mt-1 text-2xl font-bold">{activeCount}</p>
          </div>
          <Link
            href="/admin/stock/alertas"
            className={`rounded-2xl border p-4 ${
              lowCount > 0 ? "border-amber-300 bg-amber-50" : "bg-white"
            }`}
          >
            <p className="text-xs text-muted-foreground">Stock bajo</p>
            <p className="mt-1 text-2xl font-bold">{lowCount}</p>
          </Link>
          <div className="col-span-2 rounded-2xl border bg-white p-4 sm:col-span-1">
            <p className="text-xs text-muted-foreground">Temporada de hoy</p>
            <p className="mt-1 text-lg font-bold capitalize">{season === "high" ? "Alta" : "Baja"}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar artículo, marca o categoría"
              className="h-11 bg-white pl-9"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
            {(["all", "low", "inactive"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium ${
                  statusFilter === filter ? "bg-foreground text-background" : "bg-white"
                }`}
              >
                {filter === "all" ? "Todos" : filter === "low" ? "Stock bajo" : "Inactivos"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">
            {filteredItems.length} artículos
          </p>
          <Button variant="ghost" size="sm" onClick={() => setCategoryDialog(true)}>
            <Plus className="mr-1 h-4 w-4" /> Categoría
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">
            No hay artículos para mostrar.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className={`rounded-2xl border bg-white p-4 ${
                  !item.active ? "opacity-55" : item.is_low_stock ? "border-amber-300" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {item.brand && (
                      <p className="truncate text-xs font-semibold uppercase tracking-wide text-primary">
                        {item.brand}
                      </p>
                    )}
                    <h2 className="font-bold">{item.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {item.category_name} · {item.unit}
                    </p>
                  </div>
                  {item.is_low_stock && item.active && (
                    <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                      <TriangleAlert className="mr-1 h-3 w-3" /> Bajo
                    </Badge>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-muted/60 p-2">
                    <p className="text-[11px] text-muted-foreground">Actual</p>
                    <p className="font-bold">{item.current_quantity}</p>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-2">
                    <p className="text-[11px] text-muted-foreground">Mín. baja</p>
                    <p className="font-bold">{item.minimum_low_season ?? "—"}</p>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-2">
                    <p className="text-[11px] text-muted-foreground">Mín. alta</p>
                    <p className="font-bold">{item.minimum_high_season ?? "—"}</p>
                  </div>
                </div>

                <div className="mt-3 flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditItem(item)}>
                    <Pencil className="mr-1 h-4 w-4" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleItem(item)}>
                    {item.active ? (
                      <><EyeOff className="mr-1 h-4 w-4" /> Desactivar</>
                    ) : (
                      <><Eye className="mr-1 h-4 w-4" /> Activar</>
                    )}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar artículo" : "Nuevo artículo"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <Label>Categoría</Label>
              <select
                value={itemForm.category_id}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, category_id: event.target.value }))
                }
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Seleccionar</option>
                {categories.filter((category) => category.active).map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <Label>Marca (opcional)</Label>
              <Input
                value={itemForm.brand}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, brand: event.target.value }))
                }
              />
            </label>
            <label className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={itemForm.name}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label className="space-y-1">
              <Label>Unidad</Label>
              <Input
                list="stock-units"
                value={itemForm.unit}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, unit: event.target.value }))
                }
              />
              <datalist id="stock-units">
                <option value="unidades" />
                <option value="botellas" />
                <option value="latas" />
                <option value="kg" />
                <option value="litros" />
                <option value="paquetes" />
              </datalist>
            </label>
            {!editingItem && (
              <label className="space-y-1">
                <Label>Stock inicial</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={itemForm.current_quantity}
                  onChange={(event) =>
                    setItemForm((current) => ({
                      ...current,
                      current_quantity: event.target.value,
                    }))
                  }
                />
              </label>
            )}
            <label className="space-y-1">
              <Label>Mínimo temporada baja</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="Sin alerta"
                value={itemForm.minimum_low_season}
                onChange={(event) =>
                  setItemForm((current) => ({
                    ...current,
                    minimum_low_season: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-1">
              <Label>Mínimo temporada alta</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="Sin alerta"
                value={itemForm.minimum_high_season}
                onChange={(event) =>
                  setItemForm((current) => ({
                    ...current,
                    minimum_high_season: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          {formError && <p className="text-sm font-medium text-destructive">{formError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog(false)}>Cancelar</Button>
            <Button
              onClick={saveItem}
              disabled={
                savingItem ||
                !itemForm.category_id ||
                !itemForm.name.trim() ||
                !itemForm.unit.trim()
              }
            >
              {savingItem ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
          </DialogHeader>
          <label className="space-y-1">
            <Label>Nombre</Label>
            <Input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Bebidas, Frutas, Limpieza..."
            />
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog(false)}>Cancelar</Button>
            <Button
              onClick={saveCategory}
              disabled={savingCategory || !categoryName.trim()}
            >
              {savingCategory ? "Guardando..." : "Crear categoría"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
