import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('🚀 Démarrage du test automatisé Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Navigation vers le portail transporteurs en mode visiteur / démo
  console.log('1. Navigation vers http://localhost:3000/transporteurs...');
  await page.goto('http://localhost:3000/transporteurs', { waitUntil: 'networkidle0' });

  // S'assurer que le localStorage est propre pour le test
  await page.evaluate(() => {
    localStorage.removeItem('medictrans_demo_transporter_sub');
    localStorage.removeItem('medictrans_user_auth_972');
  });
  await page.reload({ waitUntil: 'networkidle0' });

  // 2. Vérifier la présence du bandeau "Panel de dispatch verrouillé"
  const bannerText = await page.evaluate(() => {
    const el = document.querySelector('div.animate-fadeIn');
    return el ? el.innerText : '';
  });
  console.log('2. Contenu du bandeau détecté :', bannerText.slice(0, 80));

  const isGrise = await page.evaluate(() => {
    const el = document.querySelector('.grayscale.pointer-events-none');
    return Boolean(el);
  });
  console.log('3. Panel grisé (grayscale + pointer-events-none) présent :', isGrise);

  await page.screenshot({ path: path.join(__dirname, '../scratch/screenshot_locked_panel.png'), fullPage: false });
  console.log('📸 Capture d\'écran enregistrée : scratch/screenshot_locked_panel.png');

  // 4. Cliquer sur le bouton "Activer mes 30 jours offerts ➔"
  console.log('4. Clic sur "Activer mes 30 jours offerts"...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Activer mes 30 jours offerts'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 800));

  // 5. Vérifier que la vue ABONNEMENT est affichée
  const tabContent = await page.evaluate(() => document.body.innerText);
  const isAbonnementView = tabContent.includes('Activez votre essai gratuit de 30 jours');
  console.log('5. Vue Abonnement affichée :', isAbonnementView);

  // 6. Cliquer sur "Débloquer 1 mois gratuit (WhatsApp)"
  console.log('6. Clic sur "Débloquer 1 mois gratuit (WhatsApp)"...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Débloquer 1 mois gratuit'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 600));

  // 7. Dans le modal, cliquer sur "Envoyer le code par WhatsApp"
  console.log('7. Envoi du code WhatsApp...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Envoyer le code par WhatsApp'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  // 8. Vérifier la présence du bouton "Remplir automatiquement" et cliquer
  console.log('8. Remplissage automatique du code de vérification...');
  const autofillSuccess = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Remplir automatiquement'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Code auto-rempli :', autofillSuccess);

  await new Promise(r => setTimeout(r, 500));

  // 9. Cliquer sur "Valider et débloquer mon essai gratuit"
  console.log('9. Clic sur validation du code...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Valider et débloquer'));
    if (btn) btn.click();
  });

  // Attendre le délai de fermeture et redirection (1200ms)
  await new Promise(r => setTimeout(r, 2000));

  // 10. Vérifier que le panel est maintenant débloqué (plus de grayscale ni de pointer-events-none, bandeau lock disparu)
  const isStillGrise = await page.evaluate(() => {
    const el = document.querySelector('.grayscale.pointer-events-none');
    return Boolean(el);
  });
  const hasLockBanner = await page.evaluate(() => {
    return document.body.innerText.includes('Panel de dispatch verrouillé');
  });

  console.log('10. Panel toujours grisé ?', isStillGrise, '(attendu: false)');
  console.log('11. Bandeau de verrouillage présent ?', hasLockBanner, '(attendu: false)');

  await page.screenshot({ path: path.join(__dirname, '../scratch/screenshot_unlocked_panel.png'), fullPage: false });
  console.log('📸 Capture d\'écran enregistrée : scratch/screenshot_unlocked_panel.png');

  await browser.close();

  if (!isStillGrise && !hasLockBanner && isGrise) {
    console.log('🎉 TOUS LES TESTS SONT VALIDES À 100% !');
  } else {
    console.error('❌ Échec d\'une étape de test.');
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('Erreur test:', err);
  process.exit(1);
});
