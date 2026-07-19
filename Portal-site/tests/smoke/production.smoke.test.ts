import { describe, expect, test } from 'bun:test';

const baseUrl = process.env.APPBELLO_SMOKE_URL ?? 'https://appbello-portal.netlify.app';

describe('production smoke', () => {
  test('health endpoint is available', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'ok' });
  });

  test('anonymous notification abuse is rejected', async () => {
    const response = await fetch(`${baseUrl}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        establishmentId: '00000000-0000-0000-0000-000000000000',
        pushToken: 'attacker-controlled',
        title: 'Unauthorized test',
        body: 'This request must be rejected',
      }),
    });
    expect(response.status).toBe(401);
  });

  for (const path of ['/', '/privacidade', '/negocios/barbearia', '/negocios/salao-de-beleza']) {
    test(`${path} responds successfully`, async () => {
      const response = await fetch(`${baseUrl}${path}`);
      expect(response.status).toBe(200);
    });
  }
});

