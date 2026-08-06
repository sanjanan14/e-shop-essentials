import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, LogOut, LayoutDashboard, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store-context";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { cartCount, session, isAdmin } = useStore();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="font-display text-lg font-bold tracking-tight">
          Atelier<span className="text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-1">
          {session ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/orders">
                  <Package className="size-4" /> Orders
                </Link>
              </Button>
              {isAdmin ? (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">
                    <LayoutDashboard className="size-4" /> Admin
                  </Link>
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                <LogOut className="size-4" /> Sign out
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
          <Button asChild size="sm" className="relative">
            <Link to="/cart">
              <ShoppingBag className="size-4" /> Cart
              {cartCount > 0 ? (
                <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 text-xs font-semibold">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}