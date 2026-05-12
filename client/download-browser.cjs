const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const files = [
  'Ivan_the_Terrible_and_his_son,_by_Repin.jpg',
  'RepinUnexpectedVisitors.jpg',
  'Reply_of_the_Zaporozhian_Cossacks.jpg',
  'Aivazovsky_-_The_Ninth_Wave_-_Google_Art_Project.jpg',
  'Aivazovsky,_Ivan_-_Moonlit_Night_on_the_Black_Sea.jpg',
  'Ivan_Aivazovsky_-_The_Rainbow_(1877).jpg',
  'SerovDevochkaSPersikami.jpg',
  'Valentin_Serov_-_The_Boy_with_a_Straw_Hat_-_Google_Art_Project.jpg',
  'Serov_Yusupov.jpg',
  'Mikhail_Vrubel_-_The_Demon_Seated_-_Google_Art_Project.jpg',
  'Vrubel_swan_princess.jpg',
  'Vrubel_Pan.jpg',
  'Vrubel_fairytale_flower.jpg',
  'Levitan_nad_vechnym_pokoyem.jpg',
  'Levitan_Vladimirka.jpg',
  'Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg',
  'The_Last_Supper_-_Leonardo_Da_Vinci_-_High_Resolution_32x16.jpg',
  'Lady_with_an_Ermine_-_Leonardo_da_Vinci_-_Google_Art_Project.jpg',
  '%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg',
  'Michelangelo_David_-_3.jpg',
  'Sandro_Botticelli_-_La_Primavera_-_Google_Art_Project.jpg',
  'Botticelli_Madonna_of_the_Magnificat.jpg',
  'Caravaggio_Medusa.jpg',
  'Aivazovsky_-_Self-portrait_-_1881.jpg',
  'Serov_by_Repin.jpg',
  'Vrubel_by_Braz.jpg',
  'Levitan_Self_portrait.jpg',
  'Michelangelo_Daniele_da_Volterra_(dettaglio).jpg',
  'Bacchus_by_Caravaggio_2.jpg'
];

async function downloadWithBrowser(browser, filename) {
  const filepath = path.join(imagesDir, filename);
  
  if (fs.existsSync(filepath)) {
    console.log(`✓ Already exists: ${filename}`);
    return true;
  }
  
  const page = await browser.newPage();
  try {
    // First visit Wikipedia to get cookies
    await page.goto('https://en.wikipedia.org/wiki/Main_Page', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Then try to access the image
    const url = `https://en.wikipedia.org/wiki/Special:FilePath/${filename}?width=1200`;
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    if (response && response.ok()) {
      const contentType = response.headers()['content-type'];
      if (contentType && contentType.startsWith('image/')) {
        const buffer = await response.body();
        if (buffer.length > 1000) {
          fs.writeFileSync(filepath, buffer);
          console.log(`✓ Downloaded: ${filename} (${buffer.length} bytes)`);
          return true;
        }
      }
    }
    console.log(`✗ Failed: ${filename} (HTTP ${response ? response.status() : 'no response'})`);
    return false;
  } catch (e) {
    console.log(`✗ Error: ${filename} - ${e.message}`);
    return false;
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  let success = 0;
  let failed = 0;
  
  for (const filename of files) {
    const ok = await downloadWithBrowser(browser, filename);
    if (ok) success++;
    else failed++;
    
    await new Promise(r => setTimeout(r, 3000)); // 3 second delay
  }
  
  await browser.close();
  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
})();
