"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, PackageOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/ui/logo";
import { SearchModeProvider } from "@/components/admin/search-mode";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/stock", label: "Stock", icon: PackageOpen },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  // Menú y Mesas quedan fuera de la navegación durante el MVP de stock.
];

function NavLinks({
  pathname,
  lowStockCount,
  onNavigate,
}: {
  pathname: string;
  lowStockCount: number;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b">
        <Logo className="text-2xl" />
        <p className="text-xs text-muted-foreground">Admin</p>
      </div>
      <nav className="flex-1 py-3 space-y-1 px-2">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.href === "/admin/stock" && lowStockCount > 0 && (
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                  {lowStockCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [searchMode, setSearchMode] = useState(false);
  const searchModeValue = useMemo(() => ({ searchMode, setSearchMode }), [searchMode]);

  useEffect(() => {
    fetch("/api/stock/alerts")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setLowStockCount(data?.count ?? 0))
      .catch(() => setLowStockCount(0));
  }, [pathname]);

  useEffect(() => {
    setSearchMode(false);
  }, [pathname]);

  return (
    <SearchModeProvider value={searchModeValue}>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 border-r bg-white flex-col shrink-0">
          <NavLinks pathname={pathname} lowStockCount={lowStockCount} />
        </aside>

        {/* Mobile top bar */}
        <div
          className={cn(
            "md:hidden fixed top-0 left-0 right-0 z-40 h-14 items-center gap-3 px-4 bg-white border-b shadow-sm",
            searchMode ? "hidden" : "flex"
          )}
        >
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <NavLinks
                pathname={pathname}
                lowStockCount={lowStockCount}
                onNavigate={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <Logo className="text-xl" />
        </div>

        {/* Main */}
        <main
          className={cn(
            "flex-1 min-w-0 bg-muted/30 min-h-screen md:pt-0",
            searchMode ? "pt-0" : "pt-14"
          )}
        >
          {children}
        </main>
      </div>
    </SearchModeProvider>
  );
}
