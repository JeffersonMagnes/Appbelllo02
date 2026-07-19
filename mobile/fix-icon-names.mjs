// Fix incorrect iconsax icon names across the codebase
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Map of wrong name → correct iconsax name
const ICON_FIXES = {
  // Calendar
  'CalendarDays': 'Calendar',
  'CalendarRange': 'CalendarTick',
  // Phone
  'Phone': 'Call',
  // Checkmarks
  'CheckCircle2': 'TickCircle',
  // Alerts
  'AlertCircle': 'InfoCircle',
  // Money
  'Banknote': 'Money',
  'CreditCard': 'Card',
  // Mobile
  'Smartphone': 'Mobile',
  // Lists
  'ClipboardList': 'ClipboardText',
  // Trends
  'TrendingDown': 'TrendDown',
  'TrendingUp': 'TrendUp',
  // User
  'UserCircle': 'ProfileCircle',
  'UserPlus': 'ProfileAdd',
  // Charts
  'BarChart3': 'Chart',
  'PieChart': 'Chart2',
  // Notifications
  'Bell': 'Notification',
  // Arrows
  'ArrowUpRight': 'ExportSquare',
  'ArrowDownRight': 'ImportSquare',
  'ArrowDownLeft': 'ArrowLeft',
  'ArrowRightLeft': 'ArrangeHorizontal',
  // Lightning
  'Zap': 'Flash',
  // Editing
  'Trash2': 'Trash',
  'Edit3': 'Edit',
  // Share
  'Share2': 'Share',
  // Auth
  'LogOut': 'Logout',
  // Help
  'HelpCircle': 'InfoCircle',
  // Misc
  'Globe': 'Global',
  'Download': 'ImportCircle',
  'QrCode': 'Scan',
  'Percent': 'PercentageCircle',
  'Power': 'Flash',
  'RefreshCw': 'Refresh',
  'BookUser': 'Book1',
  'ChevronDown': 'ArrowDown2',
  'ImageIcon': 'Image',
  'Hand': 'Like1',
  'Footprints': 'Star1',
  'Grid2X2': 'Grid2',
  'List': 'TextalignLeft',
  'Building2': 'Buildings2',
  'Sparkles': 'MagicStar',
  'Pill': 'Health',
  // These are used in JSX but as plain references in icon maps too
  'Scissors': 'Scissor',
  'Package': 'Box',
};

// Get all TSX/TS files
const files = execSync('find /Users/jefferson/Documents/Appbello/mobile/src -name "*.tsx" -o -name "*.ts"', { encoding: 'utf-8' })
  .trim().split('\n').filter(Boolean);

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let original = content;

  for (const [wrong, correct] of Object.entries(ICON_FIXES)) {
    // Fix in import statements: exact word match
    // e.g., import { Phone, ... } from 'iconsax-react-native'
    const importRe = new RegExp(`\\b${wrong}\\b`, 'g');
    content = content.replace(importRe, correct);
  }

  if (content !== original) {
    writeFileSync(file, content);
    totalFixed++;
    console.log('Fixed:', file.replace('/Users/jefferson/Documents/Appbello/mobile/', ''));
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
