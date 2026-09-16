import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3000/offre-pro...');
  await page.goto('http://localhost:3000/offre-pro', { waitUntil: 'networkidle0' });

  // 1. Hero & Header screenshot
  await page.screenshot({ path: path.join(__dirname, '../scratch/sales_hero.png'), fullPage: false });
  console.log('Hero screenshot captured.');

  // 2. Scroll down to simulator & double device
  await page.evaluate(() => {
    window.scrollTo(0, 850);
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, '../scratch/sales_devices_and_rides.png'), fullPage: false });

  // 3. Switch to mobile device view
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Site Mobile Chauffeur'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, '../scratch/sales_mobile_preview.png'), fullPage: false });

  // 4. Scroll down to pricing & ROI calculator
  await page.evaluate(() => {
    window.scrollTo(0, 1750);
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, '../scratch/sales_roi_calculator.png'), fullPage: false });

  // 5. Scroll down to features bento grid
  await page.evaluate(() => {
    window.scrollTo(0, 2600);
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, '../scratch/sales_features_bento.png'), fullPage: false });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(console.error);
