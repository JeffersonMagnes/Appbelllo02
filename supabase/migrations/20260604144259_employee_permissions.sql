ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"viewAgenda":true,"editAgenda":false,"viewClients":true,"editClients":false,"viewFinancial":false,"viewReports":false,"viewProducts":false,"viewComandas":true}';
