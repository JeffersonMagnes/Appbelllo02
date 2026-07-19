'use client';

import { useState } from 'react';
import { Database, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { seedDemoData } from '@/lib/demo-data';

interface DemoDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSeedComplete: () => void;
  establishmentId: string;
}

export default function DemoDataDialog({
  open,
  onOpenChange,
  onSeedComplete,
  establishmentId,
}: DemoDataDialogProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSeed = async () => {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      await seedDemoData(supabase, establishmentId);
      setSuccess(true);
      setTimeout(() => {
        onSeedComplete();
        onOpenChange(false);
        // Reset state after close animation
        setTimeout(() => {
          setSuccess(false);
          setLoading(false);
        }, 300);
      }, 1500);
    } catch (err: unknown) {
      console.error('Erro ao preencher dados de exemplo:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao preencher dados de exemplo. Tente novamente.',
      );
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    onSeedComplete();
  };

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (loading) e.preventDefault(); }}>
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#5333ED]/10">
            {success ? (
              <CheckCircle2 className="h-7 w-7 text-green-500" />
            ) : (
              <Database className="h-7 w-7 text-[#5333ED]" />
            )}
          </div>

          <DialogTitle className="text-center text-xl">
            {success ? 'Pronto!' : 'Quer ver como o sistema funciona?'}
          </DialogTitle>

          <DialogDescription className="text-center text-sm leading-relaxed">
            {success
              ? 'Dados de exemplo adicionados com sucesso. Explore todas as funcionalidades!'
              : 'Preencha seu estabelecimento com dados de exemplo para explorar todas as funcionalidades. Você pode limpar depois nas configurações.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {!success && (
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button
              className="gradient-primary w-full text-white"
              onClick={handleSeed}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preenchendo...
                </>
              ) : (
                'Preencher com exemplos'
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={handleSkip}
              disabled={loading}
            >
              Começar do zero
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
