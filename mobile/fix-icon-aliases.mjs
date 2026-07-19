// Use import aliases for iconsax icons that conflict with RN names
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const files = execSync('find /Users/jefferson/Documents/Appbello/mobile/src -name "*.tsx" -o -name "*.ts"', { encoding: 'utf-8' })
  .trim().split('\n').filter(Boolean);

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let original = content;

  // Fix "ShareIcon" in import → "Share as ShareIcon"
  content = content.replace(
    /^(import\s+\{[^}]*?)\bShareIcon\b([^}]*?\}\s+from\s+'iconsax-react-native')/m,
    '$1Share as ShareIcon$2'
  );

  // Fix "ImageIcon" in import → "Image as ImageIcon"
  content = content.replace(
    /^(import\s+\{[^}]*?)\bImageIcon\b([^}]*?\}\s+from\s+'iconsax-react-native')/m,
    '$1Image as ImageIcon$2'
  );

  if (content !== original) {
    writeFileSync(file, content);
    totalFixed++;
    console.log('Fixed:', file.replace('/Users/jefferson/Documents/Appbello/mobile/', ''));
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
