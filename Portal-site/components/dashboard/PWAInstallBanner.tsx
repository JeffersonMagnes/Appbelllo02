'use client';

import { useEffect, useState } from 'react';
import { Download, Monitor, Smartphone, Tablet, X, Share, Plus, Copy, Check, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function getDeviceInfo() {
  if (typeof navigator === 'undefined') return { isIOS: false, isSafari: false, isChromeIOS: false, isAndroid: false };
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  const isChromeIOS = isIOS && /CriOS/.test(ua);
  const isAndroid = /Android/.test(ua);
  return { isIOS, isSafari, isChromeIOS, isAndroid };
}

export default function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showHow, setShowHow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [device, setDevice] = useState({ isIOS: false, isSafari: false, isChromeIOS: false, isAndroid: false });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem('pwa_dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (!isNaN(dismissedAt) && Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
      localStorage.removeItem('pwa_dismissed');
    }
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) return;

    setDevice(getDeviceInfo());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    const timer = setTimeout(() => setShow(true), 2000);
    return () => { window.removeEventListener('beforeinstallprompt', handler); clearTimeout(timer); };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') dismiss();
      setDeferredPrompt(null);
    } else {
      setShowHow(true);
    }
  };

  const dismiss = () => {
    setShow(false);
    setShowHow(false);
    localStorage.setItem('pwa_dismissed', Date.now().toString());
  };

  if (!show) return null;

  const isIOSDevice = device.isIOS;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        <div className="p-4 pb-3">
          <button onClick={dismiss} className="absolute top-3 right-3 p-1 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <Image src="/icon-192.png" alt="Appbello" width={40} height={40} className="rounded-xl" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Appbello</p>
              <p className="text-xs text-gray-400">Gestão para seu negócio</p>
            </div>
          </div>

          {isIOSDevice && !showHow ? (
            <>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Para instalar no seu iPhone/iPad, siga os passos abaixo:
              </p>
              <div className="bg-[#5333ED]/5 rounded-xl p-3 space-y-3 mb-3">
                {device.isChromeIOS && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">!</div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-700 font-medium">
                          <strong>Abra no Safari para instalar</strong>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          O Chrome no iPhone não permite instalar apps. Copie o link abaixo e cole no Safari.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 3000); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors"
                      style={{ backgroundColor: copied ? '#22C55E' : '#5333ED', color: '#fff' }}>
                      {copied ? <><Check className="w-3.5 h-3.5" /> Link copiado! Abra o Safari e cole</> : <><Copy className="w-3.5 h-3.5" /> Copiar link para abrir no Safari</>}
                    </button>
                    <div className="h-px bg-gray-200 my-1" />
                    <p className="text-[10px] text-gray-400 text-center">Depois de abrir no Safari, siga os passos abaixo:</p>
                  </>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#5333ED] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-700 font-medium">
                      Toque no botão <strong>Compartilhar</strong>
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Share className="w-4 h-4 text-[#007AFF]" />
                      <span className="text-xs text-gray-400">(ícone na barra inferior do Safari)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#5333ED] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-700 font-medium">
                      Selecione <strong>&quot;Adicionar à Tela de Início&quot;</strong>
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Plus className="w-4 h-4 text-[#007AFF]" />
                      <span className="text-xs text-gray-400">(role para baixo se não aparecer)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#5333ED] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                  <p className="text-xs text-gray-700 font-medium pt-1">
                    Toque em <strong>&quot;Adicionar&quot;</strong> para confirmar
                  </p>
                </div>
              </div>
              <button onClick={dismiss}
                className="w-full h-9 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition-colors">
                Entendi
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Instale o Appbello no seu dispositivo e acesse sem abrir o navegador.
              </p>

              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Monitor className="w-4 h-4" /><span className="text-xs">Desktop</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Smartphone className="w-4 h-4" /><span className="text-xs">Mobile</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Tablet className="w-4 h-4" /><span className="text-xs">Tablet</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={handleInstall}
                  className="flex-1 h-9 rounded-xl bg-[#5333ED] text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#4428c7] transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Instalar
                </button>
                <button onClick={() => setShowHow(!showHow)}
                  className="h-9 px-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition-colors">
                  Como?
                </button>
              </div>
            </>
          )}
        </div>

        {showHow && !isIOSDevice && (
          <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-3 max-h-60 overflow-y-auto">
            <div>
              <p className="text-xs font-bold text-gray-700 mb-1">Chrome / Edge</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Clique em <strong>&quot;Instalar&quot;</strong> na barra de endereço ou vá em Menu (⋮) → Instalar Appbello.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 mb-1">Safari (iPhone / Mac)</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Toque em <strong>Compartilhar</strong> (↑) → <strong>Adicionar à Tela de Início</strong>.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 mb-1">Android</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Toque em Menu (⋮) → <strong>Instalar aplicativo</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
