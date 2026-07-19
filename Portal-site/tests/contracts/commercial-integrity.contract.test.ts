import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const portalRoot = resolve(import.meta.dir, '../..');
const workspaceRoot = resolve(portalRoot, '..');
const readPortal = (path: string) => readFileSync(resolve(portalRoot, path), 'utf8');
const readWorkspace = (path: string) => readFileSync(resolve(workspaceRoot, path), 'utf8');

describe('commercial integrity', () => {
  test('web subscription UI contains no fake payment instrument or billing history', () => {
    const page = readPortal('app/dashboard/assinatura/page.tsx');
    expect(page).not.toContain("last4: '1234'");
    expect(page).not.toContain('minhachave@pix.com');
    expect(page).not.toContain("status: 'paid'");
    expect(page).toContain('gateway de pagamento está em implantação');
  });

  test('mobile paywall and billing do not activate or cancel plans locally', () => {
    const paywall = readWorkspace('mobile/src/app/paywall.tsx');
    const billing = readWorkspace('mobile/src/app/billing.tsx');
    expect(paywall).not.toContain('activateSubscription(selectedPlan)');
    expect(paywall).not.toContain('Assinatura ativada!');
    expect(billing).not.toContain('activateSubscription(selectedPlan)');
    expect(billing).not.toContain('resetSubscription()');
    expect(billing).not.toContain('Sua assinatura foi cancelada com sucesso');
  });

  test('public marketing does not contain known unsupported claims or fake contacts', () => {
    const files = [
      'components/landing/Footer.tsx',
      'components/landing/CTA.tsx',
      'components/landing/BenefitsTabs.tsx',
      'app/privacidade/page.tsx',
      'app/negocios/barbearia/page.tsx',
      'app/negocios/salao-de-beleza/page.tsx',
      'app/negocios/clinica-de-estetica/page.tsx',
      'app/negocios/studios/page.tsx',
    ].map(readPortal).join('\n');

    for (const forbidden of [
      '5511999999999',
      'Mais de 5.000',
      'TESTE GRÁTIS POR 5 DIAS',
      '99,9% de disponibilidade',
      'Criptografia de ponta a ponta',
      'Backup automático diário',
    ]) expect(files.toLowerCase()).not.toContain(forbidden.toLowerCase());
  });
});

