REVOKE ALL ON FUNCTION public.validate_order_status() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "anyone can view active products" ON public.products;
CREATE POLICY "public view active products" ON public.products
FOR SELECT TO anon USING (is_active);
CREATE POLICY "users view active or admin all products" ON public.products
FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(), 'admin'::app_role));

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;