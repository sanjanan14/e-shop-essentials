ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS shipping_phone text NOT NULL DEFAULT '';

ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'ordered';
UPDATE public.orders SET status = 'ordered' WHERE status IN ('pending','paid');

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_image text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

CREATE OR REPLACE FUNCTION public.validate_order_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('ordered','packed','shipped','out_for_delivery','delivered','cancelled') THEN
    RAISE EXCEPTION 'Invalid order status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_status_valid ON public.orders;
CREATE TRIGGER orders_status_valid BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.validate_order_status();

CREATE POLICY "admins view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.place_order(
  _shipping_name text,
  _shipping_phone text,
  _shipping_address text,
  _items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _order_id uuid;
  _total numeric := 0;
  _item jsonb;
  _product public.products%ROWTYPE;
  _qty int;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;
  IF length(trim(_shipping_name)) < 2 OR length(trim(_shipping_phone)) < 6 OR length(trim(_shipping_address)) < 10 THEN
    RAISE EXCEPTION 'Complete shipping details are required';
  END IF;

  INSERT INTO public.orders (user_id, total_amount, status, shipping_name, shipping_phone, shipping_address)
  VALUES (_uid, 0, 'ordered', left(trim(_shipping_name),120), left(trim(_shipping_phone),30), left(trim(_shipping_address),500))
  RETURNING id INTO _order_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := (_item->>'quantity')::int;
    IF _qty IS NULL OR _qty < 1 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;
    SELECT * INTO _product FROM public.products WHERE id = (_item->>'product_id')::uuid AND is_active FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not available';
    END IF;
    IF _product.stock < _qty THEN
      RAISE EXCEPTION 'Only % left in stock for %', _product.stock, _product.name;
    END IF;

    UPDATE public.products SET stock = stock - _qty WHERE id = _product.id;

    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, unit_price, quantity)
    VALUES (_order_id, _product.id, _product.name, _product.image_url, _product.price, _qty);

    _total := _total + (_product.price * _qty);
  END LOOP;

  UPDATE public.orders SET total_amount = _total WHERE id = _order_id;
  RETURN _order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(text,text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(text,text,text,jsonb) TO authenticated;