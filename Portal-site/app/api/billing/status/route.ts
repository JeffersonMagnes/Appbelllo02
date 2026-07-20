import { NextResponse } from 'next/server';
import { mercadoPagoConfigured } from '@/lib/server/billing/mercado-pago';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    provider: 'mercado_pago',
    configured: mercadoPagoConfigured(),
    webhookConfigured: Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET),
    mode: process.env.MERCADO_PAGO_MODE === 'production' ? 'production' : 'test',
  });
}
