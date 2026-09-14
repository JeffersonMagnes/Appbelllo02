'use client';

import { Lock, User } from 'iconsax-react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function MinhaContaCard({
  userName,
  setUserName,
  userEmail,
  userPhone,
  setUserPhone,
  savingAccount,
  accountSaved,
  accountError,
  onSaveAccount,
  showPasswordFields,
  setShowPasswordFields,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showNewPass,
  setShowNewPass,
  showConfirmPass,
  setShowConfirmPass,
  savingPassword,
  passwordSaved,
  passwordError,
  onChangePassword,
}: {
  userName: string;
  setUserName: (v: string) => void;
  userEmail: string;
  userPhone: string;
  setUserPhone: (v: string) => void;
  savingAccount: boolean;
  accountSaved: boolean;
  accountError: string;
  onSaveAccount: () => void;
  showPasswordFields: boolean;
  setShowPasswordFields: (v: boolean) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showNewPass: boolean;
  setShowNewPass: (v: boolean) => void;
  showConfirmPass: boolean;
  setShowConfirmPass: (v: boolean) => void;
  savingPassword: boolean;
  passwordSaved: boolean;
  passwordError: string;
  onChangePassword: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <User className="w-5 h-5 text-brand-primary" variant="Outline" />
        <h3 className="font-bold text-gray-900">Minha Conta</h3>
      </div>
      <div className="space-y-3">
        <div>
          <Label className="text-gray-700 font-medium text-sm">Nome</Label>
          <Input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Seu nome" className="mt-1 rounded-xl border-gray-200 h-10" />
        </div>
        <div>
          <Label className="text-gray-700 font-medium text-sm">E-mail</Label>
          <Input value={userEmail} disabled className="mt-1 rounded-xl border-gray-200 h-10 bg-gray-50 text-gray-500" />
          <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado por aqui.</p>
        </div>
        <div>
          <Label className="text-gray-700 font-medium text-sm">Telefone</Label>
          <Input value={userPhone} onChange={e => setUserPhone(e.target.value)} placeholder="(11) 99999-9999" className="mt-1 rounded-xl border-gray-200 h-10" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={onSaveAccount} disabled={savingAccount} className="bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl h-9 px-6 text-sm font-semibold">
          {savingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
          Salvar dados
        </Button>
        {accountSaved && <span className="text-green-600 text-sm font-medium">✓ Salvo!</span>}
        {accountError && <span className="text-red-500 text-sm font-medium">{accountError}</span>}
      </div>

      {/* Alterar Senha */}
      <div className="border-t border-gray-100 pt-4 mt-4">
        <button onClick={() => setShowPasswordFields(!showPasswordFields)} className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-brand-primary transition-colors">
          <Lock className="w-4 h-4" variant="Outline" />
          Alterar Senha
          <svg className={`w-3.5 h-3.5 transition-transform ${showPasswordFields ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        {showPasswordFields && (
          <div className="mt-3 space-y-3 max-w-sm">
            <div>
              <Label className="text-gray-700 font-medium text-sm">Nova Senha</Label>
              <div className="relative mt-1">
                <Input type={showNewPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="rounded-xl border-gray-200 h-10 pr-10" />
                <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-gray-700 font-medium text-sm">Confirmar Nova Senha</Label>
              <div className="relative mt-1">
                <Input type={showConfirmPass ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" className="rounded-xl border-gray-200 h-10 pr-10" />
                <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={onChangePassword} disabled={savingPassword} className="bg-gray-900 hover:bg-gray-800 text-white border-0 rounded-xl h-9 px-6 text-sm font-semibold">
                {savingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Lock className="w-3.5 h-3.5 mr-1.5" variant="Outline" />}
                Alterar Senha
              </Button>
              {passwordSaved && <span className="text-green-600 text-sm font-medium">✓ Senha alterada!</span>}
              {passwordError && <span className="text-red-500 text-sm">{passwordError}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
