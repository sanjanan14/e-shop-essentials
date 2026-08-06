import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore, currency } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Your orders — Atelier Store" },
      { name: "description", content: "Track the status of every Atelier order you have placed." },
      { property: "og:title", content: "Your orders — Atelier Store" },
      { property: "og:description", content: "Track the status of every Atelier order you have placed." },
    ],
  }),
  component: OrdersPage,
});

type OrderRow = {
  id: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  created_at: string;
  order_items: { id: string; product_name: string; quantity: number; unit_price: number }[];
};

export function statusTone(status: string) {
  if (status === "delivered") return "bg-success text-success-foreground";
  if (status === "cancelled") return "bg-destructive text-destructive-foreground";
  if (status === "shipped") return "bg-accent text-accent-foreground";
  return "bg-secondary text-secondary-foreground";
}

function OrdersPage() {
  const { session, authLoading } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: "/auth" });
  }, [authLoading, session, navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,total_amount,status,shipping_address,created_at,order_items(id,product_name,quantity,unit_price)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as OrderRow[];
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">Your orders</h1>
      {isLoading ? (
        <p className="mt-6 text-muted-foreground">Loading orders…</p>
      ) : !orders || orders.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No orders yet.</p>
          <Button asChild className="mt-4">
            <Link to="/">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusTone(order.status)}>{order.status}</Badge>
                  <span className="font-semibold">{currency(Number(order.total_amount))}</span>
                </div>
              </div>
              <ul className="mt-4 space-y-1 border-t border-border pt-4 text-sm text-muted-foreground">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>
                    <span>{currency(Number(item.unit_price) * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Ships to: {order.shipping_address}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}