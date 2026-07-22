"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/stock", label: "Artículos", exact: true },
  { href: "/admin/stock/alertas", label: "Alertas" },
  { href: "/admin/stock/historial", label: "Historial" },
  { href: "/admin/stock/temporadas", label: "Temporadas" },
];

export function AdminStockNav() {
  const pathname = usePathname();

  return (
    <nav
      className="scrollbar-hide flex items-center gap-2 overflow-x-auto"
      aria-label="Secciones de stock"
    >
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-white text-muted-foreground hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
