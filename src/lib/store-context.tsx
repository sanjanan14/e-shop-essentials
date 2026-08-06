import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string;
  stock: number;
  is_active: boolean;
};

export type CartLine = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

type StoreValue = {
  session: Session | null;
  isAdmin: boolean;
  authLoading: boolean;
  cart: CartLine[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);
const CART_KEY = "atelier-cart";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(CART_KEY);
    if (raw) {
      try {
        setCart(JSON.parse(raw) as CartLine[]);
      } catch {
        /* ignore malformed cart */
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthLoading(false);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      return;
    }
    let active = true;
    void supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (active) setIsAdmin(Boolean(data));
      });
    return () => {
      active = false;
    };
  }, [session]);

  const value = useMemo<StoreValue>(() => {
    const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
    const cartTotal = cart.reduce((sum, line) => sum + line.quantity * line.price, 0);
    return {
      session,
      isAdmin,
      authLoading,
      cart,
      cartCount,
      cartTotal,
      addToCart: (product, quantity = 1) =>
        setCart((prev) => {
          const existing = prev.find((line) => line.id === product.id);
          if (existing) {
            return prev.map((line) =>
              line.id === product.id
                ? { ...line, quantity: Math.min(line.quantity + quantity, 99) }
                : line,
            );
          }
          return [
            ...prev,
            {
              id: product.id,
              name: product.name,
              price: Number(product.price),
              image_url: product.image_url,
              quantity,
            },
          ];
        }),
      setQuantity: (id, quantity) =>
        setCart((prev) =>
          quantity <= 0
            ? prev.filter((line) => line.id !== id)
            : prev.map((line) => (line.id === id ? { ...line, quantity } : line)),
        ),
      removeFromCart: (id) => setCart((prev) => prev.filter((line) => line.id !== id)),
      clearCart: () => setCart([]),
    };
  }, [session, isAdmin, authLoading, cart]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export const currency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);