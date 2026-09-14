'use client';

import { Notification, Sms, Clock } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotificacoesCard({
  pushEnabled,
  setPushEnabled,
  emailEnabled,
  setEmailEnabled,
  smsEnabled,
  setSmsEnabled,
  reminderEnabled,
  setReminderEnabled,
  reminderMinutes,
  setReminderMinutes,
  savingNotifications,
  notificationsSaved,
  notificationsError,
  onSaveNotifications,
}: {
  pushEnabled: boolean;
  setPushEnabled: (v: boolean) => void;
  emailEnabled: boolean;
  setEmailEnabled: (v: boolean) => void;
  smsEnabled: boolean;
  setSmsEnabled: (v: boolean) => void;
  reminderEnabled: boolean;
  setReminderEnabled: (v: boolean) => void;
  reminderMinutes: number;
  setReminderMinutes: (v: number) => void;
  savingNotifications: boolean;
  notificationsSaved: boolean;
  notificationsError: string;
  onSaveNotifications: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Notification className="w-5 h-5 text-brand-primary" variant="Outline" />
        <h3 className="font-bold text-gray-900">Notificações</h3>
      </div>

      {/* Push */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
        <div className="flex-1 mr-4">
          <p className="text-gray-900 font-bold text-sm">Notificações Push</p>
          <p className="text-gray-500 text-xs mt-0.5">Receba avisos de agendamentos no navegador</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={pushEnabled} onChange={e => setPushEnabled(e.target.checked)} className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
        </label>
      </div>

      {/* Email */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
        <div className="flex-1 mr-4">
          <p className="text-gray-900 font-bold text-sm">E-mail</p>
          <p className="text-gray-500 text-xs mt-0.5">Receba relatórios e avisos importantes</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={emailEnabled} onChange={e => setEmailEnabled(e.target.checked)} className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
        </label>
      </div>

      {/* SMS */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
        <div className="flex-1 mr-4">
          <div className="flex items-center gap-1.5">
            <Sms className="w-4 h-4 text-gray-500" variant="Outline" />
            <p className="text-gray-900 font-bold text-sm">SMS</p>
          </div>
          <p className="text-gray-500 text-xs mt-0.5">Receba lembretes via SMS</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={smsEnabled} onChange={e => setSmsEnabled(e.target.checked)} className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
        </label>
      </div>

      {/* Appointment Reminder */}
      <div className={`p-4 rounded-xl border ${reminderEnabled ? 'bg-brand-primary/5 border-brand-primary/20' : 'bg-gray-50 border-gray-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-primary" variant="Outline" />
              <p className="text-gray-900 font-bold text-sm">Lembrete de atendimento</p>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">
              {reminderEnabled ? `Avisa ${reminderMinutes} min antes de cada atendimento` : 'Desativado'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={reminderEnabled} onChange={e => setReminderEnabled(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
          </label>
        </div>
        {reminderEnabled && (
          <div className="mt-3 pt-3 border-t border-brand-primary/10">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Quanto tempo antes?</p>
            <div className="flex gap-2">
              {[15, 30, 60].map(min => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setReminderMinutes(min)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    reminderMinutes === min
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-brand-primary/40'
                  }`}
                >
                  {min}min
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={onSaveNotifications} disabled={savingNotifications} className="bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl h-9 px-6 text-sm font-semibold">
          {savingNotifications ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
          Salvar notificações
        </Button>
        {notificationsSaved && <span className="text-green-600 text-sm font-medium">✓ Salvo!</span>}
        {notificationsError && <span className="text-red-500 text-sm font-medium">{notificationsError}</span>}
      </div>
    </div>
  );
}
