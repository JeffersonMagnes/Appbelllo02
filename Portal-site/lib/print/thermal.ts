// ESC/POS commands for thermal printers
const ESC = 0x1b;
const GS  = 0x1d;

export const CMD = {
  INIT:         [ESC, 0x40],
  ALIGN_LEFT:   [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT:  [ESC, 0x61, 0x02],
  BOLD_ON:      [ESC, 0x45, 0x01],
  BOLD_OFF:     [ESC, 0x45, 0x00],
  FONT_LARGE:   [GS,  0x21, 0x11],
  FONT_NORMAL:  [GS,  0x21, 0x00],
  CUT:          [GS,  0x56, 0x00],
  LINE:         [0x0a],
};

// Common Bluetooth service/characteristic UUIDs for thermal printers
export const THERMAL_PROFILES = [
  {
    label: 'Genérica (mais comum)',
    service: '000018f0-0000-1000-8000-00805f9b34fb',
    characteristic: '00002af1-0000-1000-8000-00805f9b34fb',
  },
  {
    label: 'Xprinter / Sewoo',
    service: '0000ff00-0000-1000-8000-00805f9b34fb',
    characteristic: '0000ff02-0000-1000-8000-00805f9b34fb',
  },
  {
    label: 'Bixolon',
    service: '00001101-0000-1000-8000-00805f9b34fb',
    characteristic: '00001101-0000-1000-8000-00805f9b34fb',
  },
  {
    label: 'Personalizado',
    service: '',
    characteristic: '',
  },
];

export type PrinterSettings = {
  type: 'thermal' | 'normal';
  // Térmica
  bluetoothProfile: number;
  customService: string;
  customCharacteristic: string;
  paperWidth: 58 | 80;
  deviceName: string;
  // Normal
  paperSize: 'A4' | 'A5' | 'receipt';
  showLogo: boolean;
};

export const DEFAULT_SETTINGS: PrinterSettings = {
  type: 'normal',
  bluetoothProfile: 0,
  customService: '',
  customCharacteristic: '',
  paperWidth: 80,
  deviceName: '',
  paperSize: 'A4',
  showLogo: true,
};

export function loadSettings(): PrinterSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem('printer_settings');
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as PrinterSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: PrinterSettings) {
  localStorage.setItem('printer_settings', JSON.stringify(s));
}

function textToBytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

function buildLine(text: string, width: number): number[] {
  const padded = text.slice(0, width).padEnd(width, ' ');
  return textToBytes(padded);
}

function buildDivider(width: number): number[] {
  return textToBytes('-'.repeat(width));
}

export type ReceiptData = {
  establishmentName: string;
  address?: string;
  phone?: string;
  date: string;
  items: { label: string; value: string }[];
  total?: string;
  footer?: string;
};

export function buildReceipt(data: ReceiptData, width: 58 | 80): Uint8Array {
  const cols = width === 80 ? 42 : 32;
  const bytes: number[] = [];

  const push = (...cmds: number[][]) => cmds.forEach(c => bytes.push(...c));
  const line = (text = '') => push(textToBytes(text), CMD.LINE);
  const div = () => push(buildDivider(cols), CMD.LINE);

  // Init
  push(CMD.INIT);

  // Header
  push(CMD.ALIGN_CENTER, CMD.BOLD_ON, CMD.FONT_LARGE);
  line(data.establishmentName.slice(0, cols));
  push(CMD.FONT_NORMAL, CMD.BOLD_OFF);
  if (data.address) line(data.address.slice(0, cols));
  if (data.phone) line(data.phone.slice(0, cols));
  push(CMD.ALIGN_LEFT);
  div();

  // Date
  line(data.date);
  div();

  // Items
  for (const item of data.items) {
    const space = cols - item.label.length - item.value.length;
    const row = item.label + ' '.repeat(Math.max(1, space)) + item.value;
    line(row.slice(0, cols));
  }

  // Total
  if (data.total) {
    div();
    push(CMD.BOLD_ON);
    const space = cols - 6 - data.total.length;
    line('TOTAL' + ' '.repeat(Math.max(1, space)) + data.total);
    push(CMD.BOLD_OFF);
  }

  div();

  // Footer
  push(CMD.ALIGN_CENTER);
  line(data.footer ?? 'Obrigado pela preferência!');
  push(CMD.ALIGN_LEFT);

  // Feed + Cut
  line(); line(); line();
  push(CMD.CUT);

  return new Uint8Array(bytes);
}

export async function connectBluetooth(settings: PrinterSettings): Promise<any> {
  if (!(navigator as any).bluetooth) {
    throw new Error('Web Bluetooth não é suportado neste navegador. Use Chrome ou Edge.');
  }

  const profile = settings.bluetoothProfile < THERMAL_PROFILES.length - 1
    ? THERMAL_PROFILES[settings.bluetoothProfile]
    : { service: settings.customService, characteristic: settings.customCharacteristic };

  if (!profile.service || !profile.characteristic) {
    throw new Error('Configure o UUID do serviço e da característica da impressora.');
  }

  const device = await (navigator as any).bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [profile.service],
  });

  const server = await device.gatt!.connect();
  const service = await server.getPrimaryService(profile.service);
  const characteristic = await service.getCharacteristic(profile.characteristic);
  return characteristic;
}

export async function printThermal(characteristic: any, data: Uint8Array): Promise<void> {
  const CHUNK = 512;
  for (let i = 0; i < data.length; i += CHUNK) {
    await characteristic.writeValue(data.slice(i, i + CHUNK));
    await new Promise(r => setTimeout(r, 50));
  }
}
