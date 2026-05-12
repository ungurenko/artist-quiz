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

// Extract all filenames from URLs
const urlMatches = [
  ...[...content.matchAll(/url:\s*'([^']+)'/g)].map(m => m[1]),
  ...[...content.matchAll(/portrait:\s*'([^']+)'/g)].map(m => m[1])
];

// Extract base filenames (without px- prefix and size)
const files = urlMatches.map(url => {
  const parts = url.split('/');
  let filename = parts[parts.length - 1];
  // Remove size prefix like 600px- or 1200px-
  filename = filename.replace(/^\d+px-/, '');
  // Decode URL encoding
  filename = filename.replace('%2C', ',').replace('%27', "'").replace('%28', '(').replace('%29', ')');
  return filename;
}).filter((v, i, a) => a.indexOf(v) === i);

console.log(`Found ${files.length} unique images to download`);

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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

async function getImageUrl(filename) {
  try {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|size&iiurlwidth=1200&format=json&origin=*`;
    const data = await fetchJson(apiUrl);
    const pages = data.query.pages;
    for (const pageId in pages) {
      const page = pages[pageId];
      if (page.imageinfo && page.imageinfo[0]) {
        return page.imageinfo[0].thumburl || page.imageinfo[0].url;
      }
    }
  } catch (e) {
    console.log(`  API error for ${filename}: ${e.message}`);
  }
  return null;
}

async function main() {
  let success = 0;
  let failed = 0;
  
  for (const filename of files) {
    const filepath = path.join(imagesDir, filename);
    
    if (fs.existsSync(filepath)) {
      console.log(`✓ Already exists: ${filename}`);
      success++;
      continue;
    }
    
    console.log(`Downloading: ${filename}`);
    const imageUrl = await getImageUrl(filename);
    
    if (imageUrl) {
      try {
        await downloadFile(imageUrl, filepath);
        const stats = fs.statSync(filepath);
        console.log(`✓ Downloaded: ${filename} (${stats.size} bytes)`);
        success++;
      } catch (e) {
        console.log(`✗ Download failed: ${filename} - ${e.message}`);
        failed++;
      }
    } else {
      console.log(`✗ URL not found: ${filename}`);
      failed++;
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
}

main();
