'use client';

import { useEffect, useState } from 'react';
import { Crown, TickSquare, Shield, Star1, ArrowRight2, Tag, Gift, CloseCircle, Card, Clock } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const REFERRAL_DISCOUNT_PERCENT = 20;
const REFERRALS_ENABLED = false;

const PLANS = [
  {
    id: 'trial',
    name: 'Trial Gratuito',
    price: 'Grátis',
    priceMonthly: 0,
    description: 'Explore todas as funcionalidades por 30 dias.',
    features: ['Agenda ilimitada','Gestão de clientes','Controle financeiro','Suporte por chat'],
    color: 'border-gray-200',
    badge: null,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$49/mês',
    priceMonthly: 49,
    description: 'Ideal para profissionais autônomos.',
    features: ['Tudo do Trial','Lembretes por WhatsApp','Relatórios avançados','Até 5 profissionais'],
    color: 'border-brand-secondary',
    badge: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$99/mês',
    priceMonthly: 99,
    description: 'Para salões em crescimento.',
    features: ['Tudo do Starter','Assistente IA ilimitado','Profissionais ilimitados','Link de agendamento premium','Suporte prioritário'],
    color: 'border-brand-primary',
    badge: 'Mais Popular',
  },
];

export default function AssinaturaPage() {
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState('trial');
  const [trialStarted, setTrialStarted] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(30);
  const [commercialNotice, setCommercialNotice] = useState('');
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);

  // Referral code state
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [appliedReferralCode, setAppliedReferralCode] = useState<string | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState('');

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('retorno') === 'mercado-pago') {
      setCommercialNotice('Retorno recebido. Aguardando a confirmação segura do Mercado Pago; o plano ainda não foi ativado.');
    }
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      // Load saved referral from user metadata
      const savedReferral = user.user_metadata?.applied_referral_code as string | undefined;
      if (savedReferral) setAppliedReferralCode(savedReferral);
      const { data } = await (supabase as any)
        .from('establishments')
        .select('subscription_plan, trial_started_at, extra_trial_days')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (data) {
        setCurrentPlan(data.subscription_plan || 'trial');
        if (data.trial_started_at) {
          setTrialStarted(data.trial_started_at);
          const totalTrialDays = 30 + (data.extra_trial_days ?? 0);
          const started = new Date(data.trial_started_at);
          const now = new Date();
          const daysUsed = Math.floor((now.getTime() - started.getTime()) / (1000 * 60 * 60 * 24));
          setTrialDaysLeft(Math.max(0, totalTrialDays - daysUsed));
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const getDiscountedPrice = (price: number) => {
    if (!REFERRALS_ENABLED || !appliedReferralCode || price === 0) return price;
    return Math.round(price * (1 - REFERRAL_DISCOUNT_PERCENT / 100));
  };

  const handleApplyReferral = async () => {
    const code = referralInput.trim().toUpperCase();
    if (!code) return;
    setReferralLoading(true);
    setReferralError('');
    try {
      const supabase = createClient();
      // Check if an establishment with this slug exists (as the referral code)
      const { data: referrer } = await (supabase as any)
        .from('establishments')
        .select('id, slug, referral_count')
        .eq('slug', code.toLowerCase())
        .maybeSingle();
      if (!referrer) {
        setReferralError('Codigo invalido. Verifique e tente novamente.');
        return;
      }
      // Increment referral_count on the referrer's establishment
      await (supabase as any)
        .from('establishments')
        .update({ referral_count: (referrer.referral_count || 0) + 1 })
        .eq('id', referrer.id);
      // Save applied referral in user metadata
      await supabase.auth.updateUser({
        data: { applied_referral_code: code },
      });
      setAppliedReferralCode(code);
      setReferralInput('');
      setShowReferralInput(false);
    } catch {
      setReferralError('Erro ao aplicar codigo. Tente novamente.');
    } finally {
      setReferralLoading(false);
    }
  };

  const handleRemoveReferral = async () => {
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { applied_referral_code: null } });
    setAppliedReferralCode(null);
  };

  const handleUpgrade = async (planId: string) => {
    setCheckoutPlan(planId);
    setCommercialNotice('');
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível iniciar a assinatura.');

      const checkoutUrl = new URL(result.checkoutUrl);
      const trustedHost = checkoutUrl.hostname === 'mercadopago.com.br'
        || checkoutUrl.hostname.endsWith('.mercadopago.com.br');
      if (checkoutUrl.protocol !== 'https:' || !trustedHost) throw new Error('Endereço de checkout inválido.');
      window.location.assign(checkoutUrl.toString());
    } catch (error) {
      setCommercialNotice(error instanceof Error ? error.message : 'Não foi possível iniciar a assinatura.');
      setCheckoutPlan(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
    </div>
  );

  const isTrial = currentPlan === 'trial';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-brand-primary to-brand-secondary px-6 pt-12 pb-20">
        <div className="max-w-2xl mx-auto text-center text-white">
          <Crown className="w-12 h-12 mx-auto mb-3" variant="Outline" />
          <h1 className="text-2xl font-black mb-1">Minha Assinatura</h1>
          <p className="text-white/80 text-sm">Plano atual: <strong className="text-white">{currentPlan.charAt(0).toUpperCase()+currentPlan.slice(1)}</strong></p>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 -mt-12 space-y-5 pb-8">

        {/* Trial banner */}
        {isTrial && (
          <div className={`bg-white rounded-2xl border-2 shadow-sm p-5 ${trialDaysLeft > 7 ? 'border-green-300' : trialDaysLeft > 0 ? 'border-amber-400' : 'border-red-400'}`}>
            <div className="flex items-center gap-3 mb-3">
              <Star1 className={`w-6 h-6 ${trialDaysLeft > 7 ? 'text-green-600' : trialDaysLeft > 0 ? 'text-amber-500' : 'text-red-500'}`} variant="Outline" />
              <div>
                <p className="font-bold text-gray-900">
                  {trialDaysLeft > 0 ? `${trialDaysLeft} dias restantes no trial` : 'Trial expirado'}
                </p>
                <p className="text-xs text-gray-500">Início: {trialStarted ? new Date(trialStarted).toLocaleDateString('pt-BR') : 'não informado'}</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${trialDaysLeft > 7 ? 'bg-green-500' : trialDaysLeft > 0 ? 'bg-amber-400' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, (trialDaysLeft / 30) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Trial ativo &middot; {trialDaysLeft} dias restantes</p>
          </div>
        )}

        {/* Plans */}
        {commercialNotice && (
          <div role="status" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            {commercialNotice}
          </div>
        )}
        <div className="space-y-4">
          {PLANS.filter(p => p.id !== 'trial').map(plan => {
            const isActive = currentPlan === plan.id;
            const discountedPrice = getDiscountedPrice(plan.priceMonthly);
            const hasDiscount = appliedReferralCode && discountedPrice !== plan.priceMonthly;
            return (
              <div key={plan.id} className={`bg-white rounded-2xl border-2 shadow-sm p-5 ${isActive ? plan.color : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                      {plan.badge && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-primary text-white">{plan.badge}</span>}
                      {isActive && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Ativo</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {hasDiscount && (
                        <p className="text-lg font-bold text-gray-400 line-through">{plan.price}</p>
                      )}
                      <p className={`text-2xl font-black ${hasDiscount ? 'text-green-600' : 'text-brand-primary'}`}>
                        {hasDiscount ? `R$${discountedPrice}/mes` : plan.price}
                      </p>
                      {hasDiscount && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">-{REFERRAL_DISCOUNT_PERCENT}%</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>
                  </div>
                  <Shield className="w-8 h-8 text-brand-primary/30 flex-shrink-0" variant="Outline" />
                </div>

                <ul className="space-y-1.5 mb-4">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <TickSquare className="w-4 h-4 text-green-500 flex-shrink-0" variant="Outline" />
                      {f}
                    </li>
                  ))}
                </ul>

                {!isActive && (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={checkoutPlan !== null}
                    className="w-full h-11 rounded-xl gradient-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {checkoutPlan === plan.id
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Abrindo Mercado Pago...</>
                      : <>{hasDiscount ? `Assinar por R$${discountedPrice}/mes` : `Assinar ${plan.name}`} <ArrowRight2 className="w-4 h-4" /></>}
                  </button>
                )}
                {isActive && (
                  <div className="w-full h-11 rounded-xl bg-green-50 text-green-700 font-bold text-sm flex items-center justify-center gap-2">
                    <TickSquare className="w-4 h-4" variant="Outline" /> Plano atual
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Referral Code Section */}
        {REFERRALS_ENABLED && <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {appliedReferralCode ? (
            // Applied code badge
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-green-600" variant="Outline" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-green-800 text-sm">Codigo aplicado: {appliedReferralCode}</p>
                <p className="text-green-600 text-xs mt-0.5">{REFERRAL_DISCOUNT_PERCENT}% de desconto no plano selecionado</p>
              </div>
              <button
                onClick={handleRemoveReferral}
                className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <CloseCircle className="w-4 h-4 text-green-700" variant="Outline" />
              </button>
            </div>
          ) : showReferralInput ? (
            // Input field
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-brand-primary" variant="Outline" />
                  <p className="font-bold text-gray-900 text-sm">Codigo de indicacao</p>
                </div>
                <button
                  onClick={() => { setShowReferralInput(false); setReferralInput(''); setReferralError(''); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <CloseCircle className="w-4 h-4" variant="Outline" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralInput}
                  onChange={e => setReferralInput(e.target.value.toUpperCase())}
                  placeholder="Ex: meu-salao"
                  className="flex-1 h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold tracking-wide text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                  onKeyDown={e => e.key === 'Enter' && handleApplyReferral()}
                />
                <button
                  onClick={handleApplyReferral}
                  disabled={referralLoading || !referralInput.trim()}
                  className="h-11 px-5 rounded-xl bg-brand-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                >
                  {referralLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
                </button>
              </div>
              {referralError && <p className="text-red-500 text-xs font-medium">{referralError}</p>}
              <p className="text-xs text-gray-400">Insira o identificador (slug) de quem te indicou e ganhe {REFERRAL_DISCOUNT_PERCENT}% de desconto no primeiro mes</p>
            </div>
          ) : (
            // Button to open input
            <button
              onClick={() => setShowReferralInput(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-primary/40 text-gray-500 hover:text-brand-primary transition-colors"
            >
              <Tag className="w-4 h-4" variant="Outline" />
              <span className="text-sm font-semibold">Tem um codigo de indicacao?</span>
              <ArrowRight2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>}

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Card className="w-5 h-5 text-brand-primary" variant="Outline" />
            <h3 className="font-bold text-gray-900">Formas de Pagamento</h3>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Ambiente de teste do Mercado Pago. Nenhuma cobrança real será realizada nesta etapa.
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-brand-primary" variant="Outline" />
            <h3 className="font-bold text-gray-900">Histórico de Cobranças</h3>
          </div>
          <div className="py-8 text-center">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" variant="Outline" />
            <p className="text-sm text-gray-500">Nenhuma cobrança confirmada pelo backend.</p>
            <p className="text-xs text-gray-400 mt-1">O histórico será exibido somente após confirmações recebidas pelo servidor.</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          Para dúvidas sobre planos, entre em contato pelo WhatsApp ou e-mail: <strong>suporte@appbello.com.br</strong>
        </p>
      </main>
    </div>
  );
}
