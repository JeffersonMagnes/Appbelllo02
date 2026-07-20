'use client';

import { useEffect, useRef, useState } from 'react';
import { FeatureGate } from '@/components/dashboard/FeatureGate';
import { SearchNormal1, Add, ClipboardText, ArrowRight2, CloseCircle, Card, Money, Mobile, User, Printer, Trash, TickSquare } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/dashboard/Header';
import { createClient } from '@/lib/supabase/client';

type ComandaItem = { id: string; description: string; quantity: number; unit_price: number; type: string };
type Comanda = { id: string; client_name: string | null; status: string; total: number; discount: number; payment_method: string | null; created_at: string; items?: ComandaItem[] };
type PaymentSlice = { method: string; amount: number };
type Client = { id: string; name: string; phone: string | null };

const STATUS_LABELS: Record<string, string> = { open: 'Aberta', paid: 'Paga', cancelled: 'Cancelada' };
const STATUS_COLORS: Record<string, string> = { open: 'bg-amber-100 text-amber-700', paid: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-500' };
const METHODS = [
  { v: 'pix', l: 'PIX', Icon: Mobile, color: '#0BBDB6' },
  { v: 'credito', l: 'Crédito', Icon: Card, color: '#7C3AED' },
  { v: 'debito', l: 'Débito', Icon: Card, color: '#3B82F6' },
  { v: 'dinheiro', l: 'Dinheiro', Icon: Money, color: '#22C55E' },
  { v: 'cheque', l: 'Cheque', Icon: Card, color: '#F59E0B' },
  { v: 'cortesia', l: 'Cortesia', Icon: TickSquare, color: '#EC4899' },
];
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ComandasPage() {
  const createKey = useRef<string | null>(null);
  const closeKey = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [estId, setEstId] = useState('');
  const [estName, setEstName] = useState('');
  const [services, setServices] = useState<{ id: string; name: string; price: number }[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'paid' | 'cancelled'>('all');
  const [viewComanda, setViewComanda] = useState<Comanda | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newClientName, setNewClientName] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ description: string; unit_price: number; quantity: number; type: string }[]>([]);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  // Payment state
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState('');
  const [paymentSlices, setPaymentSlices] = useState<PaymentSlice[]>([]);
  const [sliceMethod, setSliceMethod] = useState('pix');
  const [sliceAmount, setSliceAmount] = useState('');

  // Receipt state
  const [receiptData, setReceiptData] = useState<{ comanda: Comanda; slices: PaymentSlice[]; discount: number; finalTotal: number } | null>(null);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: estRaw } = await supabase.from('establishments').select('id,name').eq('owner_id', user.id).maybeSingle();
    const est = estRaw as { id: string; name?: string } | null;
    if (!est) { setLoading(false); return; }
    setEstId(est.id);
    setEstName(est.name || 'Estabelecimento');
    const [cmdRes, svcRes, cliRes] = await Promise.all([
      (supabase as any).from('comandas').select('*').eq('establishment_id', est.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('services').select('id,name,price').eq('establishment_id', est.id).eq('active', true),
      supabase.from('clients').select('id,name,phone').eq('establishment_id', est.id).order('name'),
    ]);
    setComandas(cmdRes.data || []);
    setServices((svcRes.data || []).map((s: any) => ({ id: s.id, name: s.name, price: parseFloat(s.price || 0) })));
    setClients((cliRes.data || []).map((c: any) => ({ id: c.id, name: c.name, phone: c.phone ?? null })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = comandas.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search && !c.client_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const loadComandaItems = async (comandaId: string) => {
    const supabase = createClient();
    const { data } = await (supabase as any).from('comanda_items').select('*').eq('comanda_id', comandaId);
    return data || [];
  };

  const handleViewComanda = async (c: Comanda) => {
    const items = await loadComandaItems(c.id);
    setViewComanda({ ...c, items });
  };

  const addServiceToComanda = (svc: { id: string; name: string; price: number }) => {
    setSelectedItems(prev => {
      const ex = prev.find(i => i.description === svc.name);
      if (ex) return prev.map(i => i.description === svc.name ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { description: svc.name, unit_price: svc.price, quantity: 1, type: 'service' }];
    });
  };

  const addCustomItem = () => {
    if (!customItemName.trim() || !customItemPrice) return;
    setSelectedItems(prev => [...prev, { description: customItemName.trim(), unit_price: parseFloat(customItemPrice), quantity: 1, type: 'service' }]);
    setCustomItemName('');
    setCustomItemPrice('');
  };

  const newTotal = selectedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const handleCreateComanda = async () => {
    if (!newClientName.trim() || selectedItems.length === 0) return;
    setSaving(true);
    const supabase = createClient();
    createKey.current ||= crypto.randomUUID();
    const { error } = await (supabase as any).rpc('create_comanda_with_items', {
      p_establishment_id: estId,
      p_client_id: null,
      p_client_name: newClientName,
      p_items: selectedItems,
      p_notes: null,
      p_idempotency_key: createKey.current,
    });
    if (error) { console.error('create comanda failed', error); setSaving(false); return; }
    createKey.current = null;
    setSaving(false);
    setShowNew(false);
    setNewClientName('');
    setClientSearch('');
    setSelectedItems([]);
    load();
  };

  // Payment calculations
  const computeDiscount = (total: number) => {
    if (discountType === 'none') return 0;
    const val = parseFloat(discountValue) || 0;
    if (discountType === 'percent') return Math.min(total, (total * val) / 100);
    return Math.min(total, val);
  };

  const openPayment = () => {
    setDiscountType('none');
    setDiscountValue('');
    setPaymentSlices([]);
    setSliceMethod('pix');
    setSliceAmount('');
    setShowPayment(true);
  };

  const payFinalTotal = viewComanda ? Math.max(0, viewComanda.total - computeDiscount(viewComanda.total)) : 0;
  const payTotalPaid = paymentSlices.reduce((s, p) => s + p.amount, 0);
  const payRemaining = Math.max(0, payFinalTotal - payTotalPaid);

  const addSlice = () => {
    const amt = parseFloat(sliceAmount) || 0;
    if (amt <= 0) return;
    setPaymentSlices(prev => [...prev, { method: sliceMethod, amount: Math.min(amt, payRemaining) }]);
    setSliceAmount('');
  };

  const fillMax = () => {
    setSliceAmount(payRemaining.toFixed(2));
  };

  const removeSlice = (idx: number) => {
    setPaymentSlices(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePay = async () => {
    if (!viewComanda || payRemaining > 0.01) return;
    setSaving(true);
    const supabase = createClient();
    const discount = computeDiscount(viewComanda.total);
    closeKey.current ||= crypto.randomUUID();
    const { error } = await (supabase as any).rpc('close_comanda', {
      p_comanda_id: viewComanda.id,
      p_discount: discount,
      p_payments: paymentSlices,
      p_idempotency_key: closeKey.current,
    });
    if (error) { console.error('close comanda failed', error); setSaving(false); return; }
    closeKey.current = null;
    setReceiptData({ comanda: { ...viewComanda, status: 'paid', discount }, slices: paymentSlices, discount, finalTotal: payFinalTotal });
    setSaving(false);
    setShowPayment(false);
    setShowReceipt(true);
    load();
  };

  const openReceiptForPaid = (c: Comanda) => {
    setReceiptData({
      comanda: c,
      slices: [{ method: c.payment_method || 'pix', amount: Math.max(0, c.total - (c.discount || 0)) }],
      discount: c.discount || 0,
      finalTotal: Math.max(0, c.total - (c.discount || 0)),
    });
    setShowReceipt(true);
  };

  const printReceipt = () => {
    window.print();
  };

  const openCount = comandas.filter(c => c.status === 'open').length;
  const openTotal = comandas.filter(c => c.status === 'open').reduce((s, c) => s + c.total, 0);

  return (
    <FeatureGate featureKey="comandas">
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Comandas" />
      <main className="flex-1 p-4 sm:p-6 space-y-4 max-w-3xl mx-auto w-full">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Abertas</p>
            <p className="text-2xl font-extrabold text-amber-600">{openCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Total em aberto</p>
            <p className="text-2xl font-extrabold text-brand-primary">{fmt(openTotal)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" variant="Outline" />
            <Input placeholder="Buscar por cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl border-gray-200" />
          </div>
          <Button onClick={() => setShowNew(true)} className="gradient-primary text-white rounded-xl h-10 px-4 flex-shrink-0">
            <Add className="w-4 h-4 mr-1" variant="Outline" /> Nova
          </Button>
        </div>

        {/* Filter */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 w-fit gap-1">
          {(['all', 'open', 'paid', 'cancelled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-brand-primary text-white shadow' : 'text-gray-500'}`}>
              {{ all: 'Todas', open: 'Abertas', paid: 'Pagas', cancelled: 'Canceladas' }[f]}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <ClipboardText className="w-12 h-12 mx-auto mb-3 opacity-30" variant="Outline" />
            <p className="font-medium text-sm">{search ? 'Nenhuma comanda encontrada' : 'Nenhuma comanda criada'}</p>
            <p className="text-xs mt-1">Clique em &quot;+ Nova&quot; para criar a primeira comanda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c.id} onClick={() => handleViewComanda(c)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-brand-primary" variant="Outline" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{c.client_name || 'Cliente'}</p>
                  <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">{fmt(c.total)}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                </div>
                <ArrowRight2 className="w-4 h-4 text-gray-300 flex-shrink-0" variant="Outline" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* View/Pay Modal */}
      {viewComanda && !showPayment && !showReceipt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-5">
              <div className="flex justify-between items-start text-white">
                <div>
                  <p className="font-black text-lg">{viewComanda.client_name}</p>
                  <p className="text-white/70 text-xs">{new Date(viewComanda.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <button onClick={() => setViewComanda(null)}><CloseCircle className="w-5 h-5 text-white/70" variant="Outline" /></button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                {(viewComanda.items || []).map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.quantity}x {item.description}</span>
                    <span className="font-semibold text-gray-900">{fmt(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
                {(!viewComanda.items || viewComanda.items.length === 0) && <p className="text-sm text-gray-400 text-center">Carregando itens...</p>}
              </div>
              {viewComanda.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto</span>
                  <span>-{fmt(viewComanda.discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-brand-primary text-lg">{fmt(Math.max(0, viewComanda.total - (viewComanda.discount || 0)))}</span>
              </div>
              {viewComanda.status === 'open' && (
                <div className="flex gap-2">
                  <Button onClick={openPayment} className="flex-1 gradient-primary text-white rounded-xl h-11 font-bold">
                    Cobrar agora
                  </Button>
                </div>
              )}
              {viewComanda.status === 'paid' && (
                <div className="space-y-2">
                  <div className="w-full h-10 rounded-xl bg-green-50 text-green-700 font-bold text-sm flex items-center justify-center gap-2">
                    <TickSquare className="w-4 h-4" variant="Outline" /> Paga via {viewComanda.payment_method || '—'}
                  </div>
                  <Button variant="outline" onClick={() => { setViewComanda(null); openReceiptForPaid(viewComanda); }} className="w-full rounded-xl h-10 text-sm font-semibold">
                    <Printer className="w-4 h-4 mr-1.5" variant="Outline" /> Ver / Reimprimir Recibo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPayment && viewComanda && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Registrar pagamento</h3>
                <p className="text-xs text-gray-500">{viewComanda.client_name}</p>
              </div>
              <button onClick={() => setShowPayment(false)}><CloseCircle className="w-5 h-5 text-gray-400" variant="Outline" /></button>
            </div>

            {/* Discount type */}
            <div>
              <Label className="text-sm font-medium text-gray-700 block mb-2">Desconto</Label>
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-2">
                {([
                  { v: 'none' as const, l: 'Sem desconto' },
                  { v: 'percent' as const, l: '% Porcentagem' },
                  { v: 'fixed' as const, l: 'R$ Valor fixo' },
                ]).map(d => (
                  <button key={d.v} onClick={() => { setDiscountType(d.v); setDiscountValue(''); setPaymentSlices([]); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${discountType === d.v ? 'bg-white shadow text-brand-primary' : 'text-gray-500'}`}>
                    {d.l}
                  </button>
                ))}
              </div>
              {discountType !== 'none' && (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">
                    {discountType === 'percent' ? '%' : 'R$'}
                  </span>
                  <Input type="number" min="0" value={discountValue}
                    onChange={e => { setDiscountValue(e.target.value); setPaymentSlices([]); }}
                    placeholder="0" className="pl-9 rounded-xl border-gray-200 h-10" />
                </div>
              )}
              {discountType !== 'none' && parseFloat(discountValue) > 0 && (
                <p className="text-xs text-green-600 mt-1 font-medium">Desconto de {fmt(computeDiscount(viewComanda.total))}</p>
              )}
            </div>

            {/* Total */}
            <div className="bg-brand-primary/5 rounded-xl p-4">
              {viewComanda.total !== payFinalTotal && (
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Subtotal</span>
                  <span className="line-through">{fmt(viewComanda.total)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-brand-primary text-lg">
                <span>Total a cobrar</span>
                <span>{fmt(payFinalTotal)}</span>
              </div>
            </div>

            {/* Payment slices */}
            {paymentSlices.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Pagamentos adicionados</Label>
                {paymentSlices.map((sl, i) => {
                  const m = METHODS.find(x => x.v === sl.method);
                  return (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (m?.color || '#5333ED') + '20' }}>
                        {m && <m.Icon className="w-4 h-4" style={{ color: m.color }} variant="Outline" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{m?.l || sl.method}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{fmt(sl.amount)}</p>
                      <button onClick={() => removeSlice(i)} className="text-gray-300 hover:text-red-400">
                        <Trash className="w-4 h-4" variant="Outline" />
                      </button>
                    </div>
                  );
                })}
                {/* Progress bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{
                    width: `${Math.min(100, (payTotalPaid / payFinalTotal) * 100)}%`,
                    background: payRemaining <= 0.01 ? '#22C55E' : 'linear-gradient(90deg,#5333ED,#0BBDB6)',
                  }} />
                </div>
                <p className="text-xs text-gray-500 text-right">
                  Pago: {fmt(payTotalPaid)} / {fmt(payFinalTotal)}
                  {payRemaining > 0.01 && <span className="text-amber-600 ml-1">· Falta {fmt(payRemaining)}</span>}
                </p>
              </div>
            )}

            {/* Add payment slice */}
            {payRemaining > 0.01 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  {paymentSlices.length === 0 ? 'Forma de pagamento' : 'Adicionar pagamento'}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {METHODS.map(m => (
                    <button key={m.v} onClick={() => setSliceMethod(m.v)}
                      className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center gap-2 ${sliceMethod === m.v ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-gray-200 text-gray-600'}`}>
                      <m.Icon className="w-4 h-4" variant="Outline" /> {m.l}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">R$</span>
                    <Input type="number" min="0" step="0.01" value={sliceAmount} onChange={e => setSliceAmount(e.target.value)}
                      placeholder="0,00" className="pl-9 rounded-xl border-gray-200 h-10" />
                  </div>
                  <Button type="button" variant="outline" onClick={fillMax} className="rounded-xl h-10 px-3 text-xs font-bold">MAX</Button>
                  <Button type="button" onClick={addSlice} className="gradient-primary text-white rounded-xl h-10 px-4 font-bold">
                    <Add className="w-4 h-4" variant="Outline" />
                  </Button>
                </div>
              </div>
            )}

            {/* Confirm */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowPayment(false)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={handlePay} disabled={saving || payRemaining > 0.01} className="flex-1 gradient-primary text-white rounded-xl font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : payRemaining <= 0.01 ? 'Confirmar' : `Falta ${fmt(payRemaining)}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Receipt content — printable */}
            <div id="receipt-content" className="print:shadow-none">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-5 text-white text-center">
                <p className="font-bold text-lg">{estName}</p>
                <p className="text-white/60 text-xs mt-1">Recibo de Pagamento</p>
                <p className="text-white/50 text-xs mt-0.5">
                  {new Date().toLocaleDateString('pt-BR')} · {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold">
                  <TickSquare className="w-3.5 h-3.5" variant="Outline" /> PAGO
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" variant="Outline" />
                  <span className="font-semibold text-gray-900">{receiptData.comanda.client_name || 'Cliente'}</span>
                </div>
                {(receiptData.comanda.items || []).length > 0 && (
                  <div className="space-y-1.5">
                    {(receiptData.comanda.items || []).map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.quantity}x {item.description}</span>
                        <span className="font-medium text-gray-900">{fmt(item.unit_price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-dashed border-gray-200 pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{fmt(receiptData.comanda.total)}</span>
                  </div>
                  {receiptData.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto</span>
                      <span>-{fmt(receiptData.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1">
                    <span>TOTAL</span>
                    <span className="text-brand-primary">{fmt(receiptData.finalTotal)}</span>
                  </div>
                </div>
                <div className="border-t border-dashed border-gray-200 pt-3 space-y-1.5">
                  {receiptData.slices.map((sl, i) => {
                    const m = METHODS.find(x => x.v === sl.method);
                    return (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-500">{m?.l || sl.method}</span>
                        <span className="text-gray-900">{fmt(sl.amount)}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-center text-xs text-gray-400 pt-2">Obrigado pela preferencia!</p>
              </div>
            </div>
            {/* Actions — hidden on print */}
            <div className="p-4 border-t border-gray-100 flex gap-3 print:hidden">
              <Button variant="outline" onClick={() => { setShowReceipt(false); setViewComanda(null); }} className="flex-1 rounded-xl">Fechar</Button>
              <Button onClick={printReceipt} className="flex-1 gradient-primary text-white rounded-xl font-bold">
                <Printer className="w-4 h-4 mr-1.5" variant="Outline" /> Imprimir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New comanda modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Nova comanda</h3>
              <button onClick={() => { setShowNew(false); setClientSearch(''); setNewClientName(''); setSelectedItems([]); }}><CloseCircle className="w-5 h-5 text-gray-400" variant="Outline" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <Label className="text-sm font-medium text-gray-700">Nome do cliente</Label>
                <div className="relative mt-1">
                  <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" variant="Outline" />
                  <Input
                    value={clientSearch}
                    onChange={e => { setClientSearch(e.target.value); setNewClientName(e.target.value); setShowClientDropdown(true); }}
                    onFocus={() => setShowClientDropdown(true)}
                    onBlur={() => setTimeout(() => setShowClientDropdown(false), 150)}
                    placeholder="Buscar cliente cadastrado..."
                    className="pl-9 rounded-xl border-gray-200 h-10"
                    autoFocus
                  />
                </div>
                {showClientDropdown && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">
                        {clientSearch ? `Nenhum cliente com "${clientSearch}"` : 'Nenhum cliente cadastrado'}
                      </div>
                    ) : (
                      clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => { setNewClientName(c.name); setClientSearch(c.name); setShowClientDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-primary/5 text-left transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-brand-primary" variant="Outline" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                            {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 block mb-2">Serviços do catálogo</Label>
                <div className="flex flex-wrap gap-2">
                  {services.map(s => (
                    <button key={s.id} type="button" onClick={() => addServiceToComanda(s)}
                      className="px-3 h-8 rounded-full border-2 border-gray-200 text-xs font-medium text-gray-600 hover:border-brand-primary hover:text-brand-primary transition-all">
                      {s.name} · {fmt(s.price)}
                    </button>
                  ))}
                  {services.length === 0 && <p className="text-xs text-gray-400">Nenhum serviço cadastrado ainda.</p>}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 block mb-2">Adicionar item manual</Label>
                <div className="flex gap-2">
                  <Input value={customItemName} onChange={e => setCustomItemName(e.target.value)} placeholder="Nome do item" className="flex-1 rounded-xl border-gray-200 h-9 text-sm" />
                  <Input type="number" value={customItemPrice} onChange={e => setCustomItemPrice(e.target.value)} placeholder="R$" className="w-20 rounded-xl border-gray-200 h-9 text-sm" />
                  <Button type="button" onClick={addCustomItem} variant="outline" className="h-9 px-3 rounded-xl text-xs">+</Button>
                </div>
              </div>
              {selectedItems.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  {selectedItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.quantity}x {item.description}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{fmt(item.unit_price * item.quantity)}</span>
                        <button onClick={() => setSelectedItems(p => p.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400">
                          <CloseCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm">
                    <span>Total</span><span className="text-brand-primary">{fmt(newTotal)}</span>
                  </div>
                </div>
              )}
              <Button onClick={handleCreateComanda} disabled={saving || !newClientName.trim() || selectedItems.length === 0}
                className="w-full gradient-primary text-white rounded-xl h-11 font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar comanda'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </FeatureGate>
  );
}
