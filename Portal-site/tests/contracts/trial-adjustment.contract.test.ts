import { describe, expect, mock, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const portalRoot = resolve(import.meta.dir, '../..');
const readPortal = (p: string) => readFileSync(resolve(portalRoot, p), 'utf8');
const readWorkspace = (p: string) => readFileSync(resolve(portalRoot, '..', p), 'utf8');

mock.module('@/lib/supabase/client', () => ({ createClient: () => ({ rpc: async () => ({ data: null, error: null }) }) }));

import {
  describeTrialError,
  firstRow,
  formatBrasilia,
  validateAmount,
} from '@/lib/admin/trial-adjustment';

describe('trial adjustment helpers', () => {
  test('formats instants on the Brasília wall clock regardless of the browser timezone', () => {
    expect(formatBrasilia('2026-10-18T21:30:50Z')).toBe('18/10/2026 18:30:50 (Brasília, UTC−3)');
    expect(formatBrasilia('2026-07-27T16:03:25.539958+00:00')).toBe('27/07/2026 13:03:25 (Brasília, UTC−3)');
    expect(formatBrasilia('2026-10-19T02:59:59Z')).toBe('18/10/2026 23:59:59 (Brasília, UTC−3)');
    expect(formatBrasilia(null)).toBe('—');
    expect(formatBrasilia('lixo')).toBe('—');
  });

  test('validates a positive integer amount within 365 days for every unit', () => {
    expect(validateAmount('5', 'minutes')).toBeNull();
    expect(validateAmount('365', 'days')).toBeNull();
    expect(validateAmount('8760', 'hours')).toBeNull();
    expect(validateAmount('525600', 'minutes')).toBeNull();
    for (const bad of ['', '0', '-1', '1.5', '1e3', 'abc', ' ', '07 8']) {
      expect(validateAmount(bad, 'days')).not.toBeNull();
    }
    expect(validateAmount('366', 'days')).not.toBeNull();
    expect(validateAmount('8761', 'hours')).not.toBeNull();
    expect(validateAmount('525601', 'minutes')).not.toBeNull();
  });

  test('keeps the real server message and translates known causes', () => {
    expect(describeTrialError({ code: '42501', message: 'not authorized' })).toContain('apenas administradores');
    expect(describeTrialError({ code: '42501', message: 'not authorized' })).toContain('not authorized');
    expect(describeTrialError({ code: '55000', message: 'x' })).toContain('assinatura ativa');
    expect(describeTrialError({ code: 'PGRST202', message: 'Could not find the function' })).toContain('migration 20261018150000');
    expect(describeTrialError({ message: 'boom' })).toContain('boom');
    expect(describeTrialError(null)).toContain('erro desconhecido');
  });

  test('normalises one-row and array RPC answers', () => {
    expect(firstRow<{ a: number }>([{ a: 1 }])).toEqual({ a: 1 });
    expect(firstRow<{ a: number }>({ a: 2 })).toEqual({ a: 2 });
    expect(firstRow([])).toBeNull();
    expect(firstRow(null)).toBeNull();
  });
});

describe('ExtendTrialModal', () => {
  const render = async (target: any) => {
    const { default: Modal } = await import('@/components/admin/ExtendTrialModal');
    return renderToStaticMarkup(React.createElement(Modal, { target, onClose: () => {}, onChanged: () => {} }));
  };

  test('shows quantity, a visible Minutos/Horas/Dias selector, current and new expiry, Cancelar and Confirmar', async () => {
    const html = await render({ ids: ['e1'], name: 'Jefferson Maciel', currentEndsAt: '2026-07-27T16:03:25.539958+00:00', expired: true });
    expect(html).toContain('Jefferson Maciel');
    expect(html).toContain('Quantidade');
    expect(html).toContain('type="number"');
    expect(html).toContain('Unidade');
    for (const unit of ['Minutos', 'Horas', 'Dias']) expect(html).toMatch(new RegExp(`role="radio"[^>]*>${unit}</button>`));
    expect((html.match(/role="radio"/g) ?? []).length).toBe(3);
    expect(html).not.toContain('<select');
    expect(html).toContain('Vencimento atual');
    expect(html).toContain('27/07/2026 13:03:25 (Brasília, UTC−3)');
    expect(html).toContain('Novo vencimento');
    expect(html).toContain('Informe a quantidade para ver o novo vencimento.');
    expect(html).toContain('>Cancelar</button>');
    expect(html).toContain('>Confirmar</button>');
  });

  test('expired trial counts from now by default; adding to the old expiry is a secondary link in plain words', async () => {
    const html = await render({ ids: ['e1'], name: 'X', currentEndsAt: '2026-07-27T16:03:25Z', expired: true });
    expect(html).toContain('O novo prazo conta a partir de agora.');
    expect(html).toContain('>Somar ao vencimento atual</button>');
    expect(html).not.toContain('extend');
    expect(html).not.toContain('from_now');
    expect(html).not.toContain('type="radio"');
  });

  test('active trial adds to the current expiry by default', async () => {
    const html = await render({ ids: ['e2'], name: 'Studio', currentEndsAt: '2026-12-01T12:00:00Z', expired: false });
    expect(html).toContain('O novo prazo é somado ao vencimento atual.');
    expect(html).toContain('>Contar a partir de agora</button>');
    expect(html).not.toContain('>vencido<');
    expect(html).toContain('01/12/2026 09:00:00 (Brasília, UTC−3)');
  });

  test('bulk mode has the same fields, hides single-establishment expiry and explains atomicity', async () => {
    const html = await render({ ids: ['a', 'b', 'c'], name: '3', currentEndsAt: null, expired: false });
    expect(html).toContain('3 estabelecimentos selecionados');
    expect(html).toContain('Quantidade');
    expect((html.match(/role="radio"/g) ?? []).length).toBe(3);
    expect(html).not.toContain('Vencimento atual');
    expect(html).not.toContain('Novo vencimento');
    expect(html).toContain('nenhum é alterado');
    expect(html).toContain('>Confirmar</button>');
  });
});

describe('source contracts', () => {
  const modal = readPortal('components/admin/ExtendTrialModal.tsx');
  const page = readPortal('app/admin/usuarios/page.tsx');

  test('the admin page uses the audited, server-computed RPCs and no longer the legacy day-only ones', () => {
    expect(modal).toContain("rpc('admin_preview_trial_adjustment'");
    expect(modal).toContain("rpc('admin_grant_trial_time'");
    expect(page).not.toContain('admin_extend_trial');
    expect(page).not.toContain('admin_bulk_extend_trial');
    expect(page).toContain('ExtendTrialModal');
    expect(page).toContain('trial_ends_at');
    // one selected row must behave like the per-row button (with its current expiry)
    expect(page).toContain('ids.length === 1 ? users.find');
  });

  test('success is shown only after the server answered without error and returned rows', () => {
    expect(modal).toContain('if (rpcError)');
    expect(modal).toContain('rows.length === 0');
    expect(modal.indexOf('if (rpcError)')).toBeLessThan(modal.indexOf('setConfirmed(rows)'));
    expect(modal.indexOf('rows.length === 0')).toBeLessThan(modal.indexOf('setConfirmed(rows)'));
    expect(modal).toContain('Confirmado pelo servidor');
    expect(modal).toContain('role="alert"');
  });

  test('the browser clock is never used to derive an expiry', () => {
    expect(modal).not.toContain('Date.now()');
    expect(modal).not.toContain('new Date()');
    expect(readPortal('lib/admin/trial-adjustment.ts')).not.toContain('Date.now()');
  });

  test('shortening an active trial needs an explicit confirmation sent to the server', () => {
    expect(modal).toContain('preview?.shortens');
    expect(modal).toContain('p_allow_shorten: allowShorten');
    expect(modal).toContain('(!preview?.shortens || allowShorten)');
  });
});

describe('migration 20261018150000_trial_time_adjustment', () => {
  const sql = readWorkspace('supabase/migrations/20261018150000_trial_time_adjustment.sql');

  test('adds the adjustment without changing existing trials and keeps ONE formula', () => {
    expect(sql).toContain('trial_adjust_micros bigint not null default 0');
    expect(sql).toContain("coalesce(v_est.trial_adjust_micros, 0) * interval '1 microsecond'");
    expect(sql).toContain('create or replace function public.compute_establishment_access');
    expect(sql).toContain("|| ' days')::interval");
  });

  test('only admins or the service role can preview/grant; anon has no execute', () => {
    expect(sql.match(/coalesce\(public\.is_app_admin\(\), false\) or coalesce\(auth\.role\(\) = 'service_role', false\)/g)?.length).toBe(2);
    expect(sql).toContain('from public, anon;');
    expect(sql).toContain('revoke all on function public.trial_adjustment_calc(uuid, integer, text, text) from public, anon, authenticated;');
  });

  test('validates positive amounts, units, modes and the 365-day cap on the server', () => {
    expect(sql).toContain('p_amount is null or p_amount <= 0');
    expect(sql).toContain("p_unit not in ('minutes', 'hours', 'days')");
    expect(sql).toContain("p_mode not in ('extend', 'from_now')");
    expect(sql).toContain("v_step > interval '365 days'");
  });

  test('audits who, when, previous and new expiry in an append-only table', () => {
    expect(sql).toContain('create table if not exists public.trial_adjustments');
    for (const col of ['admin_user_id', 'admin_email', 'previous_ends_at', 'new_ends_at', 'created_at', 'amount', 'unit', 'mode']) {
      expect(sql).toContain(col);
    }
    expect(sql).toContain('revoke all on public.trial_adjustments from public, anon, authenticated;');
    expect(sql).toContain('grant select on public.trial_adjustments to authenticated;');
    expect(sql).not.toMatch(/grant (insert|update|delete)[^;]*trial_adjustments to authenticated/);
  });

  test('the owner cannot self-extend: the column guard includes the new column', () => {
    expect(sql).toContain('(new.trial_adjust_micros is distinct from old.trial_adjust_micros)');
  });

  test('legacy production-only RPCs are not redefined blindly', () => {
    expect(sql).not.toContain('function public.admin_extend_trial');
    expect(sql).not.toContain('function public.admin_bulk_extend_trial');
  });
});
