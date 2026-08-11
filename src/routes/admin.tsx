import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore, currency, type Product } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusTone, statusLabel, ORDER_STATUSES } from "./orders";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — Atelier Store" },
      { name: "description", content: "Manage the Atelier product catalog and update order statuses." },
      { property: "og:title", content: "Admin dashboard — Atelier Store" },
      { property: "og:description", content: "Manage the Atelier product catalog and update order statuses." },
    ],
  }),
  component: AdminPage,
});

const STATUSES = [...ORDER_STATUSES];
const CATEGORIES = ["Audio", "Desk", "Home", "Apparel", "Travel", "Wearables", "Photo"];

const emptyForm = {
  name: "",
  description: "",
  price: "",
  image_url: "",
  category: "Audio",
  stock: "",
};

function AdminPage() {
  const { session, isAdmin, authLoading } = useStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: "/auth" });
  }, [authLoading, session, navigate]);

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id,total_amount,status,shipping_name,shipping_phone,shipping_address,created_at,order_items(id,product_name,quantity,unit_price)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as {
        id: string;
        total_amount: number;
        status: string;
        shipping_name: string;
        shipping_phone: string;
        shipping_address: string;
        created_at: string;
        order_items: { id: string; product_name: string; quantity: number; unit_price: number }[];
      }[];
    },
  });

  if (!authLoading && session && !isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Admins only</h1>
        <p className="mt-3 text-muted-foreground">
          Your account does not have the admin role for this store.
        </p>
      </main>
    );
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim().slice(0, 120),
      description: form.description.trim().slice(0, 1000),
      price: Number(form.price) || 0,
      image_url: form.image_url.trim() || null,
      category: form.category.trim().slice(0, 60) || "general",
      stock: Number(form.stock) || 0,
    };
    if (!payload.name) {
      toast.error("Product name is required.");
      return;
    }
    const { error } = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingId ? "Product updated." : "Product added.");
    setForm(emptyForm);
    setEditingId(null);
    void qc.invalidateQueries({ queryKey: ["admin-products"] });
    void qc.invalidateQueries({ queryKey: ["products"] });
  }

  async function removeProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product removed.");
    void qc.invalidateQueries({ queryKey: ["admin-products"] });
    void qc.invalidateQueries({ queryKey: ["products"] });
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Order updated.");
    void qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">Admin dashboard</h1>
      <p className="mt-2 text-muted-foreground">Manage the catalog and track every order.</p>

      <Tabs defaultValue="products" className="mt-8">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6 grid gap-8 lg:grid-cols-[20rem_1fr]">
          <form onSubmit={saveProduct} className="h-fit space-y-3 rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">{editingId ? "Edit product" : "New product"}</h2>
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea id="p-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Price</Label>
                <Input id="p-price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-stock">Stock</Label>
                <Input id="p-stock" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cat">Category</Label>
              <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                <SelectTrigger id="p-cat">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-img">Image URL</Label>
              <Input id="p-img" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} maxLength={500} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingId ? "Save changes" : "Add product"}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>

          <ul className="space-y-3">
            {(products ?? []).map((product) => (
              <li key={product.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-3">
                <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="size-full object-cover" loading="lazy" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {currency(Number(product.price))} · {product.stock} in stock · {product.category}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(product.id);
                    setForm({
                      name: product.name,
                      description: product.description,
                      price: String(product.price),
                      image_url: product.image_url ?? "",
                      category: product.category,
                      stock: String(product.stock),
                    });
                  }}
                >
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void removeProduct(product.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="orders" className="mt-6 space-y-4">
          {(orders ?? []).map((order) => (
            <div key={order.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusTone(order.status)}>{statusLabel(order.status)}</Badge>
                  <span className="font-semibold">{currency(Number(order.total_amount))}</span>
                  <Select value={order.status} onValueChange={(value) => void updateStatus(order.id, value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span className="truncate">
                      {item.product_name} × {item.quantity}
                    </span>
                    <span>{currency(Number(item.unit_price) * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Ships to: {order.shipping_name || "—"} · {order.shipping_phone || "—"} · {order.shipping_address}
              </p>
            </div>
          ))}
          {orders && orders.length === 0 ? (
            <p className="text-muted-foreground">No orders yet.</p>
          ) : null}
        </TabsContent>
      </Tabs>
    </main>
  );
}