import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const WIDTH = 1200;
const HEIGHT = 630;
const BG_COLOR = '#0a0a0f';
const LOGO_SIZE = 280;

const ACCENT_1 = '#7c3aed';
const ACCENT_2 = '#3b82f6';

async function generateOgImage() {
  const publicDir = join(__dirname, '..', 'public');
  const logoPath = join(publicDir, 'icon-glyph-1024x1024.png');
  const outputPath = join(publicDir, 'og-image.png');

  const logo = await sharp(logoPath)
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const svgOverlay = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow1" cx="30%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${ACCENT_1}" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="${ACCENT_1}" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="glow2" cx="70%" cy="40%" r="40%">
          <stop offset="0%" stop-color="${ACCENT_2}" stop-opacity="0.10"/>
          <stop offset="100%" stop-color="${ACCENT_2}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </linearGradient>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${ACCENT_1}"/>
          <stop offset="100%" stop-color="${ACCENT_2}"/>
        </linearGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="0.3" stroke-opacity="0.04"/>
        </pattern>
      </defs>

      <rect width="100%" height="100%" fill="url(#grid)"/>
      <rect width="100%" height="100%" fill="url(#glow1)"/>
      <rect width="100%" height="100%" fill="url(#glow2)"/>

      <rect x="0" y="0" width="${WIDTH}" height="4" fill="url(#lineGrad)"/>
      <rect x="0" y="${HEIGHT - 2}" width="${WIDTH}" height="2" fill="url(#lineGrad)" opacity="0.3"/>

      <text x="560" y="275" font-family="sans-serif" font-weight="700" font-size="72" fill="url(#textGrad)" letter-spacing="-1">
        Trade AI Hub
      </text>

      <rect x="560" y="300" width="160" height="3" rx="1.5" fill="url(#lineGrad)"/>

      <text x="560" y="345" font-family="sans-serif" font-weight="400" font-size="28" fill="#94a3b8" letter-spacing="0.5">
        AI-Powered Trading Journal
      </text>

      <text x="${WIDTH / 2}" y="${HEIGHT - 35}" font-family="sans-serif" font-weight="400" font-size="18" fill="#64748b" text-anchor="middle" letter-spacing="2">
        tradeaihub.com
      </text>
    </svg>
  `;

  const logoX = 200;
  const logoY = Math.round((HEIGHT - LOGO_SIZE) / 2);

  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0,
      },
      {
        input: logo,
        top: logoY,
        left: Math.round(logoX - LOGO_SIZE / 2),
      },
    ])
    .png({ quality: 90 })
    .toFile(outputPath);

  console.log('OG image generated:', outputPath);

  const metadata = await sharp(outputPath).metadata();
  console.log('Dimensions:', metadata.width + 'x' + metadata.height);
  console.log('Size:', (readFileSync(outputPath).length / 1024).toFixed(1), 'KB');
}

generateOgImage().catch(console.error);
