'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Add, Eye, Pause, Copy, Trash, Play, Mouse } from 'iconsax-react';
import { Megaphone, BarChart2, Loader2 } from 'lucide-react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import KPICard from '@/components/admin/KPICard';
import StatusBadge from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface Ad {
  id: string;
  product_name: string;
  partner_name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  url: string;
  price: number | null;
  discount: number | null;
  tag: string | null;
  business_types: string[] | null;
  created_at: string;
}

export default function ParceirosPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewAd, setPreviewAd] = useState<Ad | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  async function fetchAds() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await (supabase as any).from('partner_ads').select('*').order('priority', { ascending: false });
    setAds((data as Ad[]) || []);
    setLoading(false);
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const supabase = createClient();
    await (supabase as any).from('partner_ads').update({ status: newStatus }).eq('id', id);
    setAds(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const duplicateAd = async (ad: Ad) => {
    const supabase = createClient();
    const { data } = await (supabase as any).from('partner_ads').insert({
      partner_name: ad.partner_name,
      product_name: `${ad.product_name} (Cópia)`,
      url: ad.url,
      status: 'draft',
      price: ad.price,
      discount: ad.discount,
      tag: ad.tag,
      business_types: ad.business_types,
    }).select().single();
    if (data) setAds(prev => [...prev, data as Ad]);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    await (supabase as any).from('partner_ads').delete().eq('id', deleteId);
    setAds(prev => prev.filter(a => a.id !== deleteId));
    setDeleteId(null);
  };

  const activeCount = ads.filter(a => a.status === 'active').length;

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—';

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Anúncios & Parceiros', 'Dashboard']} />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Anúncios & Parceiros</h1><p className="text-sm text-gray-500 mt-0.5">Banners e ofertas exibidos no app.</p></div>
          <Link href="/admin/parceiros/novo"><Button className="gap-2 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white"><Add className="w-4 h-4"  variant="Outline" /> Criar anúncio</Button></Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard title="Anúncios Ativos" value={String(activeCount)} icon={Megaphone} iconBg="bg-[#6666cc]/10" iconColor="text-[#6666cc]" />
          <KPICard title="Total de Anúncios" value={String(ads.length)} icon={Mouse} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <KPICard title="Parceiros" value={String(new Set(ads.map(a => a.partner_name)).size)} icon={BarChart2} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="font-bold text-gray-900">Anúncios</p>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>

          {!loading && ads.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              Nenhum anúncio cadastrado ainda.<br />
              <Link href="/admin/parceiros/novo" className="text-[#6666cc] font-medium hover:underline mt-1 inline-block">Criar primeiro anúncio →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500">
                    <th className="text-left px-5 py-3 font-semibold">Anúncio</th>
                    <th className="text-left px-4 py-3 font-semibold">Período</th>
                    <th className="text-left px-4 py-3 font-semibold">Desconto</th>
                    <th className="text-left px-4 py-3 font-semibold">Tipos</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-right px-5 py-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ads.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-900">{a.product_name}</p>
                        <p className="text-xs text-gray-400">{a.partner_name}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">
                        {formatDate(a.start_date)} – {formatDate(a.end_date)}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-gray-900">
                        {a.discount ? <span className="text-red-500 font-bold">-{a.discount}%</span> : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(a.business_types || []).map(t => (
                            <span key={t} className="text-xs bg-[#6666cc]/10 text-[#6666cc] px-2 py-0.5 rounded-full capitalize">{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={a.status === 'active' ? 'ativo' : a.status === 'paused' ? 'paused' : 'draft'} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setPreviewAd(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Eye className="w-4 h-4"  variant="Outline" /></button>
                          <button onClick={() => toggleStatus(a.id, a.status)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                            {a.status === 'active' ? <Pause className="w-4 h-4"  variant="Outline" /> : <Play className="w-4 h-4"  variant="Outline" />}
                          </button>
                          <button onClick={() => duplicateAd(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><Copy className="w-4 h-4"  variant="Outline" /></button>
                          <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash className="w-4 h-4"  variant="Outline" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Excluir anúncio</h2>
            <p className="text-sm text-gray-500 mb-6">Tem certeza? Essa ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {previewAd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreviewAd(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Detalhes do Anúncio</h2>
              <button onClick={() => setPreviewAd(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Produto', value: previewAd.product_name },
                { label: 'Parceiro', value: previewAd.partner_name },
                { label: 'URL', value: previewAd.url },
                { label: 'Desconto', value: previewAd.discount ? `-${previewAd.discount}%` : '—' },
                { label: 'Badge', value: previewAd.tag || '—' },
                { label: 'Status', value: previewAd.status },
                { label: 'Tipos', value: (previewAd.business_types || []).join(', ') },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900 text-right max-w-xs truncate">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setPreviewAd(null)} className="mt-5 w-full h-11 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white font-semibold text-sm transition-colors">Fechar</button>
          </div>
        </div>
      )}
    </>
  );
}
