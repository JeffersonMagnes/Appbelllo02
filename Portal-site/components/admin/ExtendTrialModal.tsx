'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  TRIAL_UNITS,
  describeTrialError,
  firstRow,
  formatBrasilia,
  validateAmount,
  type TrialGrantRow,
  type TrialMode,
  type TrialPreview,
  type TrialUnit,
} from '@/lib/admin/trial-adjustment';

export type ExtendTrialTarget = {
  ids: string[];
  name: string;
  /** Current trial end as computed by the server (null in bulk mode). */
  currentEndsAt: string | null;
  /** True when the trial has already ended (server status trial_expired). */
  expired: boolean;
};

type Props = {
  target: ExtendTrialTarget;
  onClose: () => void;
  /** Called after the server confirmed the change, so the list can reload. */
  onChanged: () => void;
};

export default function ExtendTrialModal({ target, onClose, onChanged }: Props) {
  const bulk = target.ids.length > 1;
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<TrialUnit>('days');
  // Expired trial: count from now (adding to the old, past end date would often
  // still leave it expired). Active trial: add to the current end.
  const [mode, setMode] = useState<TrialMode>(target.expired ? 'from_now' : 'extend');
  const [allowShorten, setAllowShorten] = useState(false);

  const [preview, setPreview] = useState<TrialPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<TrialGrantRow[] | null>(null);

  const amountError = amount === '' ? null : validateAmount(amount, unit);
  const amountValid = amount !== '' && amountError === null;
  const requestSeq = useRef(0);

  // Server-computed preview (single establishment). The browser clock is never used
  // to derive an expiry: the RPC answers with both the current and the new end.
  useEffect(() => {
    setPreview(null);
    setPreviewError(null);
    setAllowShorten(false);
    if (bulk || !amountValid || confirmed) return;
    const seq = ++requestSeq.current;
    setPreviewLoading(true);
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data, error: rpcError } = await (supabase as any).rpc('admin_preview_trial_adjustment', {
        p_establishment_id: target.ids[0],
        p_amount: Number(amount),
        p_unit: unit,
        p_mode: mode,
      });
      if (seq !== requestSeq.current) return;
      setPreviewLoading(false);
      if (rpcError) {
        setPreviewError(describeTrialError(rpcError));
        return;
      }
      setPreview(firstRow<TrialPreview>(data));
    }, 350);
    return () => {
      clearTimeout(timer);
      setPreviewLoading(false);
    };
  }, [amount, unit, mode, amountValid, bulk, target.ids, confirmed]);

  const canConfirm =
    amountValid &&
    !saving &&
    !confirmed &&
    (bulk || (!!preview && !previewError)) &&
    (!preview?.shortens || allowShorten);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: rpcError } = await (supabase as any).rpc('admin_grant_trial_time', {
        p_establishment_ids: target.ids,
        p_amount: Number(amount),
        p_unit: unit,
        p_mode: mode,
        p_allow_shorten: allowShorten,
      });
      // supabase-js does not throw on RPC failures. Success is shown only when the
      // server answered without error AND returned the audited rows.
      if (rpcError) {
        setError(describeTrialError(rpcError));
        return;
      }
      const rows = (Array.isArray(data) ? data : data ? [data] : []) as TrialGrantRow[];
      if (rows.length === 0) {
        setError('O servidor não confirmou a alteração (nenhum registro retornado). Nada foi considerado salvo.');
        return;
      }
      setConfirmed(rows);
      onChanged();
    } catch (e) {
      console.error(e);
      setError('Falha de conexão: o servidor não confirmou a alteração. Verifique a lista antes de tentar novamente.');
    } finally {
      setSaving(false);
    }
  };

  const fromNow = mode === 'from_now';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Estender Trial"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-lg text-gray-900">Estender Trial</h2>
        <p className="text-sm text-gray-500 mb-4">
          {bulk ? `${target.ids.length} estabelecimentos selecionados` : target.name}
        </p>

        {confirmed ? (
          <div role="status" className="rounded-xl bg-green-50 border border-green-200 p-4 mb-4">
            <p className="text-sm font-semibold text-green-800 mb-1">Confirmado pelo servidor</p>
            {confirmed.length === 1 ? (
              <>
                <p className="text-sm text-green-800">Vencimento anterior: <b>{formatBrasilia(confirmed[0].previous_ends_at)}</b></p>
                <p className="text-sm text-green-800">Novo vencimento: <b>{formatBrasilia(confirmed[0].new_ends_at)}</b></p>
              </>
            ) : (
              <p className="text-sm text-green-800">{confirmed.length} estabelecimentos atualizados.</p>
            )}
          </div>
        ) : (
          <>
            {!bulk && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vencimento atual</p>
                <p className={`text-sm font-semibold ${target.expired ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatBrasilia(target.currentEndsAt)}
                  {target.expired && <span className="ml-2 text-xs font-medium bg-red-50 text-red-600 rounded-full px-2 py-0.5">vencido</span>}
                </p>
              </div>
            )}

            <label htmlFor="trial-amount" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Quantidade
            </label>
            <input
              id="trial-amount"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex.: 30"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm mb-3"
            />

            <p id="trial-unit-label" className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Unidade</p>
            <div role="radiogroup" aria-labelledby="trial-unit-label" className="grid grid-cols-3 gap-2 mb-1">
              {TRIAL_UNITS.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  role="radio"
                  aria-checked={unit === u.value}
                  onClick={() => setUnit(u.value)}
                  className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${
                    unit === u.value
                      ? 'bg-[#6666cc] border-[#6666cc] text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
            {amountError ? (
              <p role="alert" className="text-xs text-red-600 mb-3">{amountError}</p>
            ) : (
              <p className="text-xs text-gray-400 mb-3">Máximo de 365 dias.</p>
            )}

            {!bulk && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 mb-2" aria-live="polite">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Novo vencimento</p>
                {!amountValid && <p className="text-sm text-gray-400">Informe a quantidade para ver o novo vencimento.</p>}
                {amountValid && previewLoading && <p className="text-sm text-gray-400">Calculando…</p>}
                {previewError && <p role="alert" className="text-sm text-red-600">{previewError}</p>}
                {amountValid && preview && !previewLoading && (
                  <p className="text-sm font-semibold text-gray-900">{formatBrasilia(preview.new_ends_at)}</p>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500 mb-3">
              {fromNow ? 'O novo prazo conta a partir de agora.' : 'O novo prazo é somado ao vencimento atual.'}{' '}
              <button
                type="button"
                onClick={() => setMode(fromNow ? 'extend' : 'from_now')}
                className="text-[#6666cc] font-semibold underline underline-offset-2"
              >
                {fromNow ? 'Somar ao vencimento atual' : 'Contar a partir de agora'}
              </button>
            </p>
            {!fromNow && target.expired && !bulk && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                Este trial já venceu: somar ao vencimento antigo pode manter o acesso bloqueado.
              </p>
            )}

            {!bulk && preview?.shortens && (
              <label className="flex items-start gap-2 mb-3 rounded-lg bg-red-50 border border-red-200 p-2 text-red-700 text-xs cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={allowShorten} onChange={(e) => setAllowShorten(e.target.checked)} />
                <span>Isto <b>encurta</b> o trial atual. Confirmo que quero reduzir o prazo.</span>
              </label>
            )}
            {bulk && fromNow && (
              <label className="flex items-start gap-2 mb-3 rounded-lg bg-amber-50 border border-amber-200 p-2 text-amber-800 text-xs cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={allowShorten} onChange={(e) => setAllowShorten(e.target.checked)} />
                <span>Permitir que isto <b>encurte</b> trials que ainda têm mais tempo.</span>
              </label>
            )}
            {bulk && (
              <p className="text-xs text-gray-500 mb-3">O servidor calcula o vencimento de cada um; se algum falhar, nenhum é alterado.</p>
            )}
            {bulk && !fromNow && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                Trials que já venceram podem continuar vencidos ao somar. Para liberar agora, use “Contar a partir de agora”.
              </p>
            )}

            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">
                {error}
              </p>
            )}
          </>
        )}

        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            {confirmed ? 'Fechar' : 'Cancelar'}
          </button>
          {!confirmed && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex-1 h-11 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white font-semibold text-sm disabled:opacity-50 transition-colors"
            >
              {saving ? 'Salvando…' : 'Confirmar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
