'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Eye, TickCircle, CloseCircle } from 'iconsax-react';
import { Loader2, GripVertical } from 'lucide-react';
import Header from '@/components/dashboard/Header';
import { createClient } from '@/lib/supabase/client';

type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  description: string | null;
  sell_online: boolean;
  active: boolean;
  stock: number;
};

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CatalogoPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [estId, setEstId] = useState('');
  const [slug, setSlug] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: est } = await (supabase as any)
        .from('establishments')
        .select('id, slug')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (!est) { setLoading(false); return; }

      setEstId(est.id);
      setSlug(est.slug || '');

      const { data } = await (supabase as any)
        .from('products')
        .select('id, name, price, image_url, category, description, sell_online, active, stock')
        .eq('establishment_id', est.id)
        .order('name');

      setProducts(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const toggleOnline = async (product: CatalogProduct) => {
    setToggling(product.id);
    const newVal = !product.sell_online;
    const supabase = createClient();
    await (supabase as any).from('products').update({ sell_online: newVal }).eq('id', product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, sell_online: newVal } : p));
    setToggling(null);
  };

  const enableAll = async () => {
    const supabase = createClient();
    await (supabase as any).from('products').update({ sell_online: true }).eq('establishment_id', estId);
    setProducts(prev => prev.map(p => ({ ...p, sell_online: true })));
  };

  const disableAll = async () => {
    const supabase = createClient();
    await (supabase as any).from('products').update({ sell_online: false }).eq('establishment_id', estId);
    setProducts(prev => prev.map(p => ({ ...p, sell_online: false })));
  };

  const onlineCount = products.filter(p => p.sell_online).length;
  const offlineCount = products.filter(p => !p.sell_online).length;
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

  const filtered = filter === 'all' ? products :
    filter === 'online' ? products.filter(p => p.sell_online) :
    products.filter(p => !p.sell_online);

  const profileUrl = slug ? `https://appbello.com.br/p/${slug}` : '';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Catálogo Online" />

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">

        {/* Info */}
        <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 rounded-2xl p-5 border border-brand-primary/20">
          <h3 className="font-bold text-gray-900 mb-1">Configure seu catálogo</h3>
          <p className="text-sm text-gray-600">
            Escolha quais produtos do seu estoque aparecerão no catálogo público do seu link de agendamento. Seus clientes poderão visualizar os produtos, preços e fotos.
          </p>
          {profileUrl && (
            <a href={profileUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-brand-primary hover:underline">
              <Eye className="w-4 h-4" variant="Outline" /> Ver catálogo público
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-2">
              <ShoppingBag className="w-4 h-4 text-brand-primary" variant="Outline" />
            </div>
            <div className="font-bold text-lg text-gray-900">{loading ? '—' : products.length}</div>
            <div className="text-xs text-gray-400">Total de produtos</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <TickCircle className="w-4 h-4 text-green-600" variant="Outline" />
            </div>
            <div className="font-bold text-lg text-green-600">{loading ? '—' : onlineCount}</div>
            <div className="text-xs text-gray-400">No catálogo</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center mb-2">
              <CloseCircle className="w-4 h-4 text-gray-400" variant="Outline" />
            </div>
            <div className="font-bold text-lg text-gray-500">{loading ? '—' : offlineCount}</div>
            <div className="text-xs text-gray-400">Ocultos</div>
          </div>
        </div>

        {/* Filter + bulk actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {([
              { key: 'all', label: 'Todos', count: products.length },
              { key: 'online', label: 'No catálogo', count: onlineCount },
              { key: 'offline', label: 'Ocultos', count: offlineCount },
            ] as const).map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f.key ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {f.label} ({f.count})
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={enableAll} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 transition-colors">
              Exibir todos
            </button>
            <button onClick={disableAll} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
              Ocultar todos
            </button>
          </div>
        </div>

        {/* Product list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" variant="Outline" />
            <p className="font-medium text-gray-500 mb-1">Nenhum produto cadastrado</p>
            <p className="text-sm text-gray-400">Cadastre produtos na seção de Estoque para poder adicioná-los ao catálogo.</p>
            <a href="/dashboard/produtos" className="inline-flex items-center mt-4 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              Ir para Estoque
            </a>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            <p className="font-medium">Nenhum produto {filter === 'online' ? 'no catálogo' : 'oculto'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map(cat => {
              const catProducts = filtered.filter(p => p.category === cat);
              if (catProducts.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 mt-4 ml-1">{cat}</p>
                  {catProducts.map(p => (
                    <ProductRow key={p.id} product={p} toggling={toggling === p.id} onToggle={() => toggleOnline(p)} />
                  ))}
                </div>
              );
            })}
            {/* Products without category */}
            {filtered.filter(p => !p.category).length > 0 && (
              <div>
                {categories.length > 0 && <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 mt-4 ml-1">Sem categoria</p>}
                {filtered.filter(p => !p.category).map(p => (
                  <ProductRow key={p.id} product={p} toggling={toggling === p.id} onToggle={() => toggleOnline(p)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tip */}
        {products.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-sm text-gray-400">
              Para adicionar novos produtos ou editar preços e fotos, acesse a seção{' '}
              <a href="/dashboard/produtos" className="text-brand-primary font-semibold hover:underline">Estoque</a>.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function ProductRow({ product, toggling, onToggle }: { product: CatalogProduct; toggling: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 mb-2 hover:shadow-sm transition-shadow">
      {/* Image */}
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-gray-300" variant="Outline" />
            </div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-bold text-sm text-brand-primary">{fmt(product.price)}</span>
          {product.category && (
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">{product.category}</span>
          )}
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`text-xs font-semibold ${product.sell_online ? 'text-green-600' : 'text-gray-400'}`}>
          {product.sell_online ? 'Visível' : 'Oculto'}
        </span>
        <button
          onClick={onToggle}
          disabled={toggling}
          className={`relative w-11 h-6 rounded-full transition-colors ${product.sell_online ? 'bg-green-500' : 'bg-gray-200'} ${toggling ? 'opacity-50' : ''}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${product.sell_online ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
    </div>
  );
}
