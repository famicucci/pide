"use client";

import { useEffect, useState, useCallback } from "react";
import { Category, Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, EyeOff, Eye, Trash2 } from "lucide-react";

interface ProductWithCategory extends Product {
  category_name: string;
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Category dialog
  const [catDialog, setCatDialog] = useState(false);
  const [catName, setCatName] = useState("");
  const [editCat, setEditCat] = useState<Category | null>(null);

  // Product dialog
  const [prodDialog, setProdDialog] = useState(false);
  const [editProd, setEditProd] = useState<ProductWithCategory | null>(null);
  const [prodForm, setProdForm] = useState({ name: "", description: "", price: "", category_id: "" });

  const loadData = useCallback(async () => {
    const [catRes, prodRes] = await Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]);
    setCategories(catRes);
    setProducts(prodRes);
    if (!activeCategory && catRes.length > 0) setActiveCategory(catRes[0].id);
    setLoading(false);
  }, [activeCategory]);

  useEffect(() => { loadData(); }, [loadData]);

  // Category CRUD
  async function saveCategory() {
    if (editCat) {
      await fetch(`/api/categories/${editCat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName }),
      });
    } else {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName }),
      });
    }
    setCatDialog(false);
    setCatName("");
    setEditCat(null);
    loadData();
  }

  async function toggleCategory(cat: Category) {
    await fetch(`/api/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !cat.active }),
    });
    loadData();
  }

  // Product CRUD
  function openProductDialog(prod?: ProductWithCategory) {
    if (prod) {
      setEditProd(prod);
      setProdForm({
        name: prod.name,
        description: prod.description ?? "",
        price: String(prod.price),
        category_id: String(prod.category_id),
      });
    } else {
      setEditProd(null);
      setProdForm({ name: "", description: "", price: "", category_id: String(activeCategory ?? "") });
    }
    setProdDialog(true);
  }

  async function saveProduct() {
    const payload = {
      name: prodForm.name,
      description: prodForm.description,
      price: Number(prodForm.price),
      category_id: Number(prodForm.category_id),
    };
    if (editProd) {
      await fetch(`/api/products/${editProd.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setProdDialog(false);
    loadData();
  }

  async function toggleProduct(prod: ProductWithCategory) {
    await fetch(`/api/products/${prod.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !prod.available }),
    });
    loadData();
  }

  const filteredProducts = products.filter((p) => p.category_id === activeCategory);

  if (loading) return <div className="p-4 sm:p-8 text-muted-foreground">Cargando...</div>;

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Menú</h1>
      </div>

      {/* Mobile: category tabs */}
      <div className="flex md:hidden overflow-x-auto gap-2 pb-3 mb-4 -mx-4 px-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.id ? "bg-primary text-white" : "bg-secondary text-secondary-foreground"
            } ${!cat.active ? "opacity-50" : ""}`}
          >
            {cat.name}
          </button>
        ))}
        <button
          onClick={() => { setEditCat(null); setCatName(""); setCatDialog(true); }}
          className="shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border border-dashed text-muted-foreground"
        >
          + Cat.
        </button>
      </div>

      <div className="flex gap-6">
        {/* Desktop: categories sidebar */}
        <div className="hidden md:block w-52 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Categorías</span>
            <button onClick={() => { setEditCat(null); setCatName(""); setCatDialog(true); }} className="p-1 rounded hover:bg-muted">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm ${
                  activeCategory === cat.id ? "bg-primary text-white" : "hover:bg-muted"
                } ${!cat.active ? "opacity-50" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="truncate flex-1">{cat.name}</span>
                <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setEditCat(cat); setCatName(cat.name); setCatDialog(true); }}>
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => toggleCategory(cat)}>
                    {cat.active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-muted-foreground">
              {categories.find((c) => c.id === activeCategory)?.name ?? ""}
            </span>
            <Button size="sm" onClick={() => openProductDialog()}>
              <Plus className="h-4 w-4 mr-1" /> Agregar
            </Button>
          </div>

          <div className="space-y-2">
            {filteredProducts.map((prod) => (
              <div key={prod.id} className={`border rounded-lg px-3 py-3 flex items-center justify-between gap-3 bg-white ${!prod.available ? "opacity-50" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{prod.name}</span>
                    {!prod.available && <Badge variant="secondary" className="text-xs">Oculto</Badge>}
                  </div>
                  {prod.description && <p className="text-xs text-muted-foreground truncate">{prod.description}</p>}
                  <span className="font-semibold text-primary text-sm">${Number(prod.price).toLocaleString("es-AR")}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openProductDialog(prod)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleProduct(prod)}>
                    {prod.available ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin productos en esta categoría.</p>
            )}
          </div>
        </div>
      </div>

      {/* Category dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCat ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Bebidas, Comidas..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>Cancelar</Button>
            <Button onClick={saveCategory} disabled={!catName.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product dialog */}
      <Dialog open={prodDialog} onOpenChange={setProdDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProd ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Categoría</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={prodForm.category_id}
                onChange={(e) => setProdForm((f) => ({ ...f, category_id: e.target.value }))}
              >
                {categories.filter((c) => c.active).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={prodForm.name} onChange={(e) => setProdForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={prodForm.description}
                onChange={(e) => setProdForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-1">
              <Label>Precio</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={prodForm.price}
                onChange={(e) => setProdForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProdDialog(false)}>Cancelar</Button>
            <Button onClick={saveProduct} disabled={!prodForm.name.trim() || !prodForm.price}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
