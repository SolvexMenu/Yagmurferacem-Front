import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Menu, X, Search } from "lucide-react";
import UserMenu from "./user-menu";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

const NAVIGATION_ITEMS = [
  { name: "Abaya Takımı", href: "/urunler" },
  { name: "Ferace", href: "/urunler" },
  { name: "Kış Sezonu", href: "/urunler" },
  { name: "Şal ve Eşarp", href: "/urunler" },
  { name: "Tesettür Elbise", href: "/urunler" },
  { name: "Yeni Ürünler", href: "/urunler" }
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img
                src="/logo1.png"
                alt="Tesettur Shop"
                className="h-12 w-auto sm:h-14"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {NAVIGATION_ITEMS.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                search={{ d: item.name }}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-gray-50"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Side - User Menu & Mobile Button */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <CustomerSearch />
            <UserMenu />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={cn(
          "lg:hidden transition-all duration-300 ease-in-out overflow-hidden bg-white",
          mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        )}>
          <nav className="py-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2 px-4">
              {NAVIGATION_ITEMS.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  search={{ d: item.name }}
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg border border-gray-200 hover:border-gray-300 min-h-[48px]"
                >
                  <span className="text-center leading-tight">{item.name}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

function CustomerSearch() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: products } = useQuery(orpc.productRouter.getAllProducts.queryOptions());

  const filteredProducts = useMemo(() => {
    if (!query.trim() || !products) return [];
    const q = query.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.stockCode && p.stockCode.toLowerCase().includes(q))
    );
  }, [query, products]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate({ to: '/urunler', search: { q: query, c: '1' } as any });
      setIsOpen(false);
      setQuery("");
    }
  };

  const AutocompleteList = () => {
    if (!query.trim() || filteredProducts.length === 0) return null;
    const top5 = filteredProducts.slice(0, 5);
    const remaining = filteredProducts.length - 5;

    return (
      <div className="absolute top-[110%] md:right-0 left-0 w-full min-w-[280px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] max-h-[60vh] overflow-y-auto flex flex-col p-2 gap-1 animate-in fade-in zoom-in-95">
        {top5.map((product: any) => (
          <Link
            key={product.id}
            to="/urun/$id"
            params={{ id: product.id.toString() }}
            onClick={() => { setIsOpen(false); setQuery(""); }}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0"
          >
            {product.imageUrls?.[0] && (
              <img src={product.imageUrls[0]} alt={product.name} className="h-10 w-10 rounded-md object-cover border border-gray-100" />
            )}
            <div className="flex flex-col flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
              <p className="text-xs text-gray-500 font-semibold">{product.price} ₺</p>
            </div>
          </Link>
        ))}
        {remaining > 0 && (
          <Link
            to="/urunler"
            search={{ q: query, c: '1' } as any}
            onClick={() => { setIsOpen(false); setQuery(""); }}
            className="text-center p-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-gray-50 rounded-lg mt-1 border border-slate-100"
          >
            Daha fazlasını görmek için tıklayın &rarr;
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center">
      {/* Desktop Search */}
      <div className="hidden lg:flex relative items-center mr-2">
        <form onSubmit={handleSearchSubmit} className="flex items-center w-full rounded-full bg-gray-50/50 px-2 lg:w-[250px] border border-transparent focus-within:ring-2 focus-within:ring-ring focus-within:border-input transition-all">
          <button type="submit" className="flex-shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-full">
            <Search className="h-4 w-4" />
          </button>
          <Input
            autoComplete="off"
            type="search"
            placeholder="Ürün ara..."
            className="flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 px-2 h-9"
            style={{ paddingLeft: 0, paddingRight: 0 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
        {query && <AutocompleteList />}
      </div>

      {/* Mobile Search */}
      <div className="lg:hidden flex items-center">
        {isOpen ? (
          <div className="relative flex items-center animate-in fade-in slide-in-from-right-4 w-[160px] sm:w-[200px] mr-1">
            <form onSubmit={handleSearchSubmit} className="flex flex-row-reverse items-center w-full rounded-full bg-gray-50/50 px-2 border border-transparent focus-within:ring-2 focus-within:ring-ring focus-within:border-input transition-all">
              <button type="submit" className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-full">
                <Search className="h-4 w-4" />
              </button>
              <Input
                autoFocus
                autoComplete="off"
                type="search"
                placeholder="Ara..."
                className="flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 px-2 h-9 text-sm"
                style={{ paddingLeft: 0, paddingRight: 0 }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => setTimeout(() => !query && setIsOpen(false), 200)}
              />
            </form>
            {query && <AutocompleteList />}
          </div>
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
