import { authClient } from '@/lib/auth-client';
import { createFileRoute, Link, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Settings,
  Menu,
  Search
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useSearchStore } from '@/state/search'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data || session.data.user.role != "ADMIN") {
      redirect({
        to: "/",
        throw: true,
      });
    }
    return { session };
  },
})

function RouteComponent() {
  return (
    <div className="min-h-screen bg-background">
      <header className="relative w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-2 w-1/3">
            <Package className="h-6 w-6" />
            <span className="font-bold text-xl">Yönetim</span>
          </div>

          <nav className="hidden md:flex items-center justify-center space-x-1 w-1/3">
            <NavLink to="/" icon={LogOut}>
              Mağazaya Dön
            </NavLink>
            <NavLink to="/dashboard/" icon={Home}>
              Pano
            </NavLink>
            <NavLink to="/dashboard/products" icon={Package}>
              Ürünler
            </NavLink>
            <NavLink to="/dashboard/orders" icon={ShoppingCart}>
              Siparişler
            </NavLink>
            <NavLink to="/dashboard/customers" icon={Users}>
              Müşteriler
            </NavLink>
          </nav>

          <div className="flex w-1/3 justify-end items-center gap-1 sm:gap-2">
            <TopbarSearch />
            <div className="md:hidden flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Menüyü aç</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                  <SheetTitle className="sr-only">Mobil Menü</SheetTitle>
                  <nav className="flex flex-col gap-4 mt-6">
                    <NavLink to="/" icon={LogOut}>
                      Mağazaya Dön
                    </NavLink>
                    <NavLink to="/dashboard/" icon={Home}>
                      Pano
                    </NavLink>
                    <NavLink to="/dashboard/products" icon={Package}>
                      Ürünler
                    </NavLink>
                    <NavLink to="/dashboard/orders" icon={ShoppingCart}>
                      Siparişler
                    </NavLink>
                    <NavLink to="/dashboard/customers" icon={Users}>
                      Müşteriler
                    </NavLink>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Ayarlar
            </Button>
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış
            </Button>
          </div> */}
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({
  to,
  children,
  icon: Icon
}: {
  to: string;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link
        to={to}
        className="flex items-center space-x-2"
        activeProps={{
          className: "bg-accent text-accent-foreground"
        }}
      >
        <Icon className="h-4 w-4" />
        <span>{children}</span>
      </Link>
    </Button>
  );
}

function TopbarSearch() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { searchQuery, setSearchQuery } = useSearchStore();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: '/dashboard/products' });
    }
  };

  return (
    <div className="flex items-center">
      {/* Desktop Search */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-2 mr-4 bg-background border rounded-lg px-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          type="search"
          placeholder="Ürün ara..."
          className="w-full border-0 bg-transparent shadow-none focus-visible:ring-0 md:w-[200px] lg:w-[300px] px-0 h-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="hidden" />
      </form>

      {/* Mobile Search */}
      <div className="md:hidden flex items-center">
        {isOpen ? (
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 w-[160px] sm:w-[200px] mr-2 bg-background border rounded-lg pl-3 pr-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Input
              autoFocus
              type="search"
              placeholder="Ara..."
              className="w-full h-9 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => !searchQuery && setIsOpen(false)}
            />
            <button type="submit" className="text-muted-foreground hover:bg-muted p-1 rounded-md transition-colors">
              <Search className="h-4 w-4 shrink-0" />
            </button>
          </form>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="mr-1">
            <Search className="h-5 w-5" />
            <span className="sr-only">Arama</span>
          </Button>
        )}
      </div>
    </div>
  );
}
