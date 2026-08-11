import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore, currency } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Atelier Store" },
      { name: "description", content: "Confirm your shipping details and place your Atelier order." },
      { property: "og:title", content: "Checkout — Atelier Store" },
      { property: "og:description", content: "Confirm your shipping details and place your Atelier order." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { cart, cartTotal, clearCart, session, authLoading } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: "/auth" });
  }, [authLoading, session, navigate]);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!session || cart.length === 0) return;
    const trimmed = address.trim();
    if (name.trim().length < 2) {
      toast.error("Please enter the recipient's full name.");
      return;
    }
    if (phone.trim().length < 6) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (trimmed.length < 10) {
      toast.error("Please enter a complete shipping address.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("place_order", {
        _shipping_name: name.trim().slice(0, 120),
        _shipping_phone: phone.trim().slice(0, 30),
        _shipping_address: trimmed.slice(0, 500),
        _items: cart.map((line) => ({ product_id: line.id, quantity: line.quantity })),
      });
      if (error) throw error;
      clearCart();
      toast.success("Order placed.");
      void navigate({ to: "/orders" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  }

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="mt-3 text-muted-foreground">There is nothing to check out yet.</p>
        <Button asChild className="mt-5">
          <Link to="/">Browse products</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <form onSubmit={placeOrder} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ship-name">Full name</Label>
            <Input
              id="ship-name"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ship-phone">Phone number</Label>
            <Input
              id="ship-phone"
              type="tel"
              value={phone}
              maxLength={30}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 010 1234"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Shipping address</Label>
            <Textarea
              id="address"
              rows={5}
              maxLength={500}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, postal code, country"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Placing order…" : `Place order · ${currency(cartTotal)}`}
          </Button>
          <p className="text-xs text-muted-foreground">
            Demo checkout — no payment is collected.
          </p>
        </form>
        <aside className="h-fit rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {cart.map((line) => (
              <li key={line.id} className="flex justify-between gap-3">
                <span className="truncate text-muted-foreground">
                  {line.name} × {line.quantity}
                </span>
                <span>{currency(line.price * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-4 font-semibold">
            <span>Total</span>
            <span>{currency(cartTotal)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}