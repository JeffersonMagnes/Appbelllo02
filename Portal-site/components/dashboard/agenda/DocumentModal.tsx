'use client';

import { X, FileText, Receipt, Printer } from 'lucide-react';
import { statusLabels, fmtBRL, PAY_METHODS } from '@/lib/agenda-format';
import type { Appointment } from '@/lib/supabase/types';

export interface DocModalState {
  type: 'cobranca' | 'recibo';
  apt: Appointment;
}

export function DocumentModal({
  docModal,
  onClose,
  estName,
  payMethod,
  getClientName,
  getServiceName,
  getServicePrice,
  getEmployeeName,
  onPrint,
}: {
  docModal: DocModalState | null;
  onClose: () => void;
  estName: string;
  payMethod: string;
  getClientName: (apt: Appointment) => string;
  getServiceName: (apt: Appointment) => string;
  getServicePrice: (apt: Appointment) => number;
  getEmployeeName: (apt: Appointment) => string;
  onPrint: () => void;
}) {
  if (!docModal) return null;

  const apt = docModal.apt;
  const isRecibo = docModal.type === 'recibo';
  const title = isRecibo ? 'RECIBO' : 'COBRANÇA';
  const clientName = getClientName(apt);
  const serviceName = getServiceName(apt);
  const price = getServicePrice(apt);
  const employeeName = getEmployeeName(apt);
  const dateFormatted = new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const now = new Date();
  const emittedAt = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  const payLabel = PAY_METHODS.find(m => m.v === payMethod)?.l ?? payMethod;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-gray-100 z-10">
          <div className="flex items-center gap-2">
            {isRecibo
              ? <Receipt className="w-5 h-5 text-emerald-600" />
              : <FileText className="w-5 h-5 text-amber-600" />
            }
            <h3 className="font-bold text-gray-900 text-sm">
              {isRecibo ? 'Recibo de Pagamento' : 'Cobrança de Serviço'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#6666cc] text-white text-xs font-semibold hover:bg-[#5555aa] transition-colors">
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable document content */}
        <div id="doc-print-area" className="p-6">
          <div className="doc-container">
            {/* Document header */}
            <div className="doc-header" style={{ textAlign: 'center', marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid #6666cc' }}>
              <h1 style={{ fontSize: 22, color: '#6666cc', marginBottom: 4, fontWeight: 800 }}>
                {estName || 'Estabelecimento'}
              </h1>
              <p style={{ fontSize: 13, color: '#666' }}>Documento emitido em {emittedAt}</p>
              <div style={{
                display: 'inline-block', padding: '4px 16px', borderRadius: 20,
                fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 12,
                background: isRecibo ? '#D1FAE5' : '#FEF3C7',
                color: isRecibo ? '#065F46' : '#92400E',
              }}>
                {title}
              </div>
            </div>

            {/* Client info */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8, fontWeight: 600 }}>
                Dados do Cliente
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 13, color: '#666' }}>Nome</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{clientName}</span>
              </div>
            </div>

            {/* Service info */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8, fontWeight: 600 }}>
                Dados do Serviço
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 13, color: '#666' }}>Serviço</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{serviceName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 13, color: '#666' }}>Profissional</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{employeeName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 13, color: '#666' }}>Data</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', textTransform: 'capitalize' as const }}>{dateFormatted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 13, color: '#666' }}>Horário</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{apt.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 13, color: '#666' }}>Status</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{statusLabels[apt.status] ?? apt.status}</span>
              </div>
              {isRecibo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ fontSize: 13, color: '#666' }}>Forma de Pagamento</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{payLabel}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div style={{ background: '#f8f7ff', borderRadius: 12, padding: 16, marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#444' }}>
                {isRecibo ? 'Valor Pago' : 'Valor a Pagar'}
              </span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#6666cc' }}>{fmtBRL(price)}</span>
            </div>

            {/* Receipt confirmation text */}
            {isRecibo && (
              <div style={{ marginTop: 24, padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                <p style={{ fontSize: 13, color: '#166534', fontWeight: 600, marginBottom: 4 }}>Pagamento Confirmado</p>
                <p style={{ fontSize: 12, color: '#15803d' }}>
                  Confirmamos o recebimento do valor de {fmtBRL(price)} referente ao serviço de {serviceName} realizado em {dateFormatted}.
                </p>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #eee', textAlign: 'center', fontSize: 11, color: '#999' }}>
              <p>{estName || 'Estabelecimento'}</p>
              <p style={{ marginTop: 4 }}>Documento gerado automaticamente pelo sistema</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
