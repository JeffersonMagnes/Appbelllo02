'use client';

import { useState, useRef, useId } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeSlash, TickCircle, ArrowRight2, ArrowLeft2, Add, CloseCircle } from 'iconsax-react';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/lib/supabase/client';

// ── Constants ──────────────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { value: 'salao', label: 'Salão de Beleza', emoji: '💇‍♀️' },
  { value: 'barbearia', label: 'Barbearia', emoji: '✂️' },
  { value: 'clinica', label: 'Clínica Estética', emoji: '💆‍♀️' },
  { value: 'spa', label: 'Spa', emoji: '🧖‍♀️' },
  { value: 'studio', label: 'Studio', emoji: '🎨' },
  { value: 'outro', label: 'Outro', emoji: '🏪' },
];
const PRIMARY_COLORS = ['#5333ED','#0BBDB6','#FF6B6B','#FF9F43','#26de81','#45aaf2','#fd9644','#a55eea'];
const SECONDARY_COLORS = ['#0BBDB6','#5333ED','#FF9F43','#26de81','#45aaf2','#FF6B6B','#fd9644','#a55eea'];
const ROLES = ['Barbeiro','Cabeleireiro','Manicure','Esteticista','Massagista','Médico','Dentista','Fisioterapeuta','Outro'];
const SUGGESTED_SERVICES = ['Corte de cabelo','Escova','Coloração','Manicure','Pedicure','Design de sobrancelha','Depilação','Massagem','Limpeza de pele','Maquiagem'];
const TIMES = Array.from({ length: 34 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2,'0')}:${m}`;
});
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const CANCEL_OPTIONS = [1,2,6,12,24,48];
const DURATION_OPTIONS = [15,30,45,60,90,120];

function generateSlug(name: string, uid: string) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-' + uid.slice(0,6);
}

const inputCls = 'h-11 rounded-xl';
const selectCls = 'w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-gray-700 text-sm focus:outline-none focus:border-brand-primary';

// ── Layout wrapper ─────────────────────────────────────────────────────────────
function Wrapper({ title, subtitle, step, error, children }: {
  title: string;
  subtitle?: string;
  step: number;
  error: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5333ED]/5 to-[#0BBDB6]/5 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8">
        <div className="mb-6">
          <div className="w-16 h-16 relative">
            <Image src="/Appbello-white.svg" alt="Appbello" fill className="object-contain" style={{ filter: 'invert(1) sepia(1) saturate(5) hue-rotate(220deg)' }} onError={()=>{}} />
          </div>
        </div>
        <ProgressBar step={step <= 5 ? step : 6} total={6} />
        <div className="mt-6 mb-2">
          <h1 className="text-2xl font-black text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mt-3">{error}</div>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
        <span>Etapa {step} de {total}</span>
        <span>{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(step / total) * 100}%`, background: 'linear-gradient(90deg,#5333ED,#0BBDB6)' }}
        />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CadastroPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Shared state after signup
  const [userId, setUserId] = useState('');
  const [estId, setEstId] = useState('');
  const [estSlug, setEstSlug] = useState('');

  // Step 2
  const [estName, setEstName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [phone, setPhone] = useState('');
  const [cnpj, setCnpj] = useState('');

  // Step 3
  const [cep, setCep] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Step 4
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#5333ED');
  const [secondaryColor, setSecondaryColor] = useState('#0BBDB6');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step 5
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [workDays, setWorkDays] = useState([false,true,true,true,true,true,true]);
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
  const [cancelPolicy, setCancelPolicy] = useState(2);
  const [defaultDuration, setDefaultDuration] = useState(30);

  // Step 6
  const [profName, setProfName] = useState('');
  const [profRole, setProfRole] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customService, setCustomService] = useState('');
  const [commissionType, setCommissionType] = useState<'percentage'|'fixed'>('percentage');
  const [commissionValue, setCommissionValue] = useState('');

  // Step 7
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  // ── Phone formatter ──────────────────────────────────────────────────────────
  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g,'').slice(0,11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  };

  // ── CEP lookup ──────────────────────────────────────────────────────────────
  const fetchCep = async (rawCep: string) => {
    const digits = rawCep.replace(/\D/g,'');
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setState(data.uf || '');
      }
    } catch { /* ignore */ } finally {
      setLoadingCep(false);
    }
  };

  // ── Step handlers ────────────────────────────────────────────────────────────
  const handleStep1 = async () => {
    setError('');
    if (!name.trim()) { setError('Informe seu nome.'); return; }
    if (!email.trim()) { setError('Informe seu e-mail.'); return; }
    if (password.length < 8) { setError('Senha deve ter pelo menos 8 caracteres.'); return; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    if (!acceptTerms) { setError('Você precisa aceitar os termos de uso.'); return; }
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (err) { setError(err.message.includes('already registered') ? 'E-mail já cadastrado.' : err.message); return; }
      if (!data.user) { setError('Erro ao criar conta.'); return; }
      const uid = data.user.id;
      setUserId(uid);
      const slug = generateSlug(name, uid);
      setEstSlug(slug);
      const { data: est } = await (supabase as any).from('establishments').insert({ owner_id: uid, name: name + "'s", business_type: 'salon', active: true, slug, trial_started_at: new Date().toISOString() }).select('id').single();
      if (est) {
        setEstId(est.id);
        await (supabase as any).from('employees').insert({
          establishment_id: est.id,
          name,
          email,
          role: 'professional',
          specialty: 'Proprietário',
          commission_type: 'percentage',
          commission_value: 0,
          active: true,
        });
      }
      setStep(2);
    } catch { setError('Ocorreu um erro. Tente novamente.'); }
    finally { setLoading(false); }
  };

  const handleStep2 = async () => {
    setError('');
    if (!estName.trim()) { setError('Informe o nome do estabelecimento.'); return; }
    if (!businessType) { setError('Selecione o tipo de negócio.'); return; }
    setLoading(true);
    try {
      const newSlug = generateSlug(estName, userId);
      setEstSlug(newSlug);
      await (supabase as any).from('establishments').update({ name: estName, business_type: businessType, phone: phone.replace(/\D/g,''), cnpj, slug: newSlug }).eq('id', estId);
      setStep(3);
    } catch { setError('Erro ao salvar. Tente novamente.'); }
    finally { setLoading(false); }
  };

  const handleStep3 = async () => {
    setError('');
    setLoading(true);
    try {
      await (supabase as any).from('establishments').update({ address, city, state, zip: cep.replace(/\D/g,'') }).eq('id', estId);
      setStep(4);
    } catch { setError('Erro ao salvar endereço.'); }
    finally { setLoading(false); }
  };

  const handleStep4 = async (skip = false) => {
    setError('');
    setLoading(true);
    try {
      let logoUrl = '';
      if (!skip && logoFile) {
        const ext = logoFile.name.split('.').pop();
        const { data: uploadData } = await supabase.storage.from('avatars').upload(`logos/${estId}.${ext}`, logoFile, { upsert: true });
        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`logos/${estId}.${ext}`);
          logoUrl = publicUrl;
        }
      }
      const updates: Record<string, string> = { primary_color: primaryColor, secondary_color: secondaryColor };
      if (logoUrl) updates.logo_url = logoUrl;
      await (supabase as any).from('establishments').update(updates).eq('id', estId);
      setStep(5);
    } catch { setError('Erro ao salvar. Tente novamente.'); }
    finally { setLoading(false); }
  };

  const handleStep5 = async () => {
    if (!workDays.some(Boolean)) { setError('Selecione pelo menos um dia de funcionamento.'); return; }
    setError('');
    setLoading(true);
    try {
      const hoursJson: Record<string,object> = {};
      DAYS.forEach((d,i) => {
        hoursJson[d.toLowerCase()] = { active: workDays[i], open: openTime, close: closeTime, breakStart, breakEnd };
      });
      await (supabase as any).from('establishments').update({ hours_json: hoursJson, cancellation_policy: cancelPolicy, default_service_duration: defaultDuration }).eq('id', estId);
      setStep(7);
    } catch { setError('Erro ao salvar horários.'); }
    finally { setLoading(false); }
  };

  const handleStep6 = async (skip = false) => {
    setError('');
    if (!skip) {
      if (!profName.trim()) { setError('Informe o nome do profissional.'); return; }
      if (!profRole) { setError('Selecione o cargo.'); return; }
    }
    setLoading(true);
    try {
      if (!skip && profName.trim()) {
        const { data: emp } = await (supabase as any).from('employees').insert({
          establishment_id: estId, name: profName, role: 'professional', specialty: profRole,
          commission_type: commissionType, commission_value: parseFloat(commissionValue)||0, active: true,
        }).select('id').single();
        if (emp && selectedServices.length > 0) {
          const svcRows = selectedServices.map(s => ({ establishment_id: estId, name: s, price: 0, duration: defaultDuration, active: true }));
          await (supabase as any).from('services').insert(svcRows);
        }
      }
      setStep(7);
    } catch { setError('Erro ao salvar profissional.'); }
    finally { setLoading(false); }
  };

  const handleCopyLink = () => {
    const url = `https://appbello-portal.netlify.app/agendar/${estSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleDay = (i: number) => setWorkDays(d => d.map((v,idx) => idx===i ? !v : v));
  const toggleService = (s: string) => setSelectedServices(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev,s]);
  const addCustomService = () => {
    const t = customService.trim();
    if (t && !selectedServices.includes(t)) { setSelectedServices(prev => [...prev,t]); setCustomService(''); }
  };

  // ── Step 7: Conclusão ────────────────────────────────────────────────────────
  if (step === 7) {
    const bookingUrl = `https://appbello-portal.netlify.app/agendar/${estSlug}`;
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5333ED]/5 to-[#0BBDB6]/5 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 text-center">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: `linear-gradient(135deg,${primaryColor},${secondaryColor})` }}>
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-2">Tudo pronto! 🎉</h1>
          <p className="text-gray-500 mb-7">Seu estabelecimento foi configurado com sucesso. Compartilhe seu link de agendamento!</p>

          {/* Link card */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Seu link de agendamento</p>
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-gray-200">
              <TickCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 flex-1 truncate font-medium">{bookingUrl}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={handleCopyLink}
                className={`flex-1 h-10 rounded-xl text-sm font-semibold text-white transition-all ${copied ? 'bg-green-500' : ''}`}
                style={!copied ? { background: `linear-gradient(90deg,${primaryColor},${secondaryColor})` } : {}}>
                {copied ? '✓ Copiado!' : 'Copiar link'}
              </Button>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={()=>{ window.location.href = '/dashboard'; }}
            className="w-full h-12 text-white font-bold rounded-xl text-base"
            style={{ background: `linear-gradient(90deg,${primaryColor},${secondaryColor})` }}>
            Ir para o Dashboard
          </Button>

          <p className="text-xs text-gray-400 mt-4">Você pode editar tudo isso a qualquer momento nas Configurações</p>
        </div>
      </div>
    );
  }

  // ── Step meta data ──────────────────────────────────────────────────────────
  const getStepMeta = () => {
    switch (step) {
      case 1: return { title: 'Crie sua conta', subtitle: 'Comece grátis, sem cartão de crédito.' };
      case 2: return { title: 'Seu negócio', subtitle: 'Conte-nos sobre seu estabelecimento.' };
      case 3: return { title: 'Endereço', subtitle: 'Onde fica seu estabelecimento?' };
      case 4: return { title: 'Identidade visual', subtitle: 'Personalize a aparência do seu negócio.' };
      case 5: return { title: 'Horários de funcionamento', subtitle: 'Configure quando seu negócio está aberto.' };
      default: return { title: '', subtitle: '' };
    }
  };

  const { title, subtitle } = getStepMeta();

  return (
    <Wrapper title={title} subtitle={subtitle} step={step} error={error}>
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reg-name" className="text-gray-700 font-medium text-sm cursor-pointer">Nome completo</Label>
            <Input id="reg-name" autoComplete="name" placeholder="Ana Paula Ferreira" value={name} onChange={e=>setName(e.target.value)} className={inputCls} />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="reg-email" className="text-gray-700 font-medium text-sm cursor-pointer">E-mail</Label>
            <Input id="reg-email" type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} className={inputCls} />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="reg-password" className="text-gray-700 font-medium text-sm cursor-pointer">Senha</Label>
              <div className="relative">
                <Input id="reg-password" type={showPw?'text':'password'} autoComplete="new-password" placeholder="Mín. 8 chars" value={password} onChange={e=>setPassword(e.target.value)} className={`${inputCls} pr-10`} />
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeSlash className="w-4 h-4" variant="Outline" /> : <Eye className="w-4 h-4" variant="Outline" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="reg-confirm" className="text-gray-700 font-medium text-sm cursor-pointer">Confirmar senha</Label>
              <Input id="reg-confirm" type="password" autoComplete="new-password" placeholder="Repita" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className={inputCls} />
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Checkbox id="terms" checked={acceptTerms} onCheckedChange={v=>setAcceptTerms(!!v)} className="mt-0.5" />
            <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
              Li e concordo com os <Link href="/termos" className="text-brand-primary font-medium hover:underline">Termos de Uso</Link> e <Link href="/privacidade" className="text-brand-primary font-medium hover:underline">Política de Privacidade</Link>
            </label>
          </div>
          
          <Button onClick={handleStep1} disabled={loading} className="w-full h-12 gradient-primary text-white font-semibold rounded-xl mt-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continuar <ArrowRight2 className="w-4 h-4 ml-1" /></>}
          </Button>
          
          <p className="text-center text-sm text-gray-500">Já tem conta? <Link href="/login" className="text-brand-primary font-semibold hover:underline">Entrar</Link></p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="est-name" className="text-gray-700 font-medium text-sm cursor-pointer">Nome do estabelecimento</Label>
            <Input id="est-name" autoComplete="organization" placeholder="Salão Beleza & Arte" value={estName} onChange={e=>setEstName(e.target.value)} className={inputCls} />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-gray-700 font-medium text-sm">Tipo de negócio</Label>
            <div className="grid grid-cols-3 gap-2">
              {BUSINESS_TYPES.map(bt => (
                <button key={bt.value} type="button" onClick={()=>setBusinessType(bt.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${businessType===bt.value ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-xl mb-1">{bt.emoji}</div>
                  <div className="text-xs font-medium text-gray-700 leading-tight">{bt.label}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="est-phone" className="text-gray-700 font-medium text-sm cursor-pointer">WhatsApp / Telefone</Label>
            <Input id="est-phone" autoComplete="tel" placeholder="(11) 99999-9999" value={phone} onChange={e=>setPhone(formatPhone(e.target.value))} className={inputCls} />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="est-cnpj" className="text-gray-700 font-medium text-sm cursor-pointer">CNPJ (opcional)</Label>
            <Input id="est-cnpj" autoComplete="off" placeholder="00.000.000/0000-00" value={cnpj} onChange={e=>setCnpj(e.target.value)} className={inputCls} />
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={()=>setStep(1)} className="flex-1 h-11 rounded-xl"><ArrowLeft2 className="w-4 h-4 mr-1" /> Voltar</Button>
            <Button onClick={handleStep2} disabled={loading} className="flex-1 h-11 gradient-primary text-white rounded-xl font-semibold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continuar <ArrowRight2 className="w-4 h-4 ml-1" /></>}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="addr-cep" className="text-gray-700 font-medium text-sm cursor-pointer">CEP</Label>
            <div className="relative">
              <Input id="addr-cep" autoComplete="postal-code" placeholder="00000-000" value={cep}
                onChange={e=>{
                  const v = e.target.value.replace(/\D/g,'').slice(0,8);
                  const fmt = v.length>5 ? v.slice(0,5)+'-'+v.slice(5) : v;
                  setCep(fmt);
                  if (v.length===8) fetchCep(v);
                }} className={`${inputCls} pr-10`} />
              {loadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="addr-street" className="text-gray-700 font-medium text-sm cursor-pointer">Rua / Logradouro</Label>
            <Input id="addr-street" autoComplete="address-line1" placeholder="Rua das Flores" value={address} onChange={e=>setAddress(e.target.value)} className={inputCls} />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="addr-number" className="text-gray-700 font-medium text-sm cursor-pointer">Número</Label>
              <Input id="addr-number" autoComplete="off" placeholder="123" value={addressNumber} onChange={e=>setAddressNumber(e.target.value)} className={inputCls} />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="addr-complement" className="text-gray-700 font-medium text-sm cursor-pointer">Complemento</Label>
              <Input id="addr-complement" autoComplete="address-line2" placeholder="Sala 2" value={complement} onChange={e=>setComplement(e.target.value)} className={inputCls} />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="addr-neighborhood" className="text-gray-700 font-medium text-sm cursor-pointer">Bairro</Label>
            <Input id="addr-neighborhood" autoComplete="off" placeholder="Centro" value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} className={inputCls} />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="addr-city" className="text-gray-700 font-medium text-sm cursor-pointer">Cidade</Label>
              <Input id="addr-city" autoComplete="address-level2" placeholder="São Paulo" value={city} onChange={e=>setCity(e.target.value)} className={inputCls} />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="addr-state" className="text-gray-700 font-medium text-sm cursor-pointer">Estado</Label>
              <Input id="addr-state" autoComplete="address-level1" placeholder="SP" maxLength={2} value={state} onChange={e=>setState(e.target.value.toUpperCase())} className={inputCls} />
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={()=>setStep(2)} className="flex-1 h-11 rounded-xl"><ArrowLeft2 className="w-4 h-4 mr-1" /> Voltar</Button>
            <Button onClick={handleStep3} disabled={loading} className="flex-1 h-11 gradient-primary text-white rounded-xl font-semibold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continuar <ArrowRight2 className="w-4 h-4 ml-1" /></>}
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          {/* Logo */}
          <div>
            <Label className="text-gray-700 font-medium text-sm block mb-2">Logo do estabelecimento</Label>
            <div className="flex items-center gap-4">
              <div
                onClick={()=>logoInputRef.current?.click()}
                className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-brand-primary transition-colors overflow-hidden bg-gray-50 flex-shrink-0"
              >
                {logoPreview
                  ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  : <div className="text-center"><div className="text-2xl mb-1">📷</div><div className="text-xs text-gray-400">Upload</div></div>
                }
              </div>
              <div className="text-sm text-gray-500">
                <p className="font-medium text-gray-700 mb-1">Foto da fachada ou logo</p>
                <p className="text-xs">JPG, PNG ou SVG — recomendado 400×400px</p>
                {logoFile && <p className="text-xs text-green-600 mt-1">✓ {logoFile.name}</p>}
              </div>
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e=>{
              const f = e.target.files?.[0];
              if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
            }} />
          </div>

          {/* Primary color */}
          <div>
            <Label className="text-gray-700 font-medium text-sm block mb-2">Cor principal</Label>
            <div className="flex gap-2 flex-wrap">
              {PRIMARY_COLORS.map(c => (
                <button key={c} type="button" onClick={()=>setPrimaryColor(c)}
                  className={`w-9 h-9 rounded-xl transition-all ${primaryColor===c ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Secondary color */}
          <div>
            <Label className="text-gray-700 font-medium text-sm block mb-2">Cor secundária</Label>
            <div className="flex gap-2 flex-wrap">
              {SECONDARY_COLORS.map(c => (
                <button key={c} type="button" onClick={()=>setSecondaryColor(c)}
                  className={`w-9 h-9 rounded-xl transition-all ${secondaryColor===c ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-2xl overflow-hidden border border-gray-200">
            <div className="h-12 flex items-center px-4 gap-2" style={{ background: `linear-gradient(90deg,${primaryColor},${secondaryColor})` }}>
              {logoPreview && <img src={logoPreview} alt="" className="w-7 h-7 rounded-lg object-cover" />}
              <span className="text-white font-bold text-sm">{estName || 'Meu Salão'}</span>
            </div>
            <div className="p-3 bg-white">
              <div className="text-xs text-gray-400 mb-2">Prévia do seu link de agendamento</div>
              <div className="h-6 rounded-lg w-2/3" style={{ backgroundColor: primaryColor+'22' }} />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={()=>setStep(3)} className="flex-1 h-11 rounded-xl"><ArrowLeft2 className="w-4 h-4 mr-1" /> Voltar</Button>
            <Button variant="outline" onClick={()=>handleStep4(true)} disabled={loading} className="h-11 px-4 rounded-xl text-gray-500">Pular</Button>
            <Button onClick={()=>handleStep4(false)} disabled={loading} className="flex-1 h-11 gradient-primary text-white rounded-xl font-semibold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continuar <ArrowRight2 className="w-4 h-4 ml-1" /></>}
            </Button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-700 font-medium text-sm block">Abre às</Label>
              <select value={openTime} onChange={e=>setOpenTime(e.target.value)} className={selectCls}>
                {TIMES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-gray-700 font-medium text-sm block">Fecha às</Label>
              <select value={closeTime} onChange={e=>setCloseTime(e.target.value)} className={selectCls}>
                {TIMES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-700 font-medium text-sm block">Dias de funcionamento</Label>
            <div className="flex gap-1.5">
              {DAYS.map((d,i)=>(
                <button key={d} type="button" onClick={()=>toggleDay(i)}
                  className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all ${workDays[i] ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                  style={workDays[i] ? { backgroundColor: primaryColor } : {}}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-700 font-medium text-sm block">Intervalo — início</Label>
              <select value={breakStart} onChange={e=>setBreakStart(e.target.value)} className={selectCls}>
                <option value="">Sem intervalo</option>
                {TIMES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-gray-700 font-medium text-sm block">Intervalo — fim</Label>
              <select value={breakEnd} onChange={e=>setBreakEnd(e.target.value)} className={selectCls}>
                <option value="">—</option>
                {TIMES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-700 font-medium text-sm block">Cancelamento com antecedência mínima</Label>
            <div className="flex gap-2 flex-wrap">
              {CANCEL_OPTIONS.map(h=>(
                <button key={h} type="button" onClick={()=>setCancelPolicy(h)}
                  className={`px-3 h-8 rounded-lg text-xs font-semibold border-2 transition-all ${cancelPolicy===h ? 'border-transparent text-white' : 'border-gray-200 text-gray-600'}`}
                  style={cancelPolicy===h ? { backgroundColor: primaryColor } : {}}>
                  {h}h
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-700 font-medium text-sm block">Duração padrão dos serviços</Label>
            <div className="flex gap-2 flex-wrap">
              {DURATION_OPTIONS.map(m=>(
                <button key={m} type="button" onClick={()=>setDefaultDuration(m)}
                  className={`px-3 h-8 rounded-lg text-xs font-semibold border-2 transition-all ${defaultDuration===m ? 'border-transparent text-white' : 'border-gray-200 text-gray-600'}`}
                  style={defaultDuration===m ? { backgroundColor: primaryColor } : {}}>
                  {m}min
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={()=>setStep(4)} className="flex-1 h-11 rounded-xl"><ArrowLeft2 className="w-4 h-4 mr-1" /> Voltar</Button>
            <Button onClick={handleStep5} disabled={loading} className="flex-1 h-11 gradient-primary text-white rounded-xl font-semibold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continuar <ArrowRight2 className="w-4 h-4 ml-1" /></>}
            </Button>
          </div>
        </div>
      )}

    </Wrapper>
  );
}
