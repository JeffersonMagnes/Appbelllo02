import { createHmac, timingSafeEqual } from 'crypto';

export function verifyMercadoPagoSignature(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret || !input.xSignature || !input.xRequestId || !input.dataId) return false;

  const parts = Object.fromEntries(
    input.xSignature.split(',').map(part => part.trim().split('=', 2))
  );
  const timestamp = parts.ts;
  const received = parts.v1;
  if (!timestamp || !received) return false;

  const manifest = `id:${input.dataId.toLowerCase()};request-id:${input.xRequestId};ts:${timestamp};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');
  if (expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
