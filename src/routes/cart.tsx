import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useStore, currency } from "@/lib/store-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — Atelier Store" },
      { name: "description", content: "Review the items in your Atelier cart before checking out." },
      { property: "og:title", content: "Your cart — Atelier Store" },
      { property: "og:description", content: "Review the items in your Atelier cart before checking out." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart, cartTotal, setQuantity, removeFromCart } = useStore();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">Your cart</h1>
      {cart.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-4">
            <Link to="/">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_18rem]">
          <ul className="space-y-4">
            {cart.map((line) => (
              <li
                key={line.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-3"
              >
                <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {line.image_url ? (
                    <img src={line.image_url} alt={line.name} className="size-full object-cover" loading="lazy" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{line.name}</p>
                  <p className="text-sm text-muted-foreground">{currency(line.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" onClick={() => setQuantity(line.id, line.quantity - 1)} aria-label="Decrease quantity">
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
                  <Button size="icon" variant="outline" onClick={() => setQuantity(line.id, line.quantity + 1)} aria-label="Increase quantity">
                    <Plus className="size-4" />
                  </Button>
                </div>
                <p className="w-20 text-right font-medium">{currency(line.price * line.quantity)}</p>
                <Button size="icon" variant="ghost" onClick={() => removeFromCart(line.id)} aria-label="Remove item">
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">Summary</h2>
            <div className="mt-4 flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{currency(cartTotal)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-muted-foreground">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-semibold">
              <span>Total</span>
              <span>{currency(cartTotal)}</span>
            </div>
            <Button asChild className="mt-5 w-full">
              <Link to="/checkout">Checkout</Link>
            </Button>
          </aside>
        </div>
      )}
    </main>
  );
}