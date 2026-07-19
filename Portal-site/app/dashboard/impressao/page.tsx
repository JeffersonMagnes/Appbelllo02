'use client';

import { useEffect, useState } from 'react';
import { Printer, Bluetooth, Setting2, TickCircle, CloseCircle, InfoCircle } from 'iconsax-react';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/dashboard/Header';
import {
  loadSettings, saveSettings, connectBluetooth, printThermal, buildReceipt,
  THERMAL_PROFILES, DEFAULT_SETTINGS,
  type PrinterSettings,
} from '@/lib/print/thermal';

type BluetoothStatus = 'idle' | 'connecting' | 'connected' | 'error';

export default function ImpressaoPage() {
  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved]       = useState(false);
  const [btStatus, setBtStatus] = useState<BluetoothStatus>('idle');
  const [btError, setBtError]   = useState('');
  const [btChar, setBtChar]     = useState<any | null>(null);
  const [printing, setPrinting] = useState(false);
  const [btSupported, setBtSupported] = useState(true);

  useEffect(() => {
    setSettings(loadSettings());
    setBtSupported(typeof navigator !== 'undefined' && !!(navigator as any).bluetooth);
  }, []);

  const update = (patch: Partial<PrinterSettings>) => setSettings(s => ({ ...s, ...patch }));

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleConnect = async () => {
    setBtError('');
    setBtStatus('connecting');
    try {
      const char = await connectBluetooth(settings);
      setBtChar(char);
      setBtStatus('connected');
      update({ deviceName: (char as any).service?.device?.name ?? 'Impressora Conectada' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setBtError(msg.includes('User cancelled') ? 'Nenhum dispositivo selecionado.' : msg);
      setBtStatus('error');
    }
  };

  const handleDisconnect = () => {
    try { (btChar as any)?.service?.device?.gatt?.disconnect(); } catch (error) { console.error('Bluetooth disconnect failed:', error); }
    setBtChar(null);
    setBtStatus('idle');
    update({ deviceName: '' });
  };

  const handleTestThermal = async () => {
    if (!btChar) return;
    setPrinting(true);
    try {
      const receipt = buildReceipt({
        establishmentName: 'TESTE DE IMPRESSÃO',
        address: 'AppBello - Sistema de Agendamento',
        date: new Date().toLocaleString('pt-BR'),
        items: [
          { label: 'Serviço', value: 'Corte de Cabelo' },
          { label: 'Profissional', value: 'João Silva' },
          { label: 'Duração', value: '30 min' },
        ],
        total: 'R$ 45,00',
        footer: 'AppBello — Obrigado!',
      }, settings.paperWidth);
      await printThermal(btChar, receipt);
    } catch (e: unknown) {
      setBtError(e instanceof Error ? e.message : 'Erro ao imprimir');
    }
    setPrinting(false);
  };

  const handleTestNormal = () => {
    window.print();
  };

  const profile = THERMAL_PROFILES[settings.bluetoothProfile];

  return (
    <>
      {/* Conteúdo de impressão de teste (visível só ao imprimir) */}
      <div className="hidden print:block p-8">
        <h1 className="text-2xl font-bold text-center mb-2">TESTE DE IMPRESSÃO</h1>
        <p className="text-center text-gray-500 mb-4">AppBello — Sistema de Agendamento</p>
        <hr className="mb-4" />
        <table className="w-full text-sm">
          <tbody>
            <tr><td className="py-1">Serviço</td><td className="py-1 text-right">Corte de Cabelo</td></tr>
            <tr><td className="py-1">Profissional</td><td className="py-1 text-right">João Silva</td></tr>
            <tr><td className="py-1">Data</td><td className="py-1 text-right">{new Date().toLocaleString('pt-BR')}</td></tr>
          </tbody>
        </table>
        <hr className="my-4" />
        <p className="font-bold text-right text-lg">Total: R$ 45,00</p>
        <p className="text-center text-gray-400 text-sm mt-4">Obrigado pela preferência!</p>
      </div>

      <div className="flex flex-col min-h-screen print:hidden">
        <Header title="Configurações de Impressão" />
        <main className="flex-1 p-4 sm:p-6 space-y-5 max-w-2xl mx-auto w-full">

          {/* Tipo de impressora */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Tipo de impressora</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => update({ type: 'thermal' })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${settings.type === 'thermal' ? 'border-[#6666cc] bg-[#6666cc]/5' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Bluetooth className={`w-6 h-6 ${settings.type === 'thermal' ? 'text-[#6666cc]' : 'text-gray-400'}`} variant="Outline" />
                <span className={`text-sm font-semibold ${settings.type === 'thermal' ? 'text-[#6666cc]' : 'text-gray-600'}`}>Térmica Bluetooth</span>
                <span className="text-xs text-gray-400 text-center">Bobina 58mm ou 80mm</span>
              </button>
              <button
                onClick={() => update({ type: 'normal' })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${settings.type === 'normal' ? 'border-[#6666cc] bg-[#6666cc]/5' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Printer className={`w-6 h-6 ${settings.type === 'normal' ? 'text-[#6666cc]' : 'text-gray-400'}`} variant="Outline" />
                <span className={`text-sm font-semibold ${settings.type === 'normal' ? 'text-[#6666cc]' : 'text-gray-600'}`}>Impressora Normal</span>
                <span className="text-xs text-gray-400 text-center">A4, A5 ou comprovante</span>
              </button>
            </div>
          </div>

          {/* Configurações Bluetooth */}
          {settings.type === 'thermal' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-gray-900">Impressora Térmica Bluetooth</h2>

              {!btSupported && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 items-start">
                  <InfoCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" variant="Outline" />
                  <p className="text-sm text-amber-700">Web Bluetooth só funciona no <strong>Chrome</strong> ou <strong>Edge</strong>. Abra o portal nesses navegadores para usar a impressora Bluetooth.</p>
                </div>
              )}

              {/* Largura do papel */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Largura do papel</Label>
                <div className="flex gap-2">
                  {([58, 80] as const).map(w => (
                    <button key={w} onClick={() => update({ paperWidth: w })}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${settings.paperWidth === w ? 'border-[#6666cc] bg-[#6666cc]/5 text-[#6666cc]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {w}mm
                    </button>
                  ))}
                </div>
              </div>

              {/* Perfil Bluetooth */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Modelo / perfil da impressora</Label>
                <select
                  value={settings.bluetoothProfile}
                  onChange={e => update({ bluetoothProfile: Number(e.target.value) })}
                  className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]"
                >
                  {THERMAL_PROFILES.map((p, i) => (
                    <option key={i} value={i}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* UUID personalizado */}
              {settings.bluetoothProfile === THERMAL_PROFILES.length - 1 && (
                <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">UUID do Serviço</Label>
                    <Input value={settings.customService} onChange={e => update({ customService: e.target.value })} placeholder="ex: 0000ff00-0000-1000-8000-00805f9b34fb" className="mt-1 rounded-xl border-gray-200 h-10 font-mono text-xs" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">UUID da Característica</Label>
                    <Input value={settings.customCharacteristic} onChange={e => update({ customCharacteristic: e.target.value })} placeholder="ex: 0000ff02-0000-1000-8000-00805f9b34fb" className="mt-1 rounded-xl border-gray-200 h-10 font-mono text-xs" />
                  </div>
                </div>
              )}

              {/* Info do perfil */}
              {profile && profile.service && settings.bluetoothProfile < THERMAL_PROFILES.length - 1 && (
                <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 space-y-0.5 font-mono">
                  <p>Serviço: {profile.service}</p>
                  <p>Característica: {profile.characteristic}</p>
                </div>
              )}

              {/* Status de conexão */}
              <div className={`rounded-xl p-3 flex items-center gap-3 ${btStatus === 'connected' ? 'bg-green-50 border border-green-200' : btStatus === 'error' ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                {btStatus === 'connected'
                  ? <><Wifi className="w-4 h-4 text-green-500" /><span className="text-sm text-green-700 font-medium">{settings.deviceName || 'Conectado'}</span></>
                  : btStatus === 'error'
                  ? <><WifiOff className="w-4 h-4 text-red-400" /><span className="text-sm text-red-600">{btError}</span></>
                  : <><WifiOff className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-500">Nenhuma impressora conectada</span></>
                }
              </div>

              {/* Botões Bluetooth */}
              <div className="flex gap-2">
                {btStatus !== 'connected' ? (
                  <Button onClick={handleConnect} disabled={btStatus === 'connecting' || !btSupported}
                    className="flex-1 bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl h-10">
                    {btStatus === 'connecting' ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Conectando...</> : <><Bluetooth className="w-4 h-4 mr-2" variant="Outline" />Conectar Impressora</>}
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleTestThermal} disabled={printing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0 rounded-xl h-10">
                      {printing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Imprimindo...</> : <><Printer className="w-4 h-4 mr-2" variant="Outline" />Impressão de teste</>}
                    </Button>
                    <Button onClick={handleDisconnect} variant="outline" className="rounded-xl h-10 border-red-200 text-red-500 hover:bg-red-50">
                      Desconectar
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Configurações impressora normal */}
          {settings.type === 'normal' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-gray-900">Impressora Normal</h2>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Tamanho do papel</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'A4', label: 'A4', desc: '210 × 297mm' },
                    { id: 'A5', label: 'A5', desc: '148 × 210mm' },
                    { id: 'receipt', label: 'Comprovante', desc: '80 × 200mm' },
                  ] as { id: 'A4' | 'A5' | 'receipt'; label: string; desc: string }[]).map(opt => (
                    <button key={opt.id} onClick={() => update({ paperSize: opt.id })}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${settings.paperSize === opt.id ? 'border-[#6666cc] bg-[#6666cc]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className={`text-sm font-semibold ${settings.paperSize === opt.id ? 'text-[#6666cc]' : 'text-gray-700'}`}>{opt.label}</span>
                      <span className="text-xs text-gray-400">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Mostrar logo</p>
                  <p className="text-xs text-gray-400">Exibe o logo do estabelecimento no cabeçalho</p>
                </div>
                <button onClick={() => update({ showLogo: !settings.showLogo })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${settings.showLogo ? 'bg-[#6666cc]' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.showLogo ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <Button onClick={handleTestNormal} variant="outline" className="w-full rounded-xl h-10 border-[#6666cc]/30 text-[#6666cc] hover:bg-[#6666cc]/5">
                <Printer className="w-4 h-4 mr-2" variant="Outline" />
                Imprimir página de teste
              </Button>
            </div>
          )}

          {/* Como usar */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <InfoCircle className="w-4 h-4 text-blue-500" variant="Outline" />
              <h3 className="text-sm font-bold text-blue-800">Como usar</h3>
            </div>
            {settings.type === 'thermal' ? (
              <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                <li>Ligue a impressora e ative o Bluetooth no computador</li>
                <li>Clique em &quot;Conectar Impressora&quot; e selecione o dispositivo na lista</li>
                <li>Se não aparecer, verifique se o perfil está correto para o modelo da impressora</li>
                <li>Após conectar, você poderá imprimir comprovantes de agendamentos e comandas</li>
                <li><strong>Requer Chrome ou Edge</strong> — Firefox e Safari não suportam Web Bluetooth</li>
              </ul>
            ) : (
              <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                <li>Funciona com qualquer impressora instalada no computador</li>
                <li>Use o botão de imprimir nas telas de agendamentos, comandas e recibos</li>
                <li>O CSS de impressão se adapta automaticamente ao tamanho de papel selecionado</li>
              </ul>
            )}
          </div>

          {/* Salvar */}
          <Button onClick={handleSave}
            className={`w-full rounded-xl h-11 font-semibold transition-all ${saved ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-[#6666cc] hover:bg-[#5555aa]'} text-white border-0`}>
            {saved ? <><TickCircle className="w-4 h-4 mr-2" variant="Outline" />Configurações salvas!</> : 'Salvar configurações'}
          </Button>
        </main>
      </div>

      {/* CSS de impressão dinâmico */}
      <style>{`
        @media print {
          @page {
            size: ${settings.paperSize === 'A5' ? 'A5' : settings.paperSize === 'receipt' ? '80mm 200mm' : 'A4'};
            margin: ${settings.paperSize === 'receipt' ? '4mm' : '15mm'};
          }
        }
      `}</style>
    </>
  );
}
