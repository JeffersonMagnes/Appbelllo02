'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Link2, Copy, Eye, Edit2 as Edit, TickSquare, Calendar, Clock, Profile2User, Camera, Trash, ArrowUp2, ArrowDown2, Add, Instagram, Whatsapp, Location, ProfileCircle } from 'iconsax-react';
import { Loader2, QrCode, Download, ExternalLink } from 'lucide-react';
import Header from '@/components/dashboard/Header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { renderSVG } from 'uqr';

interface CustomLink { id: string; title: string; url: string; active: boolean; icon?: string; }

const COLORS = ['#5333ED','#0BBDB6','#FF6B6B','#FF9F43','#26de81','#45aaf2','#fd9644','#a55eea'];

export default function LinkAgendamentoPage() {
  // Link state
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState(false);
  const [estId, setEstId] = useState('');
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [tempSlug, setTempSlug] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Profile state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#5333ED');
  const [secondaryColor, setSecondaryColor] = useState('#0BBDB6');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [links, setLinks] = useState<CustomLink[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // File uploads
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const bannerRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const baseUrl = 'appbello.com.br/p';
  const fullUrl = customSlug ? `https://${baseUrl}/${customSlug}` : '';
  const qrSvg = useMemo(() => fullUrl ? renderSVG(fullUrl) : '', [fullUrl]);

  useEffect(() => {
    async function fetchEstablishment() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await (supabase as any)
        .from('establishments')
        .select('id, name, slug, active, bio, primary_color, secondary_color, logo_url, banner_url, custom_links')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (data) {
        setEstId(data.id);
        setName(data.name || '');
        const s = data.slug ?? '';
        setCustomSlug(s);
        setTempSlug(s);
        setSlug(s);
        setBookingEnabled(data.active ?? true);
        setBio(data.bio || '');
        setPrimaryColor(data.primary_color || '#5333ED');
        setSecondaryColor(data.secondary_color || '#0BBDB6');
        setLogoUrl(data.logo_url || '');
        setLogoPreview(data.logo_url || '');
        setBannerUrl(data.banner_url || '');
        setBannerPreview(data.banner_url || '');
        setLinks((data.custom_links || []).map((l: any, i: number) => ({ ...l, id: l.id || String(i) })));
      }
      setLoading(false);
    }
    fetchEstablishment();
  }, []);

  // Link handlers
  const handleCopyLink = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSlug = async () => {
    if (!estId || !tempSlug.trim()) return;
    setSavingSlug(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await (supabase as any)
      .from('establishments')
      .update({ slug: tempSlug.trim() })
      .eq('id', estId);
    if (err) {
      setError('Erro ao salvar. Tente novamente.');
    } else {
      setCustomSlug(tempSlug.trim());
      setSlug(tempSlug.trim());
      setIsEditingSlug(false);
    }
    setSavingSlug(false);
  };

  const handleToggleBooking = async (enabled: boolean) => {
    setBookingEnabled(enabled);
    if (!estId) return;
    const supabase = createClient();
    await (supabase as any).from('establishments').update({ active: enabled }).eq('id', estId);
  };

  // Profile handlers
  const uploadImage = async (file: File, path: string): Promise<string> => {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from('establishments').upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data: { publicUrl } } = supabase.storage.from('establishments').getPublicUrl(data.path);
    return `${publicUrl}?t=${Date.now()}`;
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true); setSaveError('');
    try {
      const supabase = createClient();
      let finalBanner = bannerUrl;
      let finalLogo = logoUrl;

      if (bannerFile) {
        finalBanner = await uploadImage(bannerFile, `uploads/${Date.now()}-banner-${estId}.${bannerFile.name.split('.').pop()}`);
        setBannerUrl(finalBanner);
        setBannerPreview(finalBanner);
      }
      if (logoFile) {
        finalLogo = await uploadImage(logoFile, `uploads/${Date.now()}-logo-${estId}.${logoFile.name.split('.').pop()}`);
        setLogoUrl(finalLogo);
        setLogoPreview(finalLogo);
      }

      const { error } = await (supabase as any)
        .from('establishments')
        .update({
          bio: bio.trim() || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo_url: finalLogo || null,
          banner_url: finalBanner || null,
          custom_links: links.map(({ id: _id, ...l }) => l),
        })
        .eq('id', estId);
      if (error) throw new Error(error.message);
      setBannerFile(null);
      setLogoFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setSaveError(e.message || 'Erro ao salvar.');
    } finally {
      setSavingProfile(false);
    }
  };

  const deleteBanner = async () => {
    try {
      const supabase = createClient();
      const { error } = await (supabase as any).from('establishments').update({ banner_url: null }).eq('id', estId);
      if (error) throw new Error(error.message);
      setBannerPreview('');
      setBannerFile(null);
      setBannerUrl('');
    } catch (e: any) {
      setSaveError(e.message || 'Erro ao remover banner.');
    }
  };

  const addLink = () => setLinks(l => [...l, { id: Date.now().toString(), title: '', url: '', active: true, icon: 'link' }]);
  const removeLink = (id: string) => setLinks(l => l.filter(x => x.id !== id));
  const updateLink = (id: string, field: keyof CustomLink, value: string | boolean) =>
    setLinks(l => l.map(x => x.id === id ? { ...x, [field]: value } : x));
  const moveLink = (id: string, dir: -1 | 1) => {
    setLinks(l => {
      const i = l.findIndex(x => x.id === id);
      if (i + dir < 0 || i + dir >= l.length) return l;
      const n = [...l];
      [n[i], n[i + dir]] = [n[i + dir], n[i]];
      return n;
    });
  };

  const profileUrl = slug ? `https://appbello.com.br/p/${slug}` : '';
  const previewPrimary = primaryColor;
  const previewSecondary = secondaryColor;
  const previewLogo = logoPreview || logoUrl;
  const previewBannerImg = bannerPreview || bannerUrl;

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header title="Link & Perfil" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Link & Perfil" />

      <main className="flex-1 p-4 sm:p-6">
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 max-w-6xl">

          {/* ── PAINEL DE EDIÇÃO ─────────────────────────────────────── */}
          <div className="space-y-6 max-w-3xl w-full">

            {/* Link Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${bookingEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium text-gray-900">{bookingEnabled ? 'Agendamento ativo' : 'Agendamento desativado'}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={bookingEnabled} onChange={(e) => handleToggleBooking(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              <div className="mb-6">
                <p className="text-gray-500 text-sm mb-2">Seu link personalizado</p>
                <p className="text-gray-400 text-sm mb-3">{baseUrl}/</p>

                {isEditingSlug ? (
                  <div className="space-y-3">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex items-center bg-gray-50 rounded-xl px-4 py-1 border-2 border-brand-primary">
                      <Link2 className="w-5 h-5 text-brand-primary" variant="Outline" />
                      <Input
                        value={tempSlug}
                        onChange={(e) => setTempSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                        className="border-0 bg-transparent focus-visible:ring-0 shadow-none font-bold text-gray-900"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => { setIsEditingSlug(false); setTempSlug(customSlug); }} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button onClick={handleSaveSlug} disabled={savingSlug} className="flex-1 rounded-xl bg-green-500 hover:bg-green-600 text-white">
                        {savingSlug ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => setIsEditingSlug(true)} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Link2 className="w-5 h-5 text-brand-primary" variant="Outline" />
                      <span className="font-bold text-gray-900 text-lg">
                        {customSlug || <span className="text-gray-400 font-normal">Nenhum link configurado</span>}
                      </span>
                    </div>
                    <Edit className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCopyLink}
                  disabled={!fullUrl}
                  className={`flex-1 rounded-xl font-bold ${copied ? 'bg-green-500 hover:bg-green-600' : 'bg-brand-primary hover:bg-brand-primary/90'} text-white`}
                >
                  {copied ? <TickSquare className="w-5 h-5 mr-2" variant="Outline" /> : <Copy className="w-5 h-5 mr-2" variant="Outline" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
                {fullUrl && (
                  <Button
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Agende comigo: ' + fullUrl)}`, '_blank')}
                    className="rounded-xl font-bold bg-green-500 hover:bg-green-600 text-white px-4"
                  >
                    WhatsApp
                  </Button>
                )}
              </div>
            </div>

            {/* QR Code */}
            {qrSvg && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode className="w-5 h-5 text-brand-primary" />
                  <h3 className="font-bold text-gray-900">QR Code</h3>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div
                    className="w-44 h-44 border-2 border-gray-100 rounded-2xl overflow-hidden flex-shrink-0 p-2"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                  <div className="space-y-3 flex-1">
                    <p className="text-sm text-gray-500">Imprima ou compartilhe este QR Code para que seus clientes possam agendar diretamente pelo celular.</p>
                    <Button
                      onClick={() => {
                        const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = 'qrcode-agendamento.svg';
                        a.click();
                      }}
                      variant="outline"
                      className="rounded-xl border-brand-primary text-brand-primary hover:bg-brand-primary/5 font-semibold"
                    >
                      <Download className="w-4 h-4 mr-2" /> Baixar QR Code
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            {fullUrl && (
              <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center py-4 rounded-2xl bg-white border border-brand-primary border-dashed hover:bg-brand-primary/5 transition-colors text-brand-primary font-bold gap-2">
                <Eye className="w-5 h-5" variant="Outline" />
                Visualizar perfil público
              </a>
            )}

            {/* ── PERFIL PÚBLICO ─────────────────────────────────────── */}
            <div>
              <h2 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Perfil público</h2>

              {/* Banner + Logo */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                <div
                  className="relative h-36 bg-gray-100 cursor-pointer group"
                  onClick={() => bannerRef.current?.click()}
                >
                  {previewBannerImg
                    ? <img src={previewBannerImg} alt="Banner" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Camera className="w-8 h-8 mb-1" variant="Outline" />
                        <span className="text-sm font-medium">Clique para adicionar banner</span>
                        <span className="text-xs">Recomendado: 1200×400px</span>
                      </div>
                  }
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-semibold bg-black/40 px-3 py-1.5 rounded-xl">Trocar banner</span>
                  </div>
                  {previewBannerImg && (
                    <button onClick={e => { e.stopPropagation(); deleteBanner(); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                      <Trash className="w-3.5 h-3.5" variant="Outline" />
                    </button>
                  )}
                </div>
                <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]; if (f) { setBannerFile(f); setBannerPreview(URL.createObjectURL(f)); }
                }} />

                <div className="px-5 pb-5 -mt-8 flex items-end gap-4">
                  <div className="relative flex-shrink-0">
                    <div
                      onClick={() => logoRef.current?.click()}
                      className="w-16 h-16 rounded-2xl border-4 border-white shadow-md overflow-hidden cursor-pointer bg-gray-100"
                      style={{ background: `linear-gradient(135deg, ${previewPrimary}, ${previewSecondary})` }}
                    >
                      {logoPreview
                        ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">{name.charAt(0)}</div>
                      }
                    </div>
                    <div onClick={() => logoRef.current?.click()} className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer" style={{ backgroundColor: previewPrimary }}>
                      <Camera className="w-3 h-3 text-white" variant="Outline" />
                    </div>
                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
                    }} />
                  </div>
                  <div className="flex-1 pt-8">
                    <p className="font-bold text-gray-900">{name || 'Meu Estabelecimento'}</p>
                    {slug && <p className="text-xs text-gray-400">/p/{slug}</p>}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                <Label className="font-semibold text-gray-700 block mb-2">Bio</Label>
                <div className="relative">
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value.slice(0, 160))}
                    rows={3}
                    placeholder="Descreva seu estabelecimento em poucas palavras..."
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:border-[#6666cc] text-gray-700"
                  />
                  <span className="absolute bottom-3 right-3 text-xs text-gray-400">{bio.length}/160</span>
                </div>
              </div>

              {/* Cores */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 mb-5">
                <h3 className="font-semibold text-gray-700">Cores do perfil</h3>
                <div>
                  <Label className="text-sm text-gray-600 block mb-2">Cor principal</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setPrimaryColor(c)}
                        className={`w-9 h-9 rounded-xl transition-all ${primaryColor === c ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' : ''}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 block mb-2">Cor secundária</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setSecondaryColor(c)}
                        className={`w-9 h-9 rounded-xl transition-all ${secondaryColor === c ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' : ''}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Links personalizados */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">Links personalizados</h3>
                  <Button onClick={addLink} className="h-8 px-3 rounded-xl bg-[#6666cc] text-white text-xs border-0">
                    <Add className="w-3.5 h-3.5 mr-1" variant="Outline" /> Adicionar
                  </Button>
                </div>
                {links.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                    <Link2 className="w-8 h-8 mx-auto mb-2 opacity-40" variant="Outline" />
                    <p className="text-sm">Nenhum link ainda. Clique em &ldquo;Adicionar&rdquo; para começar.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {links.map((lk, i) => {
                      const urlPlaceholder =
                        lk.icon === 'instagram' ? '@usuario ou https://instagram.com/...' :
                        lk.icon === 'whatsapp' ? 'Número com DDD (ex: 5521999999999)' :
                        lk.icon === 'location' ? 'Link do Google Maps ou Waze' :
                        'https://...';
                      const ICON_OPTIONS = [
                        { key: 'link', Icon: Link2, label: 'Link', color: '#6b7280' },
                        { key: 'instagram', Icon: Instagram, label: 'Instagram', color: '#E1306C' },
                        { key: 'whatsapp', Icon: Whatsapp, label: 'WhatsApp', color: '#25D366' },
                        { key: 'location', Icon: Location, label: 'Local', color: '#3B82F6' },
                      ];
                      return (
                        <div key={lk.id} className="border border-gray-100 rounded-xl p-3 space-y-2.5 bg-gray-50/50">
                          <div className="flex items-center gap-2">
                            {ICON_OPTIONS.map(({ key, Icon, label, color }) => {
                              const active = (lk.icon || 'link') === key;
                              return (
                                <button key={key} type="button" onClick={() => updateLink(lk.id, 'icon', key)}
                                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 flex-1 transition-all"
                                  style={active ? { borderColor: color, backgroundColor: color + '10' } : { borderColor: '#e5e7eb', backgroundColor: 'white' }}>
                                  <Icon className="w-4 h-4" style={{ color: active ? color : '#9ca3af' }} variant="Outline" />
                                  <span className="text-xs font-medium" style={{ color: active ? color : '#9ca3af' }}>{label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-0.5">
                              <button onClick={() => moveLink(lk.id, -1)} disabled={i === 0} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                <ArrowUp2 className="w-3.5 h-3.5" variant="Outline" />
                              </button>
                              <button onClick={() => moveLink(lk.id, 1)} disabled={i === links.length - 1} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                <ArrowDown2 className="w-3.5 h-3.5" variant="Outline" />
                              </button>
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <Input
                                value={lk.title}
                                onChange={e => updateLink(lk.id, 'title', e.target.value)}
                                placeholder="Título (ex: Siga-nos no Instagram)"
                                className="h-8 text-sm rounded-lg border-gray-200"
                              />
                              <Input
                                value={lk.url}
                                onChange={e => updateLink(lk.id, 'url', e.target.value)}
                                placeholder={urlPlaceholder}
                                className="h-8 text-sm rounded-lg border-gray-200"
                              />
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => updateLink(lk.id, 'active', !lk.active)}
                                className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
                                style={{ backgroundColor: lk.active ? primaryColor : '#e5e7eb' }}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${lk.active ? 'translate-x-4' : 'translate-x-0'}`} />
                              </button>
                              <button onClick={() => removeLink(lk.id)} className="p-1 text-red-400 hover:text-red-600">
                                <Trash className="w-4 h-4" variant="Outline" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Salvar perfil */}
              <div className="flex items-center gap-3 mb-5">
                <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl h-11 px-8 font-semibold">
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar perfil
                </Button>
                {saved && <span className="text-green-600 text-sm font-medium flex items-center gap-1"><TickSquare className="w-4 h-4" variant="Outline" /> Salvo!</span>}
                {saveError && <span className="text-red-500 text-sm">{saveError}</span>}
              </div>
            </div>

            {/* Configurações */}
            <div>
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Configurações do agendamento</h3>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-brand-secondary" variant="Outline" />
                    </div>
                    <span className="font-medium text-gray-900">Antecedência máxima</span>
                  </div>
                  <span className="text-sm text-gray-500">30 dias</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-500" variant="Outline" />
                    </div>
                    <span className="font-medium text-gray-900">Antecedência mínima</span>
                  </div>
                  <span className="text-sm text-gray-500">2 horas</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                      <Profile2User className="w-5 h-5 text-blue-500" variant="Outline" />
                    </div>
                    <span className="font-medium text-gray-900">Exigir telefone</span>
                  </div>
                  <span className="text-sm text-gray-500">Sim</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── PREVIEW AO VIVO ──────────────────────────────────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Preview ao vivo</p>
              <div className="mx-auto w-72 bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                <div className="bg-white rounded-[2rem] overflow-hidden" style={{ height: '580px' }}>
                  <div style={{ background: `linear-gradient(135deg, ${previewPrimary}, ${previewSecondary})` }}>
                    {previewBannerImg && (
                      <img src={previewBannerImg} alt="Banner" className="w-full h-24 object-cover opacity-60" />
                    )}
                    <div className="px-4 pt-3 pb-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl border-2 border-white/30 overflow-hidden flex-shrink-0" style={{ background: `linear-gradient(135deg, ${previewPrimary}90, ${previewSecondary}90)` }}>
                          {previewLogo
                            ? <img src={previewLogo} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{name.charAt(0)}</div>
                          }
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm leading-tight">{name || 'Meu Negócio'}</p>
                          {bio && <p className="text-white/70 text-xs leading-tight line-clamp-1">{bio}</p>}
                        </div>
                      </div>
                      <div className="flex border-b border-white/20">
                        {['Perfil','Agendar','Catálogo'].map((t, i) => (
                          <div key={t} className={`flex-1 py-2 text-center text-xs font-semibold ${i === 0 ? 'text-white border-b-2 border-white' : 'text-white/50'}`}>{t}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: '340px' }}>
                    {links.filter(l => l.active && l.title).map(lk => (
                      <div key={lk.id} className="w-full py-2.5 px-4 rounded-xl border-2 flex items-center gap-2 text-xs font-semibold" style={{ borderColor: previewPrimary, color: previewPrimary }}>
                        <Link2 className="w-3.5 h-3.5 flex-shrink-0" variant="Outline" />
                        {lk.title}
                      </div>
                    ))}
                    <div className="rounded-xl border border-gray-100 p-3 space-y-1.5">
                      <p className="text-xs font-bold text-gray-700">Contato</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ backgroundColor: previewPrimary + '15' }}>
                          <ProfileCircle className="w-3 h-3" style={{ color: previewPrimary }} variant="Outline" />
                        </div>
                        Telefone
                      </div>
                    </div>
                    <div className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${previewPrimary}, ${previewSecondary})` }}>
                      Agendar agora
                    </div>
                  </div>
                </div>
              </div>
              {profileUrl && (
                <a href={profileUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-1.5 text-sm text-[#6666cc] font-medium hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir perfil completo
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
