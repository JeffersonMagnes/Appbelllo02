CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.app_settings (key, value)
VALUES (
  'notifications',
  '{"trialReminder3": true, "trialReminder1": true, "paymentFailed": true, "weeklyReport": false, "newFeature": true, "partnerOffer": true}'
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings (key, value)
VALUES (
  'geral',
  '{"appName": "AppBello", "supportEmail": "suporte@appbello.com.br", "supportPhone": "(11) 4000-0000", "trialDays": 14, "maintenanceMode": false}'
)
ON CONFLICT (key) DO NOTHING;
