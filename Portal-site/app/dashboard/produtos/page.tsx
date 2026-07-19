'use client';

import { useEffect, useRef, useState } from 'react';
import { FeatureGate } from '@/components/dashboard/FeatureGate';
import { Add, Box, Edit2, Camera, Trash } from 'iconsax-react';
import { Loader2, AlertTriangle, X, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/dashboard/Header';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/lib/supabase/types';

interface ExtraImage { id: string; image_url: string; }

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [estId, setEstId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', cost_price: '', stock: '', min_stock: '', category: '', barcode: '', description: '', sell_online: false });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [extraPreviews, setExtraPreviews] = useState<string[]>([]);
  const [existingExtras, setExistingExtras] = useState<ExtraImage[]>([]);
  const [removedExtras, setRemovedExtras] = useState<string[]>([]);
  const photoRef = useRef<HTMLInputElement>(null);
  const extrasRef = useRef<HTMLInputElement>(null);
  const [saveError, setSaveError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  const DEFAULT_CATEGORIES = ['Cabelo', 'Barba', 'Skincare', 'Coloração', 'Tratamento', 'Acessórios', 'Outros'];
  const savedCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
  const existingCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...savedCategories]));

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: estRaw } = await supabase.from('establishments').select('id').eq('owner_id', user.id).maybeSingle();
    const est = estRaw as { id: string } | null;
    if (!est) return;
    setEstId(est.id);
    const { data } = await supabase.from('products').select('*').eq('establishment_id', est.id).order('name');
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadExtras = async (productId: string) => {
    const supabase = createClient();
    const { data } = await (supabase as any).from('product_images').select('id,image_url').eq('product_id', productId).order('sort_order');
    setExistingExtras(data || []);
  };

  const resetForm = () => {
    setForm({ name: '', price: '', cost_price: '', stock: '', min_stock: '', category: '', barcode: '', description: '', sell_online: false });
    setPhotoFile(null); setPhotoPreview('');
    setExtraFiles([]); setExtraPreviews([]);
    setExistingExtras([]); setRemovedExtras([]);
    setSaveError(''); setShowNewCategory(false); setNewCategoryInput('');
  };

  const openNew = () => { resetForm(); setEditProduct(null); setShowForm(true); };

  const openEdit = (p: Product) => {
    resetForm();
    setEditProduct(p);
    setForm({
      name: p.name, price: p.price.toString(),
      cost_price: p.cost_price?.toString() || '',
      stock: p.stock.toString(), min_stock: p.min_stock.toString(),
      category: p.category || '', barcode: p.barcode || '',
      description: p.description || '',
      sell_online: p.sell_online ?? false,
    });
    setPhotoPreview(p.image_url || '');
    loadExtras(p.id);
    setShowForm(true);
  };

  const margin = form.price && form.cost_price
    ? (((parseFloat(form.price) - parseFloat(form.cost_price)) / parseFloat(form.price)) * 100).toFixed(1)
    : null;

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from('establishments').upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data: { publicUrl } } = supabase.storage.from('establishments').getPublicUrl(data.path);
    return publicUrl;
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true); setSaveError('');
    const supabase = createClient();
    try {
      let imageUrl = (editProduct as any)?.image_url || '';
      if (photoFile) {
        imageUrl = await uploadImage(photoFile, `uploads/${Date.now()}-product-${estId}.${photoFile.name.split('.').pop()}`);
      }

      const payload = {
        name: form.name, price: parseFloat(form.price) || 0,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        stock: parseInt(form.stock) || 0, min_stock: parseInt(form.min_stock) || 0,
        category: form.category || null, barcode: form.barcode || null,
        description: form.description || null, image_url: imageUrl || null, sell_online: form.sell_online,
      };

      let productId = editProduct?.id;
      if (editProduct) {
        const { error } = await (supabase as any).from('products').update(payload).eq('id', editProduct.id);
        if (error) throw error;
      } else {
        const { data, error } = await (supabase as any).from('products').insert({ ...payload, establishment_id: estId }).select('id').single();
        if (error) throw error;
        productId = data.id;
      }

      // Remove deleted extras
      if (removedExtras.length > 0) {
        await (supabase as any).from('product_images').delete().in('id', removedExtras);
      }

      // Upload new extra images
      for (let i = 0; i < extraFiles.length; i++) {
        const f = extraFiles[i];
        const url = await uploadImage(f, `uploads/${Date.now()}-product-extra-${i}.${f.name.split('.').pop()}`);
        await (supabase as any).from('product_images').insert({ product_id: productId, image_url: url, sort_order: existingExtras.length + i });
      }

      setShowForm(false);
      load();
    } catch (e: any) {
      setSaveError(e.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Excluir "${p.name}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(p.id);
    const supabase = createClient();
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    setDeletingId(null);
    if (error) { alert('Erro ao excluir: ' + error.message); return; }
    setProducts(prev => prev.filter(x => x.id !== p.id));
  };

  const addExtraFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setExtraFiles(prev => [...prev, ...arr]);
    setExtraPreviews(prev => [...prev, ...arr.map(f => URL.createObjectURL(f))]);
  };

  const lowStock = products.filter((p) => p.stock <= p.min_stock);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const filteredProducts = categoryFilter === 'all' ? products : products.filter(p => p.category === categoryFilter);

  return (
    <FeatureGate featureKey="estoque">
    <div className="flex flex-col min-h-screen">
      <Header title="Estoque" />
      <main className="flex-1 p-4 sm:p-6 space-y-4">
        {lowStock.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-orange-800">{lowStock.length} produto(s) com estoque baixo</div>
              <div className="text-sm text-orange-600">{lowStock.map(p => p.name).join(', ')}</div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${categoryFilter === 'all' ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Todos ({products.length})
            </button>
            {existingCategories.filter(c => products.some(p => p.category === c)).map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${categoryFilter === cat ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat} ({products.filter(p => p.category === cat).length})
              </button>
            ))}
          </div>
          <Button onClick={openNew} className="gradient-primary text-white border-0 rounded-xl h-10 flex-shrink-0">
            <Add className="w-4 h-4 mr-1.5" variant="Outline" /> Novo produto
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-brand-primary animate-spin" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
            <Box className="w-12 h-12 mx-auto mb-3 opacity-30" variant="Outline" />
            <p className="font-medium">Nenhum produto cadastrado</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Estoque</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Mín.</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Preço Venda</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Custo</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Online</th>
                    <th className="p-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map((p) => {
                    const low = p.stock <= p.min_stock;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                              {p.image_url
                                ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                : <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center"><Box className="w-4 h-4 text-brand-primary" variant="Outline" /></div>}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 text-sm block">{p.name}</span>
                              {p.category && <span className="text-xs text-gray-400">{p.category}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${low ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {p.stock} {low && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{p.min_stock}</td>
                        <td className="p-4 text-sm font-medium text-gray-900">R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-sm text-gray-600">{p.cost_price ? `R$ ${p.cost_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={async () => {
                              const supabase = createClient();
                              const newVal = !p.sell_online;
                              await (supabase as any).from('products').update({ sell_online: newVal }).eq('id', p.id);
                              setProducts(prev => prev.map(x => x.id === p.id ? { ...x, sell_online: newVal } as any : x));
                            }}
                            className={`relative w-10 h-5 rounded-full transition-colors ${p.sell_online ? 'bg-brand-primary' : 'bg-gray-200'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${p.sell_online ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors">
                              <Edit2 className="w-4 h-4" variant="Outline" />
                            </button>
                            <button onClick={() => handleDelete(p)} disabled={deletingId === p.id} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
                              <Trash className="w-4 h-4" variant="Outline" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-xl">{editProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {saveError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">{saveError}</div>}

                {/* Capa */}
                <div>
                  <Label className="text-gray-700 font-medium text-sm">Foto principal</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <div onClick={() => photoRef.current?.click()} className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 hover:border-brand-primary cursor-pointer overflow-hidden flex items-center justify-center bg-gray-50 transition-colors flex-shrink-0">
                      {photoPreview ? <img src={photoPreview} alt="" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-gray-400" variant="Outline" />}
                    </div>
                    <p className="text-xs text-gray-400">Clique para {photoPreview ? 'alterar' : 'adicionar'} a foto de capa</p>
                    <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); } }} />
                  </div>
                </div>

                {/* Imagens extras */}
                <div>
                  <Label className="text-gray-700 font-medium text-sm">Fotos adicionais</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {existingExtras.filter(e => !removedExtras.includes(e.id)).map(img => (
                      <div key={img.id} className="relative w-16 h-16 rounded-xl overflow-hidden group">
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setRemovedExtras(prev => [...prev, img.id])}
                          className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center rounded-xl">
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                    {extraPreviews.map((src, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden group">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => { setExtraFiles(p => p.filter((_, j) => j !== i)); setExtraPreviews(p => p.filter((_, j) => j !== i)); }}
                          className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center rounded-xl">
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => extrasRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-primary flex items-center justify-center transition-colors">
                      <ImagePlus className="w-5 h-5 text-gray-400" />
                    </button>
                    <input ref={extrasRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addExtraFiles(e.target.files)} />
                  </div>
                </div>

                <div><Label className="text-gray-700 font-medium text-sm">Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>

                <div>
                  <Label className="text-gray-700 font-medium text-sm">Descrição</Label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={2} placeholder="Descreva o produto..."
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-brand-primary" />
                </div>

                {/* Categoria */}
                <div>
                  <Label className="text-gray-700 font-medium text-sm">Categoria</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {existingCategories.map(cat => (
                      <button key={cat} type="button" onClick={() => setForm({ ...form, category: form.category === cat ? '' : cat })}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${form.category === cat ? 'bg-brand-primary text-white border-brand-primary' : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-brand-primary'}`}>
                        {cat}
                      </button>
                    ))}
                    {showNewCategory ? (
                      <div className="flex items-center gap-1">
                        <input autoFocus value={newCategoryInput} onChange={e => setNewCategoryInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && newCategoryInput.trim()) { setForm({ ...form, category: newCategoryInput.trim() }); setShowNewCategory(false); setNewCategoryInput(''); } if (e.key === 'Escape') { setShowNewCategory(false); setNewCategoryInput(''); } }}
                          placeholder="Nova categoria..." className="border border-brand-primary rounded-full px-3 py-1 text-xs outline-none w-36" />
                        <button type="button" onClick={() => { if (newCategoryInput.trim()) setForm({ ...form, category: newCategoryInput.trim() }); setShowNewCategory(false); setNewCategoryInput(''); }} className="text-xs text-brand-primary font-bold">OK</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setShowNewCategory(true)} className="px-3 py-1 rounded-full text-xs font-semibold border border-dashed border-gray-300 text-gray-400 hover:border-brand-primary hover:text-brand-primary transition-all">
                        + Nova
                      </button>
                    )}
                  </div>
                  {form.category && <p className="text-xs text-brand-primary mt-1 font-medium">Selecionada: {form.category}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-gray-700 font-medium text-sm">Código de barras</Label><Input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="EAN-13" className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                  <div><Label className="text-gray-700 font-medium text-sm">Preço venda</Label><Input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                  <div>
                    <Label className="text-gray-700 font-medium text-sm">Custo</Label>
                    <Input type="number" step="0.01" min="0" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" />
                    {margin !== null && <p className="text-xs text-green-600 mt-0.5 font-semibold">Margem: {margin}%</p>}
                  </div>
                  <div><Label className="text-gray-700 font-medium text-sm">Estoque atual</Label><Input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                  <div><Label className="text-gray-700 font-medium text-sm">Estoque mínimo</Label><Input type="number" min="0" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 gradient-primary text-white border-0 rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
    </FeatureGate>
  );
}
