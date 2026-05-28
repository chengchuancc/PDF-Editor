import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('./icon.svg');

// Generate 1024x1024 PNG icon
await sharp(svg)
  .resize(1024, 1024)
  .png()
  .toFile('./public/icon.png');

// Generate 512x512 for Windows
await sharp(svg)
  .resize(512, 512)
  .png()
  .toFile('./public/icon-512.png');

// Generate 256x256 for Windows
await sharp(svg)
  .resize(256, 256)
  .png()
  .toFile('./public/icon-256.png');

console.log('✓ Icons generated successfully');
