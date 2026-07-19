'use client';

import { useEffect, useState } from 'react';
import { Wallet, Add, Minus, Clock, DollarCircle, CloseCircle, TrendUp, TrendDown, TickSquare, Lock1, Unlock } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

type Movement = { id: string; type: string; amount: number; description: string; payment_method: string | null; date: string; created_at: string; category?: string };

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const PM_LABELS: Record<string, string> = { pix: 'PIX', dinheiro: 'Dinheiro', credito: 'Crédito', debito: 'Débito', cheque: 'Cheque', cortesia: 'Cortesia', outro: 'Outro' };

export default function CaixaPage() {
  const [loading, setLoading] = useState(true);
  const [estId, setEstId] = useState('');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [showModal, setShowModal] = useState<'deposit' | 'withdraw' | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalAmount, setModalAmount] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalMethod, setModalMethod] = useState('dinheiro');
  const [openingAmount, setOpeningAmount] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: estRaw } = await supabase.from('establishments').select('id').eq('owner_id', user.id).maybeSingle();
    const est = estRaw as { id: string } | null;
    if (!est) { setLoading(false); return; }
    setEstId(est.id);
    const { data } = await (supabase as any).from('transactions').select('*').eq('establishment_id', est.id).eq('date', today).order('created_at');
    setMovements(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const isOpen = movements.some(m => m.category === 'abertura');
  const isClosed = movements.some(m => m.category === 'fechamento');
  const openingMove = movements.find(m => m.category === 'abertura');
  const openingBalance = openingMove ? parseFloat(String(openingMove.amount)) : 0;

  const operationalMoves = movements.filter(m => m.category !== 'abertura' && m.category !== 'fechamento');
  const incomes = operationalMoves.filter(m => m.type === 'receita' || m.type === 'income');
  const expenses = operationalMoves.filter(m => m.type === 'despesa' || m.type === 'expense');
  const totalIncome = incomes.reduce((s, m) => s + parseFloat(String(m.amount)), 0);
  const totalExpense = expenses.reduce((s, m) => s + parseFloat(String(m.amount)), 0);
  const balance = openingBalance + totalIncome - totalExpense;

  const cashIncome = incomes.filter(m => m.payment_method === 'dinheiro' || m.payment_method === 'cash').reduce((s, m) => s + parseFloat(String(m.amount)), 0);
  const pixIncome = incomes.filter(m => m.payment_method === 'pix').reduce((s, m) => s + parseFloat(String(m.amount)), 0);
  const cardIncome = incomes.filter(m => ['credito', 'debito', 'credit', 'debit'].includes(m.payment_method || '')).reduce((s, m) => s + parseFloat(String(m.amount)), 0);

  const handleOpenRegister = async () => {
    if (!openingAmount) return;
    setSaving(true);
    const supabase = createClient();
    await (supabase as any).from('transactions').insert({
      establishment_id: estId, type: 'income', amount: parseFloat(openingAmount),
      description: 'Abertura de Caixa', payment_method: 'dinheiro', date: today, category: 'abertura',
    });
    setSaving(false);
    setShowOpenModal(false);
    setOpeningAmount('');
    load();
  };

  const handleCloseRegister = async () => {
    setSaving(true);
    const supabase = createClient();
    await (supabase as any).from('transactions').insert({
      establishment_id: estId, type: 'expense', amount: 0,
      description: 'Fechamento de Caixa', payment_method: null, date: today, category: 'fechamento',
    });
    setSaving(false);
    setShowCloseModal(false);
    load();
  };

  const handleAddMovement = async () => {
    if (!modalAmount || parseFloat(modalAmount) <= 0) return;
    setSaving(true);
    const supabase = createClient();
    await (supabase as any).from('transactions').insert({
      establishment_id: estId,
      type: showModal === 'deposit' ? 'income' : 'expense',
      amount: parseFloat(modalAmount),
      description: modalDesc || (showModal === 'deposit' ? 'Entrada manual' : 'Sangria / Saída'),
      payment_method: showModal === 'deposit' ? modalMethod : 'dinheiro',
      date: today,
      category: showModal === 'deposit' ? 'reforco' : 'sangria',
    });
    setSaving(false);
    setShowModal(null);
    setModalAmount('');
    setModalDesc('');
    load();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Caixa" />
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 space-y-5">

        {/* Status banner */}
        {!loading && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 border ${isClosed ? 'bg-red-50 border-red-200' : isOpen ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            {isClosed ? <Lock1 className="w-5 h-5 text-red-500" variant="Outline" />
              : isOpen ? <Unlock className="w-5 h-5 text-green-600" variant="Outline" />
              : <Wallet className="w-5 h-5 text-amber-500" variant="Outline" />}
            <div className="flex-1">
              <p className={`text-sm font-bold ${isClosed ? 'text-red-800' : isOpen ? 'text-green-800' : 'text-amber-800'}`}>
                {isClosed ? 'Caixa fechado' : isOpen ? `Caixa aberto · Troco inicial: ${fmt(openingBalance)}` : 'Caixa não aberto hoje'}
              </p>
              {!isOpen && !isClosed && <p className="text-xs text-amber-600 mt-0.5">Abra o caixa para registrar movimentações.</p>}
            </div>
            {!isOpen && !isClosed && (
              <Button onClick={() => setShowOpenModal(true)} className="gradient-primary text-white rounded-xl h-9 text-sm font-bold">
                Abrir Caixa
              </Button>
            )}
            {isOpen && !isClosed && (
              <Button onClick={() => setShowCloseModal(true)} variant="outline" className="rounded-xl h-9 text-sm font-semibold border-red-200 text-red-500 hover:bg-red-50">
                Fechar Caixa
              </Button>
            )}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Entradas', value: fmt(totalIncome), color: 'text-green-600', bg: 'bg-green-50', Icon: TrendUp },
            { label: 'Saídas', value: fmt(totalExpense), color: 'text-red-500', bg: 'bg-red-50', Icon: TrendDown },
            { label: 'Saldo', value: fmt(balance), color: balance >= 0 ? 'text-brand-primary' : 'text-red-500', bg: 'bg-brand-primary/8', Icon: DollarCircle },
            { label: 'Movimentações', value: String(operationalMoves.length), color: 'text-gray-700', bg: 'bg-gray-100', Icon: Clock },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className={`w-8 h-8 ${c.bg} rounded-xl flex items-center justify-center mb-2`}>
                <c.Icon className={`w-4 h-4 ${c.color}`} variant="Outline" />
              </div>
              <div className={`font-bold text-base ${c.color}`}>{loading ? '—' : c.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Payment breakdown */}
        {!loading && isOpen && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4">Receitas por método</h3>
            <div className="grid grid-cols-3 gap-3">
              {[['Dinheiro', cashIncome, 'bg-green-100 text-green-700'], ['PIX', pixIncome, 'bg-[#5333ED]/10 text-brand-primary'], ['Cartão', cardIncome, 'bg-amber-50 text-amber-700']].map(([l, v, cls]) => (
                <div key={String(l)} className={`rounded-xl p-3 text-center ${cls}`}>
                  <div className="font-bold text-base">{fmt(Number(v))}</div>
                  <div className="text-xs font-medium mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {isOpen && !isClosed && (
          <div className="flex gap-3">
            <Button onClick={() => setShowModal('deposit')} className="flex-1 gradient-primary text-white rounded-xl h-11 font-semibold">
              <Add className="w-4 h-4 mr-1" variant="Outline" /> Entrada
            </Button>
            <Button onClick={() => setShowModal('withdraw')} variant="outline" className="flex-1 rounded-xl h-11 font-semibold border-red-200 text-red-500 hover:bg-red-50">
              <Minus className="w-4 h-4 mr-1" /> Sangria
            </Button>
          </div>
        )}

        {/* Movements list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">Movimentações de hoje</h3>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>
          {!loading && movements.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" variant="Outline" />
              <p className="font-medium text-sm">Nenhuma movimentação hoje</p>
              <p className="text-xs mt-1">Abra o caixa para começar.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {movements.map(m => {
                const isIncome = m.type === 'receita' || m.type === 'income';
                const isOpening = m.category === 'abertura';
                const isClosing = m.category === 'fechamento';
                return (
                  <div key={m.id} className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 ${isOpening || isClosing ? 'bg-gray-50' : ''}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isOpening ? 'bg-green-100' : isClosing ? 'bg-red-100' : isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                      {isOpening ? <Unlock className="w-4 h-4 text-green-600" variant="Outline" />
                        : isClosing ? <Lock1 className="w-4 h-4 text-red-500" variant="Outline" />
                        : isIncome ? <TrendUp className="w-4 h-4 text-green-600" variant="Outline" />
                        : <TrendDown className="w-4 h-4 text-red-500" variant="Outline" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isOpening || isClosing ? 'text-gray-700' : 'text-gray-900'}`}>{m.description || (isIncome ? 'Receita' : 'Despesa')}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {m.payment_method ? ` · ${PM_LABELS[m.payment_method] || m.payment_method}` : ''}
                      </p>
                    </div>
                    {!isClosing && (
                      <span className={`font-bold text-sm ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                        {isIncome ? '+' : '-'}{fmt(parseFloat(String(m.amount)))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Open Register Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Abrir Caixa</h3>
              <button onClick={() => setShowOpenModal(false)}><CloseCircle className="w-5 h-5 text-gray-400" variant="Outline" /></button>
            </div>
            <p className="text-sm text-gray-500">Informe o valor de troco inicial no caixa.</p>
            <div>
              <Label className="text-sm font-medium text-gray-700">Valor de abertura (R$)</Label>
              <Input type="number" min="0" step="0.01" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)}
                placeholder="0,00" className="mt-1 rounded-xl border-gray-200 h-10" autoFocus />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowOpenModal(false)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={handleOpenRegister} disabled={saving} className="flex-1 gradient-primary text-white rounded-xl font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Abrir Caixa'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Close Register Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Fechar Caixa</h3>
              <button onClick={() => setShowCloseModal(false)}><CloseCircle className="w-5 h-5 text-gray-400" variant="Outline" /></button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Resumo do dia</p>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Abertura</span><span className="font-semibold text-gray-900">{fmt(openingBalance)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Entradas</span><span className="font-semibold text-green-600">+{fmt(totalIncome)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Saídas</span><span className="font-semibold text-red-500">-{fmt(totalExpense)}</span></div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-bold text-gray-900">Saldo final</span>
                <span className={`font-extrabold text-lg ${balance >= 0 ? 'text-brand-primary' : 'text-red-500'}`}>{fmt(balance)}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Recebimentos por método</p>
              {[['Dinheiro', cashIncome], ['PIX', pixIncome], ['Cartão', cardIncome]].map(([l, v]) => (
                <div key={String(l)} className="flex justify-between text-sm">
                  <span className="text-gray-600">{l}</span>
                  <span className="font-semibold text-gray-900">{fmt(Number(v))}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowCloseModal(false)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={handleCloseRegister} disabled={saving} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Fechamento'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit/Withdraw Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{showModal === 'deposit' ? 'Registrar entrada' : 'Registrar saída (sangria)'}</h3>
              <button onClick={() => setShowModal(null)}><CloseCircle className="w-5 h-5 text-gray-400" variant="Outline" /></button>
            </div>
            <div className="space-y-3">
              <div><Label className="text-sm font-medium text-gray-700">Valor (R$)</Label>
                <Input type="number" min="0" step="0.01" value={modalAmount} onChange={e => setModalAmount(e.target.value)} className="mt-1 rounded-xl border-gray-200 h-10" autoFocus />
              </div>
              <div><Label className="text-sm font-medium text-gray-700">Descrição</Label>
                <Input value={modalDesc} onChange={e => setModalDesc(e.target.value)} className="mt-1 rounded-xl border-gray-200 h-10" placeholder="Opcional" />
              </div>
              {showModal === 'deposit' && (
                <div><Label className="text-sm font-medium text-gray-700">Forma de pagamento</Label>
                  <select value={modalMethod} onChange={e => setModalMethod(e.target.value)} className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none">
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="credito">Cartão Crédito</option>
                    <option value="debito">Cartão Débito</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowModal(null)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={handleAddMovement} disabled={saving} className={`flex-1 rounded-xl text-white font-semibold ${showModal === 'deposit' ? 'gradient-primary' : 'bg-red-500 hover:bg-red-600'}`}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
