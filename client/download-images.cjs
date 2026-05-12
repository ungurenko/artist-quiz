const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Read artists.ts and extract filenames
const artistsPath = path.join(__dirname, 'src', 'data', 'artists.ts');
const content = fs.readFileSync(artistsPath, 'utf-8');

// Extract all filenames from /wikimedia/ URLs
const urlMatches = [
  ...[...content.matchAll(/url:\s*'([^']+)'/g)].map(m => m[1]),
  ...[...content.matchAll(/portrait:\s*'([^']+)'/g)].map(m => m[1])
];

// Extract filenames from thumb URLs
const files = urlMatches.map(url => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  // Remove size prefix like 600px- or 1200px-
  return filename.replace(/^\d+px-/, '');
}).filter((v, i, a) => a.indexOf(v) === i);

console.log(`Found ${files.length} unique images to download`);

async function downloadViaFilePath(browser, filename) {
  const filepath = path.join(imagesDir, filename);

  if (fs.existsSync(filepath)) {
    console.log(`✓ Already exists: ${filename}`);
    return true;
  }

  const page = await browser.newPage();
  try {
    // Use Special:FilePath to get redirect to direct URL
    const filePathUrl = `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
    
    const response = await page.goto(filePathUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
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
  
  for (const filename of files) {
    const ok = await downloadViaFilePath(browser, filename);
    if (ok) success++;
    else failed++;
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  await browser.close();
  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
})();
