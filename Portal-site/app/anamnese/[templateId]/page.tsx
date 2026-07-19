'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ClipboardText, TickCircle, ArrowLeft2, Scissor } from 'iconsax-react';
import { createClient } from '@/lib/supabase/client';

export default function AnamnesisPublicPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const templateId = params.templateId as string;
  const estId = searchParams.get('estId');

  const [template, setTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!templateId) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('anamnesis_templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle();

      if (data) {
        setTemplate(data);
      }
      setLoading(false);
    }
    load();
  }, [templateId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!template) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <ClipboardText className="w-16 h-16 text-gray-300 mb-4" variant="Outline" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Ficha não encontrada</h1>
        <p className="text-gray-500">Peça ao seu profissional um novo link.</p>
      </div>
    );
  }

  const sections = template.sections?.filter(
    (s: any) => !s.fields.every((f: any) => f.type === 'photo_comparison')
  ) || [];

  if (sections.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <p className="text-gray-500">Esta ficha não possui campos preenchíveis.</p>
      </div>
    );
  }

  const currentSection = sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === sections.length - 1;
  const progress = ((currentSectionIndex + 1) / sections.length) * 100;

  const updateField = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const validateSection = () => {
    const newErrors: Record<string, boolean> = {};
    let isValid = true;
    currentSection.fields.forEach((field: any) => {
      if (field.type === 'photo_comparison') return;
      if (field.required) {
        const value = formData[field.id];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.id] = true;
          isValid = false;
        }
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (!validateSection()) return;
    if (isLastSection) {
      handleSubmit();
    } else {
      setCurrentSectionIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      await (supabase as any).from('anamnesis_submissions').insert({
        template_id: template.id,
        establishment_id: estId || null,
        data: formData,
      });
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <TickCircle className="w-12 h-12 text-green-500" variant="Outline" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Ficha enviada! 🎉</h1>
        <p className="text-gray-600 mb-2">
          Sua ficha de <span className="font-semibold text-brand-primary">{template.name}</span> foi enviada com sucesso.
        </p>
        <p className="text-sm text-gray-400">O profissional terá acesso às suas informações antes do atendimento.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-brand-primary text-white pt-10 pb-6 px-6 shadow-sm">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Scissor className="w-6 h-6 text-white" variant="Outline" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{template.name}</h1>
              <p className="text-white/70 text-sm">Ficha de Anamnese</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-white/70 text-right">
              Etapa {currentSectionIndex + 1} de {sections.length}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-lg w-full mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentSection.title}</h2>

        <div className="space-y-6">
          {currentSection.fields.map((field: any) => {
            if (field.type === 'photo_comparison') return null;
            const hasError = errors[field.id];

            return (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === 'text' || field.type === 'number' || field.type === 'date' ? (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    value={formData[field.id] || ''}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    placeholder={field.placeholder || 'Digite aqui...'}
                    className={`w-full p-4 bg-white rounded-xl border ${hasError ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:border-brand-primary`}
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.id] || ''}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    placeholder={field.placeholder || 'Digite aqui...'}
                    rows={4}
                    className={`w-full p-4 bg-white rounded-xl border ${hasError ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:border-brand-primary resize-none`}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formData[field.id] || ''}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    className={`w-full p-4 bg-white rounded-xl border ${hasError ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:border-brand-primary`}
                  >
                    <option value="">Selecione...</option>
                    {field.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'radio' ? (
                  <div className="flex flex-wrap gap-3">
                    {field.options?.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => updateField(field.id, opt)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                          formData[field.id] === opt 
                            ? 'bg-brand-primary text-white border-brand-primary' 
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-gray-200 bg-white">
                    <input
                      type="checkbox"
                      checked={formData[field.id] === true}
                      onChange={(e) => updateField(field.id, e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-sm text-gray-700 leading-relaxed">{field.label}</span>
                  </label>
                ) : null}

                {hasError && <p className="text-xs text-red-500 mt-1">Este campo é obrigatório.</p>}
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 mt-10 pb-10">
          {currentSectionIndex > 0 && (
            <button
              onClick={() => setCurrentSectionIndex((p) => p - 1)}
              className="px-6 py-4 rounded-xl font-bold bg-gray-200 text-gray-700 flex-shrink-0 hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft2 className="w-5 h-5" variant="Outline" />
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex-1 py-4 rounded-xl font-bold bg-brand-primary text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLastSection ? (
              <>Enviar Ficha <TickCircle className="w-5 h-5" variant="Outline" /></>
            ) : (
              'Próximo'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
