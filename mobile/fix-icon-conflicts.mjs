// Fix icon name conflicts and variant on ActivityIndicator
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const files = execSync('find /Users/jefferson/Documents/Appbello/mobile/src -name "*.tsx" -o -name "*.ts"', { encoding: 'utf-8' })
  .trim().split('\n').filter(Boolean);

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let original = content;

  // 1. Remove variant="Outline" from ActivityIndicator (it's a RN component, not iconsax)
  content = content.replace(/<ActivityIndicator([^>]*?)\s+variant="Outline"([^>]*?)\/>/g, '<ActivityIndicator$1$2/>');
  content = content.replace(/<ActivityIndicator([^>]*?)\s+variant="Outline"([^>]*?)>/g, '<ActivityIndicator$1$2>');

  // 2. Fix duplicate "Share" from iconsax conflicting with RN's Share
  // Pattern: file imports Share from 'react-native' AND Share from 'iconsax-react-native'
  if (content.includes("from 'react-native'") && content.includes("'iconsax-react-native'")) {
    const hasRNShare = /import\s+\{[^}]*\bShare\b[^}]*\}\s+from\s+'react-native'/.test(content);
    const hasIconsaxShare = /import\s+\{[^}]*\bShare\b[^}]*\}\s+from\s+'iconsax-react-native'/.test(content);
    if (hasRNShare && hasIconsaxShare) {
      // Rename Share in iconsax import to ShareIcon
      content = content.replace(
        /^(import\s+\{[^}]*)\bShare\b([^}]*\}\s+from\s+'iconsax-react-native')/m,
        '$1ShareIcon$2'
      );
      // Replace usage of <Share ... /> (JSX) but NOT Share.share() calls
      // Only rename the JSX icon usage: <Share  or <Share>
      content = content.replace(/<Share(\s)/g, '<ShareIcon$1');
      content = content.replace(/<Share\/>/g, '<ShareIcon/>');
      content = content.replace(/<\/Share>/g, '</ShareIcon>');
    }
  }

  // 3. Fix duplicate "Image" from iconsax conflicting with RN's Image
  if (content.includes("from 'react-native'") && content.includes("'iconsax-react-native'")) {
    const hasRNImage = /import\s+\{[^}]*\bImage\b[^}]*\}\s+from\s+'react-native'/.test(content);
    const hasIconsaxImage = /import\s+\{[^}]*\bImage\b[^}]*\}\s+from\s+'iconsax-react-native'/.test(content);
    if (hasRNImage && hasIconsaxImage) {
      // Rename Image in iconsax import to ImageIcon
      content = content.replace(
        /^(import\s+\{[^}]*)\bImage\b([^}]*\}\s+from\s+'iconsax-react-native')/m,
        '$1ImageIcon$2'
      );
      // Find lines that use Image as icon (size/color props = iconsax icon)
      // Replace <Image size=... color=... variant=... with <ImageIcon
      content = content.replace(/<Image\s+(size|color|variant)=/g, '<ImageIcon $1=');
      content = content.replace(/<\/ImageIcon>/g, '</ImageIcon>');
    }
  }

  // 4. Fix Star1 duplicates in same import
  content = content.replace(
    /^(import\s+\{[^}]*?)\bStar1\b([^}]*?)\bStar1\b([^}]*?\}\s+from\s+'iconsax-react-native')/m,
    '$1Star1$2$3'
  );

  if (content !== original) {
    writeFileSync(file, content);
    totalFixed++;
    console.log('Fixed:', file.replace('/Users/jefferson/Documents/Appbello/mobile/', ''));
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
