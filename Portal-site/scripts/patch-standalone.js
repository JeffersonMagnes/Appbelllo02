/**
 * Copies missing Next.js server files into the standalone output
 * required by @netlify/plugin-nextjs v5 on Node 22.
 */
const { cpSync, existsSync, mkdirSync } = require('fs');
const path = require('path');

const nextSrc = path.join(__dirname, '..', 'node_modules', 'next');
const nextDest = path.join(__dirname, '..', '.next', 'standalone', 'node_modules', 'next');

// Copy the entire next package dist directory to standalone
// so that all internal requires (../next, etc.) resolve correctly
const distSrc = path.join(nextSrc, 'dist');
const distDest = path.join(nextDest, 'dist');

if (!existsSync(distDest)) {
  mkdirSync(distDest, { recursive: true });
}

cpSync(distSrc, distDest, { recursive: true, force: true });

// Also copy package.json so Next.js can resolve its own metadata
cpSync(
  path.join(nextSrc, 'package.json'),
  path.join(nextDest, 'package.json'),
  { force: true }
);

console.log('✓ Patched standalone: copied full next/dist');
