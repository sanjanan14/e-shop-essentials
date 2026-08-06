import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore, currency, type Product } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product — Atelier Store" },
      { name: "description", content: "Product details, pricing and availability at the Atelier store." },
      { property: "og:title", content: "Product — Atelier Store" },
      { property: "og:description", content: "Product details, pricing and availability at the Atelier store." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { addToCart } = useStore();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });

  if (isLoading) {
    return <main className="mx-auto max-w-5xl px-4 py-16 text-muted-foreground">Loading…</main>;
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Product not found</h1>
        <Button asChild className="mt-5">
          <Link to="/">Back to store</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Link to="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        ← Back to catalog
      </Link>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="size-full object-cover" />
          ) : null}
        </div>
        <div>
          <Badge variant="secondary">{product.category}</Badge>
          <h1 className="mt-3 text-4xl font-bold">{product.name}</h1>
          <p className="mt-3 text-2xl font-semibold text-primary">{currency(Number(product.price))}</p>
          <p className="mt-5 leading-relaxed text-muted-foreground">{product.description}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
          <Button
            size="lg"
            className="mt-6 w-full sm:w-auto"
            disabled={product.stock <= 0}
            onClick={() => {
              addToCart(product);
              toast.success(`${product.name} added to cart`);
            }}
          >
            Add to cart
          </Button>
        </div>
      </div>
    </main>
  );
}