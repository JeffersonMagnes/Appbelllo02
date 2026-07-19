'use client';

import { useEffect, useState } from 'react';
import { Gift, Copy, TickCircle, Profile2User, Flash, Tag } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function IndiquePage() {
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [estName, setEstName] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const DISCOUNT = 20;
  const referralUrl = slug ? `https://appbello.com.br/cadastro?ref=${slug}` : '';

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await (supabase as any)
        .from('establishments')
        .select('slug, name, referral_count')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (data) {
        setSlug(data.slug || '');
        setEstName(data.name || '');
        setReferralCount(data.referral_count || 0);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleCopy = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = () => {
    if (navigator.share && referralUrl) {
      navigator.share({
        title: 'Convite Appbello',
        text: `Olá! Eu uso o Appbello para gerenciar meu negócio e recomendo muito. Use meu link de indicação e ganhe ${DISCOUNT}% de desconto na assinatura! 💈`,
        url: referralUrl,
      });
    }
  };

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-brand-primary to-brand-secondary px-6 pt-12 pb-20">
        <div className="max-w-2xl mx-auto text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-white" variant="Outline" />
          </div>
          <h1 className="text-2xl font-black mb-2">Programa de Indicações</h1>
          <p className="text-white/80 text-sm">Indique o Appbello e ganhe descontos na sua assinatura!</p>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 -mt-12 space-y-5 pb-8">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label:'Indicações realizadas', value: String(referralCount), icon: Profile2User, color:'text-brand-primary', bg:'bg-brand-primary/10' },
            { label:'Desconto por indicação', value: `${DISCOUNT}%`, icon: Flash, color:'text-amber-600', bg:'bg-amber-100' },
          ].map(c=>(
            <div key={c.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
                <c.icon className={`w-5 h-5 ${c.color}`} variant="Outline" />
              </div>
              <div className={`text-2xl font-black ${c.color}`}>{c.value}</div>
              <div className="text-xs text-gray-500 mt-1">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Link card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-5 h-5 text-brand-primary" variant="Outline" />
            <h3 className="font-bold text-gray-900">Seu link de indicação</h3>
          </div>

          {slug ? (
            <>
              <div className="bg-brand-primary/5 rounded-xl p-4 border border-brand-primary/20">
                <p className="text-xs text-gray-400 mb-1">Link exclusivo:</p>
                <p className="text-brand-primary font-medium text-sm break-all">{referralUrl}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={handleCopy}
                  className={`flex-1 h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${copied?'bg-green-500 text-white':'bg-brand-primary text-white'}`}>
                  {copied ? <><TickCircle className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" variant="Outline" /> Copiar link</>}
                </button>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button onClick={handleShare} className="flex-1 h-11 rounded-xl font-semibold text-sm border-2 border-brand-primary text-brand-primary hover:bg-brand-primary/5 flex items-center justify-center gap-2">
                    <Gift className="w-4 h-4" variant="Outline" /> Compartilhar
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">Configure um slug para o seu estabelecimento nas <a href="/dashboard/configuracoes" className="text-brand-primary font-medium hover:underline">Configurações</a> para ativar o link de indicação.</p>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Como funciona</h3>
          <div className="space-y-4">
            {[
              { n:'1', text:'Compartilhe seu link exclusivo com amigos donos de salão ou barbearia', color:'bg-brand-primary text-white' },
              { n:'2', text:`Quando alguém se cadastrar pelo seu link, você ganha ${DISCOUNT}% de desconto na próxima mensalidade`, color:'bg-brand-secondary text-white' },
              { n:'3', text:'Não há limite de indicações — quanto mais indicar, mais você economiza!', color:'bg-green-500 text-white' },
            ].map(s=>(
              <div key={s.n} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${s.color}`}>{s.n}</div>
                <p className="text-sm text-gray-600 pt-0.5">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
