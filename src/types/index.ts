export type UserRole = "admin" | "waiter" | "kitchen";

export type OrderStatus = "pending" | "in_progress" | "ready" | "delivered" | "cancelled";

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
