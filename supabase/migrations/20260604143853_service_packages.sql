CREATE TABLE IF NOT EXISTS public.service_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sessions INTEGER NOT NULL DEFAULT 1,
  validity_days INTEGER,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  service_ids JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_service_packages" ON public.service_packages;
CREATE POLICY "owner_service_packages" ON public.service_packages
  FOR ALL USING (establishment_id IN (SELECT id FROM public.establishments WHERE owner_id = auth.uid()));
