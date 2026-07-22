export type UserRole = "admin" | "waiter" | "kitchen" | "stock";

export type OrderStatus = "pending" | "ready" | "delivered" | "cancelled";

export type ItemStatus = "pending" | "ready";

export interface Table {
  id: number;
  name: string;
  token: string;
  active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  sort_order: number;
  active: boolean;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
  sort_order: number;
  category?: Category;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  notes: string | null;
  status: ItemStatus;
  product?: Product;
}

export interface Order {
  id: number;
  table_id: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  table?: Table;
  items?: OrderItem[];
}

export interface CategoryWithProducts extends Category {
  products: Product[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}

export interface OpenTable {
  id: number;
  name: string;
  total: number;
}

export interface StockCategory {
  id: number;
  name: string;
  sort_order: number;
  active: boolean;
}

export interface StockItem {
  id: number;
  category_id: number;
  category_name: string;
  brand: string | null;
  name: string;
  unit: string;
  current_quantity: number;
  minimum_low_season: number | null;
  minimum_high_season: number | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  active_minimum?: number | null;
  season?: "low" | "high";
  is_low_stock?: boolean;
  shortage?: number | null;
}

export interface StockMovement {
  id: number;
  stock_item_id: number;
  movement_type: "initial" | "adjustment";
  user_id: number;
  previous_quantity: number | null;
  new_quantity: number;
  difference: number;
  notes: string | null;
  created_at: string;
  item_name: string;
  item_brand: string | null;
  unit: string;
  user_name: string;
}
