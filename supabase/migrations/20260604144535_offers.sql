CREATE TABLE IF NOT EXISTS public.offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_fixed DECIMAL(10,2) DEFAULT 0,
  original_price DECIMAL(10,2),
  promo_price DECIMAL(10,2),
  valid_until DATE,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_offers" ON public.offers;
CREATE POLICY "owner_offers" ON public.offers
  FOR ALL USING (establishment_id IN (SELECT id FROM public.establishments WHERE owner_id = auth.uid()));
