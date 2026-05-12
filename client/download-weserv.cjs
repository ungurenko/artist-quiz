const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Read artists.ts and extract URLs
const artistsPath = path.join(__dirname, 'src', 'data', 'artists.ts');
const content = fs.readFileSync(artistsPath, 'utf-8');

// Extract all URLs
const urls = [...new Set([
  ...[...content.matchAll(/url:\s*'([^']+)'/g)].map(m => m[1]),
  ...[...content.matchAll(/portrait:\s*'([^']+)'/g)].map(m => m[1])
])].filter(url => url.includes('upload.wikimedia.org'));

console.log(`Found ${urls.length} unique images to download`);

async function downloadViaWeserv(url) {
  // Use weserv.nl as proxy
  const weservUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=1200`;
  
  try {
    const response = await fetch(weservUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        const buffer = Buffer.from(await response.arrayBuffer());
        const urlObj = new URL(url);
        const filename = decodeURIComponent(urlObj.pathname.split('/').pop());
        const filepath = path.join(imagesDir, filename);
        fs.writeFileSync(filepath, buffer);
        console.log(`✓ Downloaded: ${filename} (${buffer.length} bytes)`);
        return true;
      }
    }
    console.log(`✗ Failed via weserv: ${url} (HTTP ${response.status})`);
  } catch (e) {
    console.log(`✗ Error via weserv: ${url} - ${e.message}`);
  }
  return false;
}

(async () => {
  let success = 0;
  let failed = 0;
  
  for (const url of urls) {
    const filename = decodeURIComponent(new URL(url).pathname.split('/').pop());
    const filepath = path.join(imagesDir, filename);
    
    if (fs.existsSync(filepath)) {
      console.log(`✓ Already exists: ${filename}`);
      success++;
      continue;
    }
    
    const ok = await downloadViaWeserv(url);
    if (ok) success++;
    else failed++;
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
})();
