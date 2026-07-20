-- PAY-002: expose the verified Mercado Pago integration in test mode only.
update public.app_settings
set value = value
  || '{"version":"2026-07-20.2","onlineCheckoutEnabled":true,"checkoutMode":"test","paymentProvider":"mercado_pago"}'::jsonb,
    updated_at = now()
where key = 'commercial_catalog';
