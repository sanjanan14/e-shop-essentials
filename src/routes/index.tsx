import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore, currency, type Product } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atelier — Considered goods for everyday use" },
      {
        name: "description",
        content:
          "Shop a curated catalog of audio, desk, home and travel goods. Add to cart, check out and track every order.",
      },
      { property: "og:title", content: "Atelier — Considered goods for everyday use" },
      {
        property: "og:description",
        content: "Shop a curated catalog of audio, desk, home and travel goods with order tracking.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { addToCart } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
  });

  const categories = useMemo(
    () => ["All", ...Array.from(new Set((products ?? []).map((p) => p.category))).sort()],
    [products],
  );

  const term = search.trim().toLowerCase();
  const visible = (products ?? []).filter(
    (p) =>
      (category === "All" || p.category === category) &&
      (term === "" ||
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)),
  );

  return (
    <main>
      <section className="border-b border-border bg-accent/40">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Atelier Store</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight md:text-6xl">
            Considered goods for everyday use.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            A small catalog of well-made things. Add to cart, check out in seconds and follow your
            order from packing to doorstep.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={cat === category ? "default" : "outline"}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="w-full sm:w-64"
            maxLength={80}
          />
        </div>

        {isLoading ? (
          <p className="mt-10 text-muted-foreground">Loading catalog…</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"
              >
                <Link to="/product/$id" params={{ id: product.id }} className="block aspect-[4/3] overflow-hidden bg-muted">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </Link>
                <div className="space-y-2 p-5">
                  <Badge variant="secondary">{product.category}</Badge>
                  <h2 className="text-lg font-semibold">
                    <Link to="/product/$id" params={{ id: product.id }}>
                      {product.name}
                    </Link>
                  </h2>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-semibold">{currency(Number(product.price))}</span>
                    <Button
                      size="sm"
                      disabled={product.stock <= 0}
                      onClick={() => {
                        addToCart(product);
                        toast.success(`${product.name} added to cart`);
                      }}
                    >
                      {product.stock > 0 ? "Add to cart" : "Sold out"}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
            {visible.length === 0 ? (
              <p className="text-muted-foreground">No products match that search.</p>
            ) : null}
          </div>
        )}
      </section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        Atelier — a full-stack demo store.
      </footer>
    </main>
  );
}
