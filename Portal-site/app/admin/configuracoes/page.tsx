'use client';

import { useState } from 'react';
import { Save2, User, Lock, Notification, Activity, ImportSquare } from 'iconsax-react';
import { Bell } from 'lucide-react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const mockAuditLogs = [
  { id: 'l1', user: 'Rafael Souza', action: 'Alterou preço do plano Pro de R$79 para R$89', ip: '177.82.12.45', at: 'Hoje, 10:34' },
  { id: 'l2', user: 'Camila Rocha', action: 'Bloqueou usuário carlos@salao.com.br', ip: '187.22.14.21', at: 'Hoje, 09:18' },
  { id: 'l3', user: 'Bruno Lima', action: 'Exportou relatório financeiro (Março 2026)', ip: '201.45.67.89', at: 'Ontem, 17:40' },
  { id: 'l4', user: 'Rafael Souza', action: 'Criou novo anúncio: Schwarzkopf 20% OFF', ip: '177.82.12.45', at: 'Ontem, 14:20' },
  { id: 'l5', user: 'Tatiane Ferreira', action: 'Respondeu mensagem do usuário ana@salaoana.com.br', ip: '192.168.1.5', at: '19/04/2026, 11:00' },
];
const TABS = [
  { id: 'perfil', label: 'Meu perfil', icon: User }, { id: 'senha', label: 'Senha', icon: Lock },
  { id: 'notif', label: 'Notificações', icon: Bell }, { id: 'auditoria', label: 'Auditoria', icon: Activity },
];

export default function ConfiguracoesPortalPage() {
  const [tab, setTab] = useState('perfil');
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState('Rafael Souza');
  const [email, setEmail] = useState('rafael@appbello.com.br');
  const [notifPrefs, setNotifPrefs] = useState({ newUser: true, paymentFailed: true, trialExpiring: true, dailyReport: false, weeklyReport: true, systemAlerts: true });
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Configurações do Portal']} />
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div><h1 className="text-2xl font-bold text-gray-900">Configurações do Portal</h1><p className="text-sm text-gray-500 mt-0.5">Preferências pessoais e segurança da conta</p></div>
            {tab !== 'auditoria' && <Button onClick={handleSave} className={`gap-2 rounded-xl transition-all ${saved ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-[#6666cc] hover:bg-[#5555aa]'} text-white`}><Save2 className="w-4 h-4"  variant="Outline" /> {saved ? 'Salvo!' : 'Salvar'}</Button>}
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1.5">
            {TABS.map(t => { const Icon = t.icon; return <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === t.id ? 'bg-[#6666cc] text-white' : 'text-gray-500 hover:bg-gray-50'}`}><Icon className="w-4 h-4" /><span className="hidden sm:block">{t.label}</span></button>; })}
          </div>

          {tab === 'perfil' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-4"><div className="w-16 h-16 rounded-full bg-[#6666cc]/15 text-[#6666cc] text-xl font-bold flex items-center justify-center">RS</div><div><Button variant="outline" size="sm" className="rounded-xl border-gray-200">Alterar foto</Button><p className="text-xs text-gray-400 mt-1.5">JPG ou PNG, máx. 2MB</p></div></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome completo</label><Input value={name} onChange={e => setName(e.target.value)} className="h-10 rounded-xl border-gray-200" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">E-mail</label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-10 rounded-xl border-gray-200" /></div>
              </div>
              <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Cargo</label><div className="h-10 px-3 flex items-center bg-gray-50 rounded-xl border border-gray-200"><span className="text-sm text-gray-500">Super Admin</span></div></div>
            </div>
          )}

          {tab === 'senha' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-gray-900">Alterar senha</h2>
              <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Senha atual</label><Input type="password" className="h-10 rounded-xl border-gray-200" /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Nova senha</label><Input type="password" className="h-10 rounded-xl border-gray-200" /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Confirmar nova senha</label><Input type="password" className="h-10 rounded-xl border-gray-200" /></div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3"><p className="text-xs text-blue-700">A senha deve ter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas e números.</p></div>
            </div>
          )}

          {tab === 'notif' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-gray-900">Alertas do portal</h2>
              {[
                { key: 'newUser', label: 'Novo cadastro', desc: 'Quando um novo usuário se cadastra' },
                { key: 'paymentFailed', label: 'Falha de pagamento', desc: 'Quando uma cobrança falha' },
                { key: 'trialExpiring', label: 'Trial expirando', desc: 'Usuários com trial < 2 dias' },
                { key: 'dailyReport', label: 'Relatório diário', desc: 'Resumo diário de métricas' },
                { key: 'weeklyReport', label: 'Relatório semanal', desc: 'Resumo semanal no e-mail' },
                { key: 'systemAlerts', label: 'Alertas do sistema', desc: 'Erros críticos e manutenções' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div><p className="text-sm font-semibold text-gray-900">{item.label}</p><p className="text-xs text-gray-400 mt-0.5">{item.desc}</p></div>
                  <button onClick={() => setNotifPrefs(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))} className={`relative w-11 h-6 rounded-full transition-colors ${notifPrefs[item.key as keyof typeof notifPrefs] ? 'bg-[#6666cc]' : 'bg-gray-200'}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifPrefs[item.key as keyof typeof notifPrefs] ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                </div>
              ))}
            </div>
          )}

          {tab === 'auditoria' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <p className="font-bold text-gray-900">Log de auditoria</p>
                <button onClick={() => {
                  const header = 'Usuário,Ação,IP,Data';
                  const rows = mockAuditLogs.map(l => `${l.user},"${l.action}",${l.ip},${l.at}`);
                  const csv = [header, ...rows].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'auditoria.csv'; a.click();
                  URL.revokeObjectURL(url);
                }} className="flex items-center gap-1.5 text-xs text-[#6666cc] font-medium hover:underline"><ImportSquare className="w-3.5 h-3.5"  variant="Outline" /> Exportar</button>
              </div>
              <div className="divide-y divide-gray-50">
                {mockAuditLogs.map(log => (
                  <div key={log.id} className="px-5 py-4 hover:bg-gray-50/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#6666cc]/10 text-[#6666cc] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{log.user.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                        <div><p className="text-sm font-semibold text-gray-900">{log.user}</p><p className="text-xs text-gray-500 mt-0.5">{log.action}</p><p className="text-[10px] text-gray-400 mt-1">IP: {log.ip}</p></div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{log.at}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
