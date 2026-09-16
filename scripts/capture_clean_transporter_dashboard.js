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
  await page.setViewport({ width: 1440, height: 920, deviceScaleFactor: 2 });

  console.log('Navigating to http://localhost:3000/transporteurs...');
  await page.goto('http://localhost:3000/transporteurs', { waitUntil: 'networkidle0' });

  // Inject a valid active subscription state into localStorage so the dashboard is 100% active, clean, without toast
  await page.evaluate(() => {
    const activeSub = {
      status: 'TRIAL',
      trialDaysTotal: 30,
      trialDaysRemaining: 29,
      isTrialUnlocked: true,
      whatsappVerified: true,
      whatsappPhone: '0696 75 20 20',
      planName: 'Formule Pro Sanitaire (Illimitée)',
      monthlyPrice: 19.9,
      trialStartedAt: new Date().toISOString(),
      trialExpiresAt: new Date(Date.now() + 29 * 86400000).toISOString()
    };
    localStorage.setItem('medictrans_demo_transporter_sub', JSON.stringify(activeSub));
  });

  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // Hide AI chat bubble in screenshot if needed to have a clean UI
  await page.evaluate(() => {
    const aiWidget = document.querySelector('.fixed.bottom-4.right-4') || document.querySelector('[aria-label*="Eva"]');
    if (aiWidget) aiWidget.style.display = 'none';
  });

  const destPath = path.join(__dirname, '../public/assets/dashboard_transporteur_real.png');
  await page.screenshot({ path: destPath, fullPage: false });
  console.log('Clean dashboard screenshot saved to:', destPath);

  await browser.close();
}

capture().catch(console.error);
