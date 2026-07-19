import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Client, ClientAnamnesis } from '@/lib/types';
import type { FilledAnamnesis, PhotoComparison, AnamnesisTemplate } from '@/lib/state/anamnesis-store';

interface GeneratePDFOptions {
  client: Client;
  legacyAnamnesis?: ClientAnamnesis | null;
  filledAnamnesis?: FilledAnamnesis[];
  templates?: AnamnesisTemplate[];
  businessName?: string;
  businessLogo?: string;
  primaryColor?: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function renderFieldValue(value: string | boolean | string[] | PhotoComparison): string {
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object' && value !== null) return ''; // photo comparison handled separately
  return String(value);
}

function renderPhotosSection(photos: PhotoComparison): string {
  if (!photos || (photos.before?.length === 0 && photos.after?.length === 0)) return '';

  const beforeImgs = (photos.before ?? [])
    .map(uri => `
      <div class="photo-item">
        <img src="${uri}" />
        <span class="photo-label before">ANTES</span>
      </div>
    `)
    .join('');

  const afterImgs = (photos.after ?? [])
    .map(uri => `
      <div class="photo-item">
        <img src="${uri}" />
        <span class="photo-label after">DEPOIS</span>
      </div>
    `)
    .join('');

  return `
    <div class="photos-section">
      <p class="section-label">Fotos Comparativas</p>
      <div class="photos-grid">${beforeImgs}${afterImgs}</div>
    </div>
  `;
}

function renderFilledAnamnesis(anamnesis: FilledAnamnesis, templates: AnamnesisTemplate[]): string {
  const template = templates.find(t => t.id === anamnesis.templateId);
  const data = anamnesis.data;

  let photosHtml = '';
  let fieldsHtml = '';

  // Find all photo comparisons
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'object' && !Array.isArray(value) && value !== null && 'before' in value) {
      photosHtml += renderPhotosSection(value as PhotoComparison);
    }
  });

  // Render sections in order from template
  if (template) {
    template.sections.forEach(section => {
      const sectionFields = section.fields
        .filter(field => {
          const val = data[field.id];
          if (field.type === 'photo_comparison') return false;
          if (val === undefined || val === null || val === '' || val === false) return false;
          if (Array.isArray(val) && val.length === 0) return false;
          return true;
        })
        .map(field => {
          const val = data[field.id];
          return `
            <div class="field-row">
              <span class="field-label">${field.label}</span>
              <span class="field-value">${renderFieldValue(val)}</span>
            </div>
          `;
        })
        .join('');

      if (sectionFields) {
        fieldsHtml += `
          <div class="subsection">
            <p class="subsection-title">${section.title}</p>
            ${sectionFields}
          </div>
        `;
      }
    });
  } else {
    // Fallback: just dump all fields
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && !Array.isArray(value)) return;
      const rendered = renderFieldValue(value);
      if (!rendered) return;
      fieldsHtml += `
        <div class="field-row">
          <span class="field-label">${key}</span>
          <span class="field-value">${rendered}</span>
        </div>
      `;
    });
  }

  return `
    <div class="anamnesis-card">
      <div class="anamnesis-header">
        <div class="anamnesis-icon">📋</div>
        <div>
          <p class="anamnesis-name">${anamnesis.templateName}</p>
          <p class="anamnesis-date">Preenchido em ${formatDateTime(anamnesis.filledAt)}</p>
        </div>
      </div>
      ${fieldsHtml}
      ${photosHtml}
    </div>
  `;
}

export async function generateClientPDF(options: GeneratePDFOptions): Promise<void> {
  const {
    client,
    legacyAnamnesis,
    filledAnamnesis = [],
    templates = [],
    businessName = 'Appbello',
    businessLogo = '',
    primaryColor = '#5333ed',
  } = options;

  const logoHtml = businessLogo
    ? `<img src="${businessLogo}" class="logo-img" />`
    : `<div class="logo-placeholder">${businessName.charAt(0)}</div>`;

  const clientAvatarHtml = client.avatar
    ? `<img src="${client.avatar}" class="client-avatar" />`
    : `<div class="client-avatar-placeholder">${client.name.charAt(0).toUpperCase()}</div>`;

  const ageHtml = client.birthDate
    ? `<span class="chip">${calculateAge(client.birthDate)} anos</span>`
    : '';

  const birthHtml = client.birthDate
    ? `<div class="info-row"><span class="info-label">Nascimento</span><span class="info-value">${formatDate(client.birthDate)}</span></div>`
    : '';

  const notesHtml = client.notes
    ? `
      <div class="section">
        <p class="section-title">Observações</p>
        <p class="notes-text">${client.notes}</p>
      </div>
    `
    : '';

  // Legacy anamnesis section
  let legacyHtml = '';
  if (legacyAnamnesis) {
    const fields = [
      { label: 'Alergias', value: legacyAnamnesis.allergies },
      { label: 'Medicamentos em uso', value: legacyAnamnesis.medications },
      { label: 'Condições de Saúde', value: legacyAnamnesis.healthConditions },
      { label: 'Tipo de Pele', value: legacyAnamnesis.skinType },
      { label: 'Tipo de Cabelo', value: legacyAnamnesis.hairType },
      { label: 'Preferências', value: legacyAnamnesis.preferences },
      { label: 'Observações da Ficha', value: legacyAnamnesis.observations },
    ].filter(f => f.value);

    if (fields.length > 0) {
      legacyHtml = `
        <div class="anamnesis-card">
          <div class="anamnesis-header">
            <div class="anamnesis-icon">📝</div>
            <div>
              <p class="anamnesis-name">Ficha Geral</p>
              <p class="anamnesis-date">Atualizado em ${formatDate(legacyAnamnesis.lastUpdate)}</p>
            </div>
          </div>
          ${fields.map(f => `
            <div class="field-row">
              <span class="field-label">${f.label}</span>
              <span class="field-value">${f.value}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  const filledHtml = filledAnamnesis
    .map(a => renderFilledAnamnesis(a, templates))
    .join('');

  const hasAnamnesis = legacyHtml || filledHtml;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ficha do Cliente - ${client.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fff;
      color: #1a1a2e;
      font-size: 13px;
    }

    /* Header Bar */
    .header-bar {
      background: linear-gradient(135deg, ${primaryColor}, #2cd4d9);
      padding: 28px 32px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-img {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      object-fit: cover;
      border: 2px solid rgba(255,255,255,0.4);
    }
    .logo-placeholder {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: rgba(255,255,255,0.2);
      border: 2px solid rgba(255,255,255,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 800;
      color: #fff;
    }
    .brand-name {
      color: #fff;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .brand-tagline {
      color: rgba(255,255,255,0.7);
      font-size: 11px;
      margin-top: 2px;
    }
    .header-date {
      color: rgba(255,255,255,0.7);
      font-size: 11px;
      text-align: right;
    }

    /* Client Profile */
    .client-profile {
      padding: 28px 32px;
      display: flex;
      align-items: flex-start;
      gap: 24px;
      background: #fafafa;
      border-bottom: 1px solid #eee;
    }
    .client-avatar {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid ${primaryColor}30;
      flex-shrink: 0;
    }
    .client-avatar-placeholder {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: ${primaryColor}18;
      border: 3px solid ${primaryColor}30;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 800;
      color: ${primaryColor};
      flex-shrink: 0;
    }
    .client-info { flex: 1; }
    .client-name {
      font-size: 22px;
      font-weight: 800;
      color: #0f0f1a;
      margin-bottom: 6px;
      letter-spacing: -0.3px;
    }
    .chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
    .chip {
      background: ${primaryColor}15;
      color: ${primaryColor};
      border: 1px solid ${primaryColor}30;
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;
    }
    .chip-since {
      background: #f0f0f5;
      color: #666;
      border: 1px solid #ddd;
    }
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .info-row { display: flex; flex-direction: column; }
    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #999;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a2e;
    }

    /* Content */
    .content { padding: 24px 32px; }

    /* Section */
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #999;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    .notes-text {
      background: #fffdf0;
      border-left: 3px solid #FFB547;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      color: #555;
      font-size: 13px;
      line-height: 1.6;
    }

    /* Anamnesis Cards */
    .anamnesis-card {
      background: #f8f8fc;
      border: 1px solid #e8e8f0;
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .anamnesis-header {
      background: linear-gradient(135deg, ${primaryColor}18, ${primaryColor}08);
      border-bottom: 1px solid ${primaryColor}20;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .anamnesis-icon {
      font-size: 20px;
    }
    .anamnesis-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f0f1a;
    }
    .anamnesis-date {
      font-size: 11px;
      color: #888;
      margin-top: 2px;
    }
    .subsection {
      padding: 12px 16px 4px;
    }
    .subsection-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${primaryColor};
      margin-bottom: 8px;
    }
    .field-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 6px 16px;
      border-bottom: 1px solid #eee;
    }
    .field-row:last-child { border-bottom: none; }
    .field-label {
      color: #666;
      font-size: 12px;
      flex: 1;
      padding-right: 12px;
    }
    .field-value {
      color: #1a1a2e;
      font-size: 12px;
      font-weight: 600;
      text-align: right;
      max-width: 60%;
    }

    /* Photos */
    .photos-section {
      padding: 12px 16px;
    }
    .section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      margin-bottom: 10px;
    }
    .photos-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .photo-item {
      position: relative;
      display: inline-block;
    }
    .photo-item img {
      width: 100px;
      height: 100px;
      border-radius: 8px;
      object-fit: cover;
      border: 2px solid #eee;
      display: block;
    }
    .photo-label {
      position: absolute;
      bottom: 4px;
      left: 4px;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .photo-label.before {
      background: #FFB547;
      color: #fff;
    }
    .photo-label.after {
      background: #22c55e;
      color: #fff;
    }

    /* Empty anamnesis */
    .empty-state {
      text-align: center;
      padding: 32px;
      color: #bbb;
      font-size: 13px;
    }

    /* Footer */
    .footer {
      margin-top: 32px;
      padding: 16px 32px;
      background: #fafafa;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-text {
      font-size: 10px;
      color: #bbb;
    }
    .footer-brand {
      font-size: 11px;
      font-weight: 700;
      color: ${primaryColor};
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header-bar">
    <div class="header-brand">
      ${logoHtml}
      <div>
        <div class="brand-name">${businessName}</div>
        <div class="brand-tagline">Ficha de Cliente</div>
      </div>
    </div>
    <div class="header-date">
      Gerado em<br/>${formatDateTime(new Date().toISOString())}
    </div>
  </div>

  <!-- Client Profile -->
  <div class="client-profile">
    ${clientAvatarHtml}
    <div class="client-info">
      <div class="client-name">${client.name}</div>
      <div class="chips">
        ${ageHtml}
        <span class="chip chip-since">Cliente desde ${formatDate(client.createdAt)}</span>
      </div>
      <div class="contact-grid">
        <div class="info-row">
          <span class="info-label">Telefone</span>
          <span class="info-value">${client.phone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">E-mail</span>
          <span class="info-value">${client.email}</span>
        </div>
        ${birthHtml}
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="content">
    ${notesHtml}

    ${hasAnamnesis ? `
      <div class="section">
        <p class="section-title">Fichas de Anamnese</p>
        ${legacyHtml}
        ${filledHtml}
      </div>
    ` : `
      <div class="empty-state">
        Nenhuma ficha de anamnese registrada para este cliente.
      </div>
    `}
  </div>

  <!-- Footer -->
  <div class="footer">
    <span class="footer-text">Documento gerado pelo Appbello · Confidencial</span>
    <span class="footer-brand">Appbello</span>
  </div>

</body>
</html>
  `;

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Ficha de ${client.name}`,
      UTI: 'com.adobe.pdf',
    });
  }
}
