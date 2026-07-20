const API_BASE = 'https://api.mercadopago.com';

export type MercadoPagoPreapproval = {
  id: string;
  external_reference?: string;
  init_point?: string;
  status: string;
  next_payment_date?: string;
  payer_email?: string;
};

function accessToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new Error('Mercado Pago is not configured');
  return token;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.message === 'string' ? body.message : `Mercado Pago HTTP ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

export function mercadoPagoConfigured() {
  return Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN);
}

export async function createPreapproval(input: {
  externalReference: string;
  payerEmail: string;
  planName: string;
  amountCents: number;
}) {
  return request<MercadoPagoPreapproval>('/preapproval', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': input.externalReference },
    body: JSON.stringify({
      reason: `Appbello - Plano ${input.planName}`,
      external_reference: input.externalReference,
      payer_email: input.payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: input.amountCents / 100,
        currency_id: 'BRL',
      },
      back_url: 'https://appbello.com.br/dashboard/assinatura?retorno=mercado-pago',
    }),
  });
}

export async function getPreapproval(id: string) {
  return request<MercadoPagoPreapproval>(`/preapproval/${encodeURIComponent(id)}`);
}
