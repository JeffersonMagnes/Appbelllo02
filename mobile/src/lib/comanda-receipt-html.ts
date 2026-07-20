import { Comanda } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/comanda-format';

/** Builds the printable HTML receipt used by expo-print. */
export function buildReceiptHTML(clientName: string, total: number, items: Comanda['items'], now: string): string {
  const itemsHTML = items.map(i => `
    <tr>
      <td style="padding:8px 0;color:#444;font-size:14px;">${i.name}</td>
      <td style="padding:8px 0;text-align:right;font-weight:700;color:#1C1C1E;font-size:14px;">${formatCurrency(i.total)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin:0;padding:32px;background:#fff;color:#1C1C1E;}
    .header{text-align:center;margin-bottom:28px;}
    .logo{font-size:24px;font-weight:900;color:#5333ed;letter-spacing:-1px;}
    .sub{font-size:13px;color:#8E8E93;margin-top:4px;}
    .divider{border:none;border-top:1px dashed #D1D1D6;margin:20px 0;}
    .client-row{display:flex;justify-content:space-between;align-items:center;background:#F5F5F7;padding:14px 16px;border-radius:12px;margin-bottom:16px;}
    .label{font-size:11px;color:#8E8E93;margin-bottom:2px;}
    .value{font-size:16px;font-weight:700;}
    .total-row{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-top:2px solid #1C1C1E;margin-top:8px;}
    .total-label{font-size:16px;font-weight:800;}
    .total-value{font-size:22px;font-weight:900;color:#5333ed;}
    table{width:100%;border-collapse:collapse;}
    .footer{text-align:center;margin-top:32px;font-size:12px;color:#8E8E93;}
  </style></head><body>
  <div class="header">
    <div class="logo">Appbello</div>
    <div class="sub">Recibo de pagamento</div>
    <div class="sub">${now}</div>
  </div>
  <div class="client-row">
    <div><div class="label">Cliente</div><div class="value">${clientName}</div></div>
  </div>
  ${items.length > 0 ? `<table>${itemsHTML}</table>` : ''}
  <div class="total-row">
    <span class="total-label">TOTAL</span>
    <span class="total-value">${formatCurrency(total)}</span>
  </div>
  <div class="footer">Obrigado pela preferência!<br>Appbello · Sistema de Gestão</div>
</body></html>`;
}
