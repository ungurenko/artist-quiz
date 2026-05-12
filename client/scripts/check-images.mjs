import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const artistsPath = path.join(projectRoot, 'src', 'data', 'artists.ts');
const imagesDir = path.join(projectRoot, 'public', 'images');

const source = fs.readFileSync(artistsPath, 'utf8');
const imageUrls = [
  ...source.matchAll(/(?:portrait|url):\s*['"]([^'"]+)['"]/g),
].map((match) => match[1]);

const uniqueImageUrls = [...new Set(imageUrls)];
const missing = [];

for (const imageUrl of uniqueImageUrls) {
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(imageUrl);
  } catch {
    missing.push(`${imageUrl} -> invalid URL encoding`);
    continue;
  }

  if (!decodedPath.startsWith('/images/')) {
    missing.push(`${imageUrl} -> expected a /images/ path`);
    continue;
  }

  const filePath = path.normalize(path.join(projectRoot, 'public', decodedPath));

  if (!filePath.startsWith(imagesDir + path.sep)) {
    missing.push(`${imageUrl} -> invalid image path`);
    continue;
  }

  if (!fs.existsSync(filePath)) {
    missing.push(`${imageUrl} -> ${path.relative(projectRoot, filePath)}`);
  }
}

if (missing.length > 0) {
  console.error(`Missing local images: ${missing.length}`);
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log(`All ${uniqueImageUrls.length} local image links exist.`);
