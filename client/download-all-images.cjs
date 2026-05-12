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

// Extract all URLs (they are already converted to upload.wikimedia.org format)
const urls = [...new Set([
  ...[...content.matchAll(/url:\s*'([^']+)'/g)].map(m => m[1]),
  ...[...content.matchAll(/portrait:\s*'([^']+)'/g)].map(m => m[1])
])].filter(url => url.includes('upload.wikimedia.org'));

console.log(`Found ${urls.length} unique images to download`);

async function downloadImage(browser, url) {
  const urlObj = new URL(url);
  const filename = decodeURIComponent(urlObj.pathname.split('/').pop());
  const filepath = path.join(imagesDir, filename);

  if (fs.existsSync(filepath)) {
    console.log(`✓ Already exists: ${filename}`);
    return true;
  }

  const page = await browser.newPage();
  try {
    // Navigate directly to the image
    const response = await page.goto(url, { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    if (response && response.ok()) {
      const buffer = await response.body();
      const contentType = response.headers()['content-type'];
      
      if (contentType && contentType.startsWith('image/')) {
        fs.writeFileSync(filepath, buffer);
        console.log(`✓ Downloaded: ${filename} (${buffer.length} bytes)`);
        return true;
      } else {
        console.log(`✗ Not an image: ${filename} (${contentType})`);
      }
    } else {
      console.log(`✗ Failed: ${filename} (HTTP ${response ? response.status() : 'no response'})`);
    }
  } catch (e) {
    console.log(`✗ Error: ${filename} - ${e.message}`);
  } finally {
    await page.close();
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  let success = 0;
  let failed = 0;
  
  for (const url of urls) {
    const ok = await downloadImage(browser, url);
    if (ok) success++;
    else failed++;
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  await browser.close();
  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
})();
