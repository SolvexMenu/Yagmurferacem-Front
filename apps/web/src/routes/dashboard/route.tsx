import { authClient } from '@/lib/auth-client';
import { createFileRoute, Link, Outlet, redirect, useNavigate, useLocation } from '@tanstack/react-router'
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
          <div className="flex items-center space-x-2 flex-1">
            <Package className="h-6 w-6" />
            <span className="font-bold text-xl">Yönetim</span>
          </div>

          <nav className="hidden min-[1000px]:flex items-center justify-center space-x-1 px-4 flex-shrink-0">
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

          <div className="flex flex-1 justify-end items-center gap-1 sm:gap-2">
            <div className="min-[1000px]:hidden flex items-center">
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
