'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  BRASILIA_LABEL,
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
  // An expired trial defaults to "from now": adding to the old, past end date would
  // often still leave it expired and force the admin to compensate the whole gap.
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

  const needsShortenConfirm = bulk ? mode === 'from_now' : !!preview?.shortens;
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

  const unitLabel = TRIAL_UNITS.find((u) => u.value === unit)!.label.toLowerCase();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Estender Trial"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-lg text-gray-900 mb-1">Estender Trial</h2>
        <p className="text-sm text-gray-500 mb-4">
          {bulk ? `${target.ids.length} estabelecimentos selecionados` : target.name}
        </p>

        {confirmed ? (
          <div role="status" className="rounded-xl bg-green-50 border border-green-200 p-4 mb-4">
            <p className="text-sm font-semibold text-green-800 mb-1">Confirmado pelo servidor</p>
            {confirmed.length === 1 ? (
              <>
                <p className="text-sm text-green-800">
                  Vencimento anterior: <b>{formatBrasilia(confirmed[0].previous_ends_at)}</b>
                </p>
                <p className="text-sm text-green-800">
                  Novo vencimento: <b>{formatBrasilia(confirmed[0].new_ends_at)}</b>
                </p>
              </>
            ) : (
              <p className="text-sm text-green-800">{confirmed.length} estabelecimentos atualizados e registrados na auditoria.</p>
            )}
            <p className="text-xs text-green-700 mt-2">Alteração registrada com seu usuário, data e horário.</p>
          </div>
        ) : (
          <>
            {!bulk && (
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 mb-4 text-sm">
                <p className="text-gray-500">
                  Vencimento atual{target.expired ? ' (já vencido)' : ''}:
                </p>
                <p className={`font-semibold ${target.expired ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatBrasilia(target.currentEndsAt)}
                </p>
              </div>
            )}

            <fieldset className="mb-4">
              <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                A partir de quando contar
              </legend>
              <label className={`flex items-start gap-2 rounded-xl border p-3 mb-2 cursor-pointer ${mode === 'from_now' ? 'border-[#6666cc] bg-[#6666cc]/5' : 'border-gray-200'}`}>
                <input type="radio" name="trial-mode" className="mt-1" checked={mode === 'from_now'} onChange={() => setMode('from_now')} />
                <span className="text-sm">
                  <b>A partir de agora</b>
                  {target.expired && !bulk ? ' (recomendado)' : ''}
                  <span className="block text-gray-500">
                    Novo vencimento = agora (horário do servidor) + duração. Ignora o vencimento antigo.
                  </span>
                </span>
              </label>
              <label className={`flex items-start gap-2 rounded-xl border p-3 cursor-pointer ${mode === 'extend' ? 'border-[#6666cc] bg-[#6666cc]/5' : 'border-gray-200'}`}>
                <input type="radio" name="trial-mode" className="mt-1" checked={mode === 'extend'} onChange={() => setMode('extend')} />
                <span className="text-sm">
                  <b>Somar ao vencimento atual</b>
                  <span className="block text-gray-500">
                    Novo vencimento = vencimento atual{bulk ? ' de cada estabelecimento' : ''} + duração.
                  </span>
                </span>
              </label>
              {mode === 'extend' && target.expired && !bulk && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                  O trial já venceu. Somar a partir do vencimento antigo pode manter o acesso bloqueado.
                </p>
              )}
            </fieldset>

            <div className="flex gap-2 mb-1">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Quantidade"
                aria-label="Quantidade"
                className="flex-1 h-11 px-4 rounded-xl border border-gray-200 text-sm"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as TrialUnit)}
                aria-label="Unidade"
                className="h-11 px-3 rounded-xl border border-gray-200 text-sm bg-white"
              >
                {TRIAL_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-400 mb-3">Máximo de 365 dias no total.</p>
            {amountError && <p role="alert" className="text-xs text-red-600 mb-3">{amountError}</p>}

            {!bulk && amountValid && (
              <div className="rounded-xl border border-gray-200 p-3 mb-4 text-sm" aria-live="polite">
                <p className="text-gray-500">Prévia do novo vencimento ({BRASILIA_LABEL}):</p>
                {previewLoading && <p className="text-gray-400">Calculando no servidor…</p>}
                {previewError && <p role="alert" className="text-red-600">{previewError}</p>}
                {preview && !previewLoading && (
                  <>
                    <p className="font-semibold text-gray-900">{formatBrasilia(preview.new_ends_at)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {mode === 'from_now'
                        ? `Calculado pelo servidor em ${formatBrasilia(preview.server_time)}; o valor final é recalculado ao confirmar.`
                        : `Vencimento atual + ${amount} ${unitLabel}.`}
                    </p>
                    {preview.shortens && (
                      <label className="flex items-start gap-2 mt-3 rounded-lg bg-red-50 border border-red-200 p-2 text-red-700 text-xs cursor-pointer">
                        <input type="checkbox" className="mt-0.5" checked={allowShorten} onChange={(e) => setAllowShorten(e.target.checked)} />
                        <span>Isto <b>encurta</b> o trial atual. Confirmo que quero reduzir o prazo deste estabelecimento.</span>
                      </label>
                    )}
                  </>
                )}
              </div>
            )}

            {bulk && (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  O servidor calcula o vencimento de cada estabelecimento ao confirmar; se qualquer um falhar, nenhum é alterado.
                </p>
                {needsShortenConfirm && (
                  <label className="flex items-start gap-2 mb-3 rounded-lg bg-amber-50 border border-amber-200 p-2 text-amber-800 text-xs cursor-pointer">
                    <input type="checkbox" className="mt-0.5" checked={allowShorten} onChange={(e) => setAllowShorten(e.target.checked)} />
                    <span>Permitir que “a partir de agora” <b>encurte</b> trials que ainda têm mais tempo.</span>
                  </label>
                )}
              </>
            )}

            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">
                {error}
              </p>
            )}
          </>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            {confirmed ? 'Fechar' : 'Cancelar'}
          </button>
          {!confirmed && (
            <button
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
