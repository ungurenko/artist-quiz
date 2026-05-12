const fs = require('fs');
const path = require('path');
const https = require('https');

const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Read artists.ts and extract filenames
const artistsPath = path.join(__dirname, 'src', 'data', 'artists.ts');
const content = fs.readFileSync(artistsPath, 'utf-8');

const urlMatches = [
  ...[...content.matchAll(/url:\s*'([^']+)'/g)].map(m => m[1]),
  ...[...content.matchAll(/portrait:\s*'([^']+)'/g)].map(m => m[1])
];

const files = urlMatches.map(url => {
  const parts = url.split('/');
  let filename = parts[parts.length - 1];
  filename = filename.replace(/^\d+px-/, '');
  filename = filename.replace('%2C', ',').replace('%27', "'").replace('%28', '(').replace('%29', ')');
  return filename;
}).filter((v, i, a) => a.indexOf(v) === i);

console.log(`Found ${files.length} unique images to download`);

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl, filepath).then(resolve).catch(reject);
          return;
        }
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(filepath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function downloadViaFilePath(filename) {
  const filepath = path.join(imagesDir, filename);
  
  if (fs.existsSync(filepath)) {
    console.log(`✓ Already exists: ${filename}`);
    return true;
  }
  
  try {
    // Try direct FilePath with width
    const url = `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=1200`;
    await downloadFile(url, filepath);
    const stats = fs.statSync(filepath);
    if (stats.size > 1000) {
      console.log(`✓ Downloaded: ${filename} (${stats.size} bytes)`);
      return true;
    } else {
      fs.unlinkSync(filepath);
      console.log(`✗ Too small: ${filename}`);
      return false;
    }
  } catch (e) {
    console.log(`✗ Failed: ${filename} - ${e.message}`);
    return false;
  }
}

async function main() {
  let success = 0;
  let failed = 0;
  
  for (const filename of files) {
    const ok = await downloadViaFilePath(filename);
    if (ok) success++;
    else failed++;
    
    // Wait 2 seconds between requests to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
}

main();
