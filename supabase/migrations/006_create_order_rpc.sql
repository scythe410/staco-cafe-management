CREATE OR REPLACE FUNCTION create_order_with_items(
  p_source text,
  p_customer_name text,
  p_payment_method text,
  p_commission integer,
  p_discount integer,
  p_tax integer,
  p_total_amount integer,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id uuid;
  item jsonb;
BEGIN
  -- Insert order
  INSERT INTO orders (
    source, customer_name, payment_method, commission,
    discount, tax, total_amount, status
  )
  VALUES (
    p_source::order_source, p_customer_name, p_payment_method::payment_method, p_commission,
    p_discount, p_tax, p_total_amount, 'new_order'::order_status
  )
  RETURNING id INTO new_order_id;

  -- Insert order items
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, menu_item_id, quantity, unit_price
    )
    VALUES (
      new_order_id,
      (item->>'menu_item_id')::uuid,
      (item->>'quantity')::integer,
      (item->>'unit_price')::integer
    );
  END LOOP;

  RETURN new_order_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_order_with_items TO authenticated;
