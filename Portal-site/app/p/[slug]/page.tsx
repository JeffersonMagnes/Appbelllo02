'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Location, Scissor, Clock, ArrowLeft2, ArrowRight2, User, Call, Message, TickCircle,
  Calendar, ShoppingCart, Box, Trash, Instagram, Whatsapp, Link2, SearchNormal1,
} from 'iconsax-react';
import { Minus, Plus, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PWAInstallBanner from '@/components/dashboard/PWAInstallBanner';

// ── Types ──────────────────────────────────────────────────────────────────────
interface CustomLink { title: string; url: string; active: boolean; icon?: string; }
interface Establishment {
  id: string; name: string; logo_url: string | null; address: string | null;
  phone: string | null; whatsapp: string | null; business_type: string; primary_color: string | null;
  secondary_color: string | null; instagram: string | null; hours_json: any;
  bio: string | null; banner_url: string | null; custom_links: CustomLink[] | null;
}
interface Service { id: string; name: string; price: number; duration: number; category: string | null; }
interface Professional { id: string; name: string; specialty: string | null; avatar: string | null; }
interface Product { id: string; name: string; description: string | null; price: number; category: string | null; image_url: string | null; stock: number; images?: ProductImage[]; }
interface ProductImage { id: string; image_url: string; }
interface CartItem { product: Product; qty: number; }

type BookStep = 'service' | 'professional' | 'datetime' | 'confirm';

const DEFAULT_TIMES = {
  morning: ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30'],
  afternoon: ['13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'],
  evening: ['17:00','17:30','18:00','18:30'],
};

function buildTimesFromHours(hoursJson: any): { morning: string[]; afternoon: string[]; evening: string[] } {
  if (!hoursJson || typeof hoursJson !== 'object') return DEFAULT_TIMES;
  const days = Object.values(hoursJson) as any[];
  const activeDays = days.filter((d: any) => d && d.active === true);
  if (activeDays.length === 0) return DEFAULT_TIMES;

  let earliestOpen = 23;
  let latestClose = 0;
  for (const d of activeDays) {
    const oh = parseInt((d.open || '09:00').split(':')[0], 10);
    const ch = parseInt((d.close || '18:00').split(':')[0], 10);
    if (oh < earliestOpen) earliestOpen = oh;
    if (ch > latestClose) latestClose = ch;
  }

  const all: string[] = [];
  for (let h = earliestOpen; h < latestClose; h++) {
    all.push(`${h.toString().padStart(2, '0')}:00`);
    all.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return {
    morning: all.filter(t => parseInt(t.split(':')[0], 10) < 12),
    afternoon: all.filter(t => { const h = parseInt(t.split(':')[0], 10); return h >= 12 && h < 17; }),
    evening: all.filter(t => parseInt(t.split(':')[0], 10) >= 17),
  };
}

function getDates() {
  const dates = [];
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    if (d.getDay() !== 0) dates.push({ date: d.toISOString().split('T')[0], day: d.getDate(), weekDay: days[d.getDay()], month: months[d.getMonth()], isToday: i === 0 });
  }
  return dates;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function getLinkMeta(title: string, url: string, PRIMARY: string, icon?: string) {
  const storedIcon = icon || '';
  const t = title.toLowerCase();
  const u = url.toLowerCase();
  if (storedIcon === 'instagram' || u.includes('instagram.com') || t.includes('instagram'))
    return { Icon: Instagram, color: '#E1306C', bg: '#f0f2f5' };
  if (storedIcon === 'whatsapp' || u.includes('wa.me') || u.includes('whatsapp') || t.includes('whatsapp') || t.includes('zap'))
    return { Icon: Whatsapp, color: '#25D366', bg: '#f0f2f5' };
  if (storedIcon === 'location' || u.includes('maps.google') || u.includes('goo.gl/maps') || u.includes('waze.com') ||
      t.includes('localização') || t.includes('localizacao') || t.includes('endereço') || t.includes('maps'))
    return { Icon: Location, color: '#3B82F6', bg: '#f0f2f5' };
  return { Icon: Link2, color: PRIMARY, bg: '#f0f2f5' };
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const bookingKey = useRef<string | null>(null);
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Booking
  const [showBooking, setShowBooking] = useState(() => searchParams.get('tab') === 'agendar');
  const [bookStep, setBookStep] = useState<BookStep>('service');
  const [booked, setBooked] = useState(false);
  const [booking, setBooking] = useState(false);
  const [period, setPeriod] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [TIMES, setTIMES] = useState(DEFAULT_TIMES);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Hours accordion
  const [hoursOpen, setHoursOpen] = useState(false);

  // Product detail
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderStep, setOrderStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderAddress, setOrderAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState('');

  const dates = getDates();
  const PRIMARY = establishment?.primary_color || '#6666cc';
  const SECONDARY = establishment?.secondary_color || '#7ccad0';
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await (supabase as any).rpc('get_public_storefront', { p_slug: slug });
      if (error || !data?.establishment) { setNotFound(true); setLoading(false); return; }
      const e = data.establishment as Establishment;
      setEstablishment(e);
      setTIMES(buildTimesFromHours(e.hours_json));
      setServices((data.services || []) as Service[]);
      const profs = (data.professionals || []) as Professional[];
      setProfessionals([...profs, { id: 'any', name: 'Qualquer profissional', specialty: 'Primeiro disponível', avatar: null }]);
      setProducts((data.products || []) as Product[]);
      setLoading(false);
    }
    load();
  }, [slug]);

  // ── Booking ────────────────────────────────────────────────────────────────
  const bookSteps: BookStep[] = ['service', 'professional', 'datetime', 'confirm'];
  const bookStepIdx = bookSteps.indexOf(bookStep);
  const stepLabels = ['Serviço', 'Profissional', 'Data/Hora', 'Confirmar'];
  const canNext = (bookStep === 'service' && !!selectedService) || (bookStep === 'professional' && !!selectedProfessional) || (bookStep === 'datetime' && !!selectedDate && !!selectedTime) || bookStep === 'confirm';

  const openBooking = (svc?: Service) => {
    if (svc) { setSelectedService(svc); setBookStep('professional'); }
    else { setBookStep('service'); }
    setShowBooking(true);
  };

  const closeBooking = () => { setShowBooking(false); };

  const handleBook = async () => {
    if (!clientName || !clientPhone || !establishment || !selectedService || !selectedDate || !selectedTime) return;
    setBooking(true);
    const supabase = createClient();
    const profNote = selectedProfessional?.id !== 'any' ? `Profissional: ${selectedProfessional?.name}` : 'Profissional: Qualquer disponível';
    bookingKey.current ||= crypto.randomUUID();
    const { error: bookingError } = await (supabase as any).rpc('create_public_booking', {
      p_establishment_id: establishment.id,
      p_service_id: selectedService.id,
      p_employee_id: selectedProfessional?.id === 'any' ? null : selectedProfessional?.id ?? null,
      p_date: selectedDate,
      p_time: selectedTime,
      p_client_name: clientName,
      p_client_phone: clientPhone,
      p_notes: [profNote, notes].filter(Boolean).join('\n'),
      p_idempotency_key: bookingKey.current,
    });
    if (bookingError) {
      console.error('public booking failed:', bookingError);
      setBooking(false);
      return;
    }
    try {
      // Notification delivery must resolve recipients server-side. The public
      // browser never receives owner identifiers, push tokens or subscriptions.
    } catch { /* best-effort */ }
    bookingKey.current = null;
    setBooking(false); setBooked(true);
  };

  // ── Product detail ─────────────────────────────────────────────────────────
  const openProduct = async (p: Product) => {
    setSelectedProduct(p); setGalleryIndex(0);
    setProductImages(p.images || []);
  };

  // ── Cart ───────────────────────────────────────────────────────────────────
  const addToCart = (p: Product) => {
    setCart(c => {
      const idx = c.findIndex(i => i.product.id === p.id);
      if (idx >= 0) return c.map((i, j) => j === idx ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { product: p, qty: 1 }];
    });
  };
  const removeFromCart = (id: string) => setCart(c => c.filter(i => i.product.id !== id));
  const updateQty = (id: string, delta: number) => setCart(c => c.map(i => i.product.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));

  const handlePlaceOrder = async () => {
    if (!orderName || !orderPhone || !establishment) return;
    setPlacing(true);
    try {
      const res = await fetch('/api/public/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          establishment_id: establishment.id, customer_name: orderName,
          customer_phone: orderPhone.replace(/\D/g, ''), customer_address: orderAddress || null,
          notes: orderNotes || null,
          items: cart.map(i => ({ product_id: i.product.id, product_name: i.product.name, quantity: i.qty, unit_price: i.product.price })),
        }),
      });
      const data = await res.json();
      if (res.ok) { setOrderId(data.id.slice(0, 8).toUpperCase()); setOrderStep('success'); setCart([]); }
    } catch { /* ignore */ } finally { setPlacing(false); }
  };

  // ── Hours ──────────────────────────────────────────────────────────────────
  const hoursDisplay = useMemo(() => {
    if (!establishment?.hours_json) return null;
    const h = establishment.hours_json;
    const engKeys = [['sunday','Domingo'],['monday','Segunda-feira'],['tuesday','Terça-feira'],['wednesday','Quarta-feira'],['thursday','Quinta-feira'],['friday','Sexta-feira'],['saturday','Sábado']];
    const ptKeys = [['domingo','Domingo'],['segunda','Segunda-feira'],['terca','Terça-feira'],['quarta','Quarta-feira'],['quinta','Quinta-feira'],['sexta','Sexta-feira'],['sabado','Sábado']];
    const usesEnglish = ['sunday','monday','tuesday'].some(k => k in h);
    return (usesEnglish ? engKeys : ptKeys).map(([key, label]) => {
      const entry = h[key];
      if (!entry?.active) return { label, text: 'Fechada', active: false };
      return { label, text: `${entry.open} - ${entry.close}`, active: true };
    });
  }, [establishment]);

  const openStatus = useMemo(() => {
    if (!establishment?.hours_json) return { isOpen: false, label: 'Horário não configurado' };
    const h = establishment.hours_json;
    const now = new Date();
    const engKeys = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const ptKeys = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'];
    const usesEnglish = ['sunday','monday'].some(k => k in h);
    const key = (usesEnglish ? engKeys : ptKeys)[now.getDay()];
    const entry = h[key];
    if (!entry?.active) return { isOpen: false, label: 'Fechado hoje' };
    const [oh, om] = (entry.open || '09:00').split(':').map(Number);
    const [ch, cm] = (entry.close || '18:00').split(':').map(Number);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin >= oh * 60 + om && nowMin < ch * 60 + cm) return { isOpen: true, label: `Aberto até ${entry.close}` };
    if (nowMin < oh * 60 + om) return { isOpen: false, label: `Abre às ${entry.open}` };
    return { isOpen: false, label: 'Fechado agora' };
  }, [establishment]);

  // ── Renders ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f2f5' }}>
      <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: '#6666cc', borderTopColor: 'transparent' }} />
    </div>
  );
  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#f0f2f5' }}>
      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow"><Scissor className="w-10 h-10 text-gray-300" variant="Outline" /></div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Perfil não encontrado</h1>
      <p className="text-gray-500">O link pode ter mudado ou não existe.</p>
    </div>
  );

  const todayIdx = new Date().getDay();
  const todayEntry = hoursDisplay?.[todayIdx];

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#f0f2f5' }}>
      <PWAInstallBanner />

      {/* ── Profile Header — fundo cinza igual WA Business ───────────────────── */}
      <div className="pt-10 pb-4 px-5 flex flex-col items-center" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="mb-4">
          {establishment?.logo_url
            ? <img src={establishment.logo_url} alt={establishment.name} className="w-32 h-32 rounded-full object-cover" />
            : <div className="w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold" style={{ backgroundColor: PRIMARY, color: 'white' }}>{establishment?.name?.charAt(0)}</div>
          }
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center leading-tight">{establishment?.name}</h1>
        {establishment?.phone && <p className="text-gray-500 text-sm mt-1">{establishment.phone}</p>}
      </div>

      {/* ── Action Buttons — cards brancos individuais sobre cinza ───────────── */}
      <div className="px-5 py-4" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="flex gap-3 justify-around">
          {establishment?.phone && (
            <a href={`tel:${establishment.phone}`} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full bg-white rounded-2xl flex items-center justify-center shadow-sm" style={{ aspectRatio: '1', maxWidth: 72 }}>
                <Call className="w-6 h-6" style={{ color: '#25D366' }} variant="Outline" />
              </div>
              <span className="text-xs text-gray-700 text-center font-medium">Ligar</span>
            </a>
          )}
          <button onClick={() => openBooking()} className="flex flex-col items-center gap-2 flex-1">
            <div className="w-full bg-white rounded-2xl flex items-center justify-center shadow-sm" style={{ aspectRatio: '1', maxWidth: 72 }}>
              <Calendar className="w-6 h-6" style={{ color: '#25D366' }} variant="Outline" />
            </div>
            <span className="text-xs text-gray-700 text-center font-medium">Agendar</span>
          </button>
          {establishment?.whatsapp && (
            <a href={`https://wa.me/${establishment.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full bg-white rounded-2xl flex items-center justify-center shadow-sm" style={{ aspectRatio: '1', maxWidth: 72 }}>
                <Whatsapp className="w-6 h-6" style={{ color: '#25D366' }} variant="Outline" />
              </div>
              <span className="text-xs text-gray-700 text-center font-medium">WhatsApp</span>
            </a>
          )}
          {establishment?.instagram && (
            <a href={`https://instagram.com/${establishment.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full bg-white rounded-2xl flex items-center justify-center shadow-sm" style={{ aspectRatio: '1', maxWidth: 72 }}>
                <Instagram className="w-6 h-6" style={{ color: '#25D366' }} variant="Outline" />
              </div>
              <span className="text-xs text-gray-700 text-center font-medium">Instagram</span>
            </a>
          )}
        </div>
      </div>

      {/* ── Services / Catálogo — card branco com margem igual WA Business ─────── */}
      {services.length > 0 && (
        <div className="mx-3 mt-0 bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <span className="text-base font-bold text-gray-900">Serviços</span>
            <button onClick={() => openBooking()} className="flex items-center gap-0.5 text-sm text-gray-400">
              Mostrar tudo <ArrowRight2 className="w-3.5 h-3.5 text-gray-400" variant="Outline" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            {services.slice(0, 6).map((s, idx) => {
              const hues = ['135deg,#c8a882,#b08860','135deg,#b8a090,#9a8070','135deg,#a8b8c0,#8898a8','135deg,#c0a878,#a08858','135deg,#b0b8a0,#909880','135deg,#c8b0a0,#a89080'];
              return (
                <button key={s.id} onClick={() => openBooking(s)}
                  className="relative overflow-hidden aspect-square hover:opacity-90 transition-opacity">
                  <div className="absolute inset-0" style={{ background: `linear-gradient(${hues[idx % hues.length]})` }} />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 to-transparent px-2 py-1.5">
                    <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{s.name}</p>
                    <p className="text-white/80 text-xs">{fmt(s.price)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Products/Catalog Section ──────────────────────────────────────────── */}
      {products.length > 0 && (
        <div className="bg-white mt-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Catálogo</h2>
            <button onClick={() => setShowCart(true)} className="flex items-center gap-0.5 text-sm text-gray-500">
              Mostrar tudo <ArrowRight2 className="w-3.5 h-3.5 text-gray-400 mt-0.5" variant="Outline" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {products.slice(0, 6).map(p => (
              <button key={p.id} onClick={() => openProduct(p)} className="relative rounded-2xl overflow-hidden aspect-square bg-gray-100 hover:opacity-90 active:scale-95 transition-all">
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex flex-col items-center justify-center p-2">
                      <Box className="w-6 h-6 text-gray-300 mb-1" variant="Outline" />
                      <p className="text-xs text-gray-400 text-center line-clamp-2">{p.name}</p>
                    </div>
                }
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 to-transparent p-2">
                  <p className="text-white text-xs font-semibold line-clamp-1 leading-tight">{p.name}</p>
                  <p className="text-white text-xs font-bold">{fmt(p.price)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Hours Accordion ───────────────────────────────────────────────────── */}
      {hoursDisplay && todayEntry && (
        <div className="bg-white mt-2">
          <button onClick={() => setHoursOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-sm font-semibold text-gray-900">{todayEntry.label}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-700">{todayEntry.text}</span>
              <span className="text-gray-500 text-sm">{hoursOpen ? '↑' : '↓'}</span>
            </div>
          </button>
          {hoursOpen && (
            <div className="border-t border-gray-100 px-5 pb-4">
              {hoursDisplay.map((h, i) => (
                <div key={h.label} className={`flex items-center justify-between py-3 text-sm ${i < hoursDisplay.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <span className="text-gray-700">{h.label}</span>
                  <span className={h.active ? 'text-gray-900 font-medium' : 'text-gray-400'}>{h.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Info Section ──────────────────────────────────────────────────────── */}
      <div className="bg-white mt-2 divide-y divide-gray-100">
        {establishment?.bio && (
          <div className="px-5 py-4">
            <p className="text-sm text-gray-700 leading-relaxed">{establishment.bio}</p>
          </div>
        )}
        {establishment?.address && (
          <div className="px-5 py-4">
            <p className="text-sm text-gray-700">{establishment.address}</p>
          </div>
        )}
        {establishment?.phone && (
          <a href={`tel:${establishment.phone}`} className="flex px-5 py-4 hover:bg-gray-50">
            <p className="text-sm text-gray-700">{establishment.phone}</p>
          </a>
        )}
      </div>

      {/* ── Instagram Card ────────────────────────────────────────────────────── */}
      {establishment?.instagram && (
        <a href={`https://instagram.com/${establishment.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white mt-2 px-5 py-4 hover:bg-gray-50 transition-colors rounded-none">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0f2f5' }}>
            <Instagram className="w-5 h-5" style={{ color: '#E1306C' }} variant="Outline" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{establishment.instagram.startsWith('@') ? establishment.instagram : '@' + establishment.instagram}</p>
            <p className="text-xs text-gray-500">Instagram</p>
          </div>
          <ArrowRight2 className="w-4 h-4 text-gray-400 flex-shrink-0" variant="Outline" />
        </a>
      )}

      {/* ── Custom Links ──────────────────────────────────────────────────────── */}
      {establishment?.custom_links && establishment.custom_links.filter(l => l.active && l.title && l.url).length > 0 && (
        <div className="bg-white mt-2 divide-y divide-gray-100">
          {establishment.custom_links.filter(l => l.active && l.title && l.url).map((lk, i) => {
            const { Icon, color } = getLinkMeta(lk.title, lk.url, PRIMARY, lk.icon);
            return (
              <a key={i} href={lk.url.startsWith('http') ? lk.url : `https://${lk.url}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0f2f5' }}>
                  <Icon className="w-5 h-5" style={{ color }} variant="Outline" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{lk.title}</p>
                </div>
                <ArrowRight2 className="w-4 h-4 text-gray-300 flex-shrink-0" variant="Outline" />
              </a>
            );
          })}
        </div>
      )}

      {/* ── Cart FAB ──────────────────────────────────────────────────────────── */}
      {cartCount > 0 && (
        <button onClick={() => { setShowCart(true); setOrderStep('cart'); }}
          className="fixed bottom-28 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-30"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}>
          <ShoppingCart className="w-6 h-6 text-white" variant="Outline" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white">{cartCount}</span>
        </button>
      )}

      {/* ── Fixed Bottom CTA ──────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-20">
        <div className="max-w-lg mx-auto">
          <button onClick={() => openBooking()}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}>
            <Calendar className="w-5 h-5" variant="Outline" />
            Agendar agora
          </button>
        </div>
      </div>

      {/* ── Booking Modal ─────────────────────────────────────────────────────── */}
      {showBooking && !booked && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeBooking} />
          <div className="relative bg-white rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl w-full max-w-lg mx-auto">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="px-5 pt-1 pb-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                {bookStepIdx > 0
                  ? <button onClick={() => setBookStep(bookSteps[bookStepIdx - 1])} className="flex items-center gap-1 text-sm font-medium" style={{ color: PRIMARY }}>
                      <ArrowLeft2 className="w-4 h-4" variant="Outline" /> Voltar
                    </button>
                  : <span className="text-base font-bold text-gray-900">Agendar</span>
                }
                <button onClick={closeBooking} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">×</button>
              </div>
              <div className="flex gap-1.5">
                {bookSteps.map((s, i) => (
                  <div key={s} className="flex-1 h-1 rounded-full transition-all" style={{ backgroundColor: i <= bookStepIdx ? PRIMARY : '#e5e7eb' }} />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5 text-center font-medium">{stepLabels[bookStepIdx]}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {/* Step: Service */}
              {bookStep === 'service' && (
                <div>
                  <h2 className="text-base font-bold text-gray-900 mb-3">Escolha o serviço</h2>
                  <div className="space-y-2.5">
                    {services.length === 0 && <p className="text-center text-gray-400 py-8">Nenhum serviço disponível.</p>}
                    {services.map(s => {
                      const sel = selectedService?.id === s.id;
                      return (
                        <button key={s.id} onClick={() => setSelectedService(s)} className="w-full text-left rounded-2xl p-4 border-2 transition-all bg-white flex items-center gap-3" style={{ borderColor: sel ? PRIMARY : '#f3f4f6' }}>
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: sel ? PRIMARY : '#f3f4f6' }}>
                            <Scissor className={`w-5 h-5 ${sel ? 'text-white' : 'text-gray-400'}`} variant="Outline" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" variant="Outline" />{s.duration} min</span>
                              <span className="text-sm font-bold" style={{ color: PRIMARY }}>{fmt(s.price)}</span>
                            </div>
                          </div>
                          {sel && <TickCircle className="w-5 h-5 flex-shrink-0" style={{ color: PRIMARY }} variant="Outline" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step: Professional */}
              {bookStep === 'professional' && (
                <div>
                  <h2 className="text-base font-bold text-gray-900 mb-3">Escolha o profissional</h2>
                  <div className="space-y-2.5">
                    {professionals.map(p => {
                      const sel = selectedProfessional?.id === p.id;
                      return (
                        <button key={p.id} onClick={() => setSelectedProfessional(p)} className="w-full text-left rounded-2xl p-4 border-2 transition-all bg-white flex items-center gap-3" style={{ borderColor: sel ? PRIMARY : '#f3f4f6' }}>
                          {p.avatar ? <img src={p.avatar} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" alt={p.name} />
                            : <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: sel ? PRIMARY : '#f3f4f6' }}>
                                <User className={`w-5 h-5 ${sel ? 'text-white' : 'text-gray-400'}`} variant="Outline" />
                              </div>
                          }
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.specialty}</p>
                          </div>
                          {sel && <TickCircle className="w-5 h-5 flex-shrink-0" style={{ color: PRIMARY }} variant="Outline" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step: DateTime */}
              {bookStep === 'datetime' && (
                <div>
                  <h2 className="text-base font-bold text-gray-900 mb-3">Data e horário</h2>
                  <div className="flex gap-2 overflow-x-auto pb-3 -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
                    {dates.map(d => (
                      <button key={d.date} onClick={() => setSelectedDate(d.date)}
                        className="flex-shrink-0 flex flex-col items-center px-3 py-3 rounded-2xl border-2 transition-all min-w-[58px]"
                        style={{ backgroundColor: selectedDate === d.date ? PRIMARY : 'white', borderColor: selectedDate === d.date ? PRIMARY : '#f3f4f6', color: selectedDate === d.date ? 'white' : '#374151' }}>
                        <span className="text-xs font-medium opacity-70">{d.weekDay}</span>
                        <span className="text-xl font-bold my-0.5">{d.day}</span>
                        <span className="text-xs opacity-70">{d.month}</span>
                        {d.isToday && <span className="text-xs mt-0.5 font-semibold" style={{ color: selectedDate === d.date ? 'rgba(255,255,255,0.8)' : PRIMARY }}>Hoje</span>}
                      </button>
                    ))}
                  </div>
                  {selectedDate && (
                    <div className="mt-4">
                      <div className="flex gap-2 mb-4">
                        {(['morning','afternoon','evening'] as const).map(p => (
                          <button key={p} onClick={() => setPeriod(p)}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all border"
                            style={{ backgroundColor: period === p ? PRIMARY : 'white', color: period === p ? 'white' : '#6b7280', borderColor: period === p ? PRIMARY : '#f3f4f6' }}>
                            {p === 'morning' ? '☀️ Manhã' : p === 'afternoon' ? '🌤 Tarde' : '🌙 Noite'}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {TIMES[period].map(t => (
                          <button key={t} onClick={() => setSelectedTime(t)}
                            className="py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                            style={{ backgroundColor: selectedTime === t ? PRIMARY : 'white', borderColor: selectedTime === t ? PRIMARY : '#f3f4f6', color: selectedTime === t ? 'white' : '#374151' }}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step: Confirm */}
              {bookStep === 'confirm' && (
                <div>
                  <h2 className="text-base font-bold text-gray-900 mb-3">Seus dados</h2>
                  <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-3">
                    {[
                      { icon: <Scissor className="w-4 h-4" style={{ color: PRIMARY }} variant="Outline" />, label: 'Serviço', value: `${selectedService?.name} · ${fmt(selectedService?.price ?? 0)}` },
                      { icon: <User className="w-4 h-4" style={{ color: PRIMARY }} variant="Outline" />, label: 'Profissional', value: selectedProfessional?.name },
                      { icon: <Calendar className="w-4 h-4" style={{ color: PRIMARY }} variant="Outline" />, label: 'Data e hora', value: `${dates.find(d => d.date === selectedDate)?.weekDay}, ${dates.find(d => d.date === selectedDate)?.day} ${dates.find(d => d.date === selectedDate)?.month} às ${selectedTime}` },
                    ].map(row => (
                      <div key={row.label} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: PRIMARY + '15' }}>{row.icon}</div>
                        <div><p className="text-xs text-gray-400">{row.label}</p><p className="font-semibold text-gray-900 text-sm">{row.value}</p></div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: <User className="w-4 h-4 text-gray-400" variant="Outline" />, label: 'Nome completo *', value: clientName, onChange: setClientName, placeholder: 'Seu nome', type: 'text' },
                      { icon: <Call className="w-4 h-4 text-gray-400" variant="Outline" />, label: 'WhatsApp / Telefone *', value: clientPhone, onChange: setClientPhone, placeholder: '(00) 00000-0000', type: 'tel' },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{f.label}</label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2">{f.icon}</div>
                          <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder} className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none bg-white" onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = '#f3f4f6'} />
                        </div>
                      </div>
                    ))}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Observações (opcional)</label>
                      <div className="relative">
                        <Message className="absolute left-3 top-3 w-4 h-4 text-gray-400" variant="Outline" />
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Alguma preferência..." className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none bg-white resize-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 pb-6 pt-3 border-t border-gray-100 flex-shrink-0">
              {bookStep !== 'confirm' ? (
                <button onClick={() => canNext && setBookStep(bookSteps[bookStepIdx + 1])} disabled={!canNext}
                  className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all disabled:opacity-40"
                  style={{ backgroundColor: PRIMARY }}>Continuar</button>
              ) : (
                <button onClick={handleBook} disabled={booking || !clientName || !clientPhone}
                  className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ backgroundColor: PRIMARY }}>
                  {booking ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><TickCircle className="w-5 h-5" variant="Outline" /> Confirmar agendamento</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Booking Success ────────────────────────────────────────────────────── */}
      {booked && (() => {
        const dateObj = dates.find(d => d.date === selectedDate);
        const dateDisplay = dateObj ? `${dateObj.day}/${String(new Date(selectedDate).getMonth() + 1).padStart(2,'0')}/${new Date(selectedDate).getFullYear()}` : selectedDate;
        const profName = selectedProfessional?.id !== 'any' ? selectedProfessional?.name : 'Primeiro disponível';
        const whatsappMsg = encodeURIComponent(`Olá, ${clientName}! Seu agendamento foi confirmado! ✅\n\n📋 *Detalhes:*\n📅 ${dateDisplay} às ${selectedTime}\n👤 ${profName}\n✂️ ${selectedService?.name}\n${establishment?.name ? `🏢 ${establishment.name}` : ''}\n${establishment?.address ? `📍 ${establishment.address}` : ''}\n\nAguardamos você! 😊`);
        const ph = (establishment?.whatsapp || establishment?.phone || '').replace(/\D/g,'');
        const wUrl = ph ? `https://wa.me/${ph.startsWith('55') ? ph : '55'+ph}?text=${whatsappMsg}` : `https://wa.me/?text=${whatsappMsg}`;
        return (
          <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center px-5 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: PRIMARY + '20' }}>
              <TickCircle className="w-10 h-10" style={{ color: PRIMARY }} variant="Outline" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Agendado!</h1>
            <p className="text-gray-400 text-sm mb-6">Confira os detalhes do seu agendamento</p>
            <div className="w-full bg-gray-50 rounded-2xl p-5 text-left mb-5 space-y-3 max-w-sm">
              {([['📅','Data',dateDisplay],['🕐','Horário',selectedTime],['👤','Profissional',profName],['✂️','Serviço',selectedService?.name]] as [string,string,string|undefined][]).map(([emoji,label,value]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-lg">{emoji}</span>
                  <div><p className="text-xs text-gray-400">{label}</p><p className="font-semibold text-gray-900 text-sm">{value}</p></div>
                </div>
              ))}
            </div>
            <a href={wUrl} target="_blank" rel="noopener noreferrer"
              className="w-full max-w-sm flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold mb-3"
              style={{ backgroundColor: '#25D366' }}>
              <Whatsapp className="w-5 h-5" variant="Outline" /> Enviar via WhatsApp
            </a>
            <button onClick={() => { setBooked(false); setBookStep('service'); setSelectedService(null); setSelectedProfessional(null); setSelectedDate(''); setSelectedTime(''); setShowBooking(false); }}
              className="w-full max-w-sm py-3.5 rounded-2xl text-sm font-bold border-2"
              style={{ color: PRIMARY, borderColor: PRIMARY + '40' }}>
              Fazer novo agendamento
            </button>
            <p className="text-xs text-gray-400 mt-4">O estabelecimento entrará em contato para confirmar.</p>
          </div>
        );
      })()}

      {/* ── Product Detail Sheet ───────────────────────────────────────────────── */}
      {selectedProduct && (() => {
        const allImages = [...(selectedProduct.image_url ? [{ id: 'cover', image_url: selectedProduct.image_url }] : []), ...productImages];
        const inCart = cart.find(i => i.product.id === selectedProduct.id);
        return (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
            <div className="relative bg-white rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="relative bg-gray-100 flex-shrink-0" style={{ height: 260 }}>
                {allImages.length > 0 ? (
                  <>
                    <img src={allImages[galleryIndex]?.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    {allImages.length > 1 && (
                      <>
                        <button onClick={() => setGalleryIndex(i => (i-1+allImages.length)%allImages.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white text-lg">‹</button>
                        <button onClick={() => setGalleryIndex(i => (i+1)%allImages.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white text-lg">›</button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {allImages.map((_,i) => <button key={i} onClick={() => setGalleryIndex(i)} className="w-2 h-2 rounded-full transition-all" style={{ backgroundColor: i===galleryIndex ? PRIMARY : 'rgba(255,255,255,0.6)' }} />)}
                        </div>
                      </>
                    )}
                  </>
                ) : <div className="w-full h-full flex items-center justify-center"><Box className="w-16 h-16 text-gray-300" variant="Outline" /></div>}
                <button onClick={() => setSelectedProduct(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white text-lg font-bold">×</button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h2>
                  {selectedProduct.category && <span className="text-xs px-3 py-1 rounded-full text-white font-semibold flex-shrink-0 mt-1" style={{ backgroundColor: PRIMARY + 'cc' }}>{selectedProduct.category}</span>}
                </div>
                <p className="text-2xl font-black mb-3" style={{ color: PRIMARY }}>{fmt(selectedProduct.price)}</p>
                {selectedProduct.description && <p className="text-gray-600 text-sm leading-relaxed mb-4">{selectedProduct.description}</p>}
                <p className="text-xs text-gray-400">{selectedProduct.stock} unidade{selectedProduct.stock !== 1 ? 's' : ''} disponível{selectedProduct.stock !== 1 ? 'is' : ''}</p>
              </div>
              <div className="px-5 pb-6 pt-3 border-t border-gray-100">
                {inCart ? (
                  <div className="flex items-center justify-between">
                    <button onClick={() => updateQty(selectedProduct.id, -1)} className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold" style={{ backgroundColor: PRIMARY+'15', color: PRIMARY }}>−</button>
                    <span className="font-black text-xl" style={{ color: PRIMARY }}>{inCart.qty}</span>
                    <button onClick={() => updateQty(selectedProduct.id, 1)} className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: PRIMARY }}>+</button>
                  </div>
                ) : (
                  <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                    className="w-full py-4 rounded-2xl text-white font-bold text-base"
                    style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}>
                    Adicionar ao carrinho · {fmt(selectedProduct.price)}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Cart / Order Sheet ─────────────────────────────────────────────────── */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">{orderStep === 'cart' ? 'Carrinho' : orderStep === 'checkout' ? 'Finalizar pedido' : 'Pedido confirmado!'}</h3>
              <button onClick={() => setShowCart(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {orderStep === 'cart' && (
                <div className="space-y-3">
                  {cart.map(i => (
                    <div key={i.product.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                        {i.product.image_url ? <img src={i.product.image_url} alt={i.product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Box className="w-6 h-6 text-gray-400" variant="Outline" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{i.product.name}</p>
                        <p className="text-sm font-bold" style={{ color: PRIMARY }}>{fmt(i.product.price * i.qty)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(i.product.id, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200"><Minus className="w-3 h-3 text-gray-600" /></button>
                        <span className="w-5 text-center font-bold text-sm">{i.qty}</span>
                        <button onClick={() => updateQty(i.product.id, 1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: PRIMARY }}><Plus className="w-3 h-3 text-white" /></button>
                      </div>
                      <button onClick={() => removeFromCart(i.product.id)} className="ml-1"><Trash className="w-4 h-4 text-red-400" variant="Outline" /></button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-lg" style={{ color: PRIMARY }}>{fmt(cartTotal)}</span>
                  </div>
                </div>
              )}
              {orderStep === 'checkout' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-2xl p-4 text-sm">
                    <p className="font-semibold text-gray-700">{cart.length} {cart.length===1?'item':'itens'} · {fmt(cartTotal)}</p>
                  </div>
                  {[
                    { label: 'Nome completo *', value: orderName, onChange: setOrderName, placeholder: 'Seu nome', type: 'text' },
                    { label: 'WhatsApp / Telefone *', value: orderPhone, onChange: setOrderPhone, placeholder: '(00) 00000-0000', type: 'tel' },
                    { label: 'Endereço de entrega (opcional)', value: orderAddress, onChange: setOrderAddress, placeholder: 'Rua, número, cidade', type: 'text' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">{f.label}</label>
                      <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder} className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none bg-white" onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = '#f3f4f6'} />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Observações</label>
                    <textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)} rows={2} placeholder="Alguma observação..." className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none bg-white resize-none" />
                  </div>
                </div>
              )}
              {orderStep === 'success' && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: PRIMARY+'20' }}>
                    <TickCircle className="w-10 h-10" style={{ color: PRIMARY }} variant="Outline" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Pedido realizado!</h2>
                  <p className="text-gray-500 mb-1">Número do pedido</p>
                  <p className="text-2xl font-black mb-4" style={{ color: PRIMARY }}>#{orderId}</p>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto">O estabelecimento entrará em contato para confirmar e combinar a entrega.</p>
                  {establishment?.phone && (
                    <a href={`https://wa.me/55${establishment.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá! Fiz o pedido #${orderId} pelo catálogo online.`)}`} target="_blank" rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-white" style={{ backgroundColor: '#25D366' }}>
                      <Whatsapp className="w-5 h-5" variant="Outline" /> Contatar via WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="px-5 pb-6 pt-3 border-t border-gray-100">
              {orderStep === 'cart' && <button onClick={() => setOrderStep('checkout')} className="w-full py-4 rounded-2xl text-white font-bold" style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}>Continuar para o pedido</button>}
              {orderStep === 'checkout' && (
                <div className="flex gap-3">
                  <button onClick={() => setOrderStep('cart')} className="flex-1 py-4 rounded-2xl font-bold border-2" style={{ color: PRIMARY, borderColor: PRIMARY }}>Voltar</button>
                  <button onClick={handlePlaceOrder} disabled={placing || !orderName || !orderPhone} className="flex-1 py-4 rounded-2xl text-white font-bold disabled:opacity-50" style={{ backgroundColor: PRIMARY }}>
                    {placing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Confirmar pedido'}
                  </button>
                </div>
              )}
              {orderStep === 'success' && <button onClick={() => setShowCart(false)} className="w-full py-4 rounded-2xl font-bold border-2" style={{ color: PRIMARY, borderColor: PRIMARY }}>Fechar</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
