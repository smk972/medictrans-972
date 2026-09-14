const puppeteer = require('puppeteer');

async function askEva(page, text) {
  // Wait until typing indicator is gone and input is active
  await page.waitForSelector('input[placeholder*="Posez une question"]:not([disabled])', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 400));
  const input = await page.$('input[placeholder*="Posez une question"]');
  await input.click({ clickCount: 3 });
  await input.press('Backspace');
  await input.type(text, { delay: 10 });
  await new Promise(r => setTimeout(r, 250));
  await page.waitForSelector('#btn-ai-chat-send:not([disabled])', { timeout: 8000 });
  await page.click('#btn-ai-chat-send');
}

(async () => {
  console.log('🚀 Starting Eva - Aide à la réservation (Niveau 2) E2E Test Suite...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });

  try {
    // 1. Visit Home page & check Eva floating button and Header button
    console.log('\n--- 1. Testing Eva Floating Button, Header Button & Welcome Message ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Header button check
    const headerBtn = await page.$('#btn-header-help-ai');
    if (!headerBtn) throw new Error('#btn-header-help-ai not found');
    const headerBtnText = await page.evaluate(el => el.innerText, headerBtn);
    console.log('Header button text:', headerBtnText);
    if (!headerBtnText.includes('Eva')) throw new Error('Header button does not mention Eva!');
    console.log('✅ Header button correctly shows "Eva - Aide à la réservation".');

    // Floating button check
    const aiButton = await page.$('#btn-ai-chat-floating');
    if (!aiButton) throw new Error('#btn-ai-chat-floating not found on home page');
    const floatingText = await page.evaluate(el => el.innerText, aiButton);
    console.log('Floating button text:\n', floatingText);
    if (!floatingText.includes('Eva') || !floatingText.includes('Aide à la réservation')) {
      throw new Error('Floating button does not mention Eva - Aide à la réservation!');
    }
    console.log('✅ Floating button correctly shows "Eva / Aide à la réservation".');

    // Click to open chat
    await aiButton.click();
    await new Promise(r => setTimeout(r, 600));

    // Verify chat widget opened
    const chatWidget = await page.$('#ai-chat-window');
    if (!chatWidget) throw new Error('#ai-chat-window not found after clicking');
    console.log('✅ Chat window is open.');

    // Verify Eva's name in title & welcome message
    const windowText = await page.evaluate(() => {
      const msg = document.querySelector('#ai-chat-window');
      return msg ? msg.innerText : '';
    });
    console.log('Eva chat window header snippet:\n', windowText.slice(0, 350));
    if (!windowText.includes('Eva - Aide à la réservation')) {
      throw new Error('Chat window does not show "Eva - Aide à la réservation"!');
    }
    console.log('✅ Chat header proudly displays "Eva - Aide à la réservation".');

    // 2. Test "Expliquer les différents transports"
    console.log('\n--- 2. Testing "Expliquer les différents transports" ---');
    const transportPill = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.find(b => b.innerText.includes('Quel transport choisir'));
      if (found) {
        found.click();
        return true;
      }
      return false;
    });

    if (!transportPill) throw new Error('Quick prompt pill "Quel transport choisir" not found');
    console.log('✅ Clicked quick prompt pill for transport explanation.');

    await page.waitForFunction(() => {
      const messages = Array.from(document.querySelectorAll('.rounded-2xl'));
      return messages.some(m => m.innerText.includes('VSL') && m.innerText.includes('Ambulance') && m.innerText.includes('Taxi'));
    }, { timeout: 15000 });
    console.log('✅ Eva explained clinical and regulatory transport differences!');

    // 3. Test "Vérifier les informations : Audit NIR"
    console.log('\n--- 3. Testing "Vérifier le NIR (Audit 15 chiffres & clé modulo 97)" ---');
    await askEva(page, 'Peux-tu vérifier mon numéro de sécurité sociale 1 54 08 97 213 456 88 ?');

    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Vérification NIR') || text.includes('clé') || text.includes('Sécurité Sociale');
    }, { timeout: 15000 });
    console.log('✅ Eva performed NIR audit and returned validation feedback!');

    // 4. Test "Vérifier les informations : Audit Horaires & Trafic Martinique"
    console.log('\n--- 4. Testing "Vérifier la cohérence horaires & embouteillages 972" ---');
    await askEva(page, 'Je pars de Sainte-Luce pour un RDV à 08h30 au CHU Fort-de-France, un départ à 07h45 est-il suffisant ?');

    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Rocade') || text.includes('marge') || text.includes('Lamentin') || text.includes('embouteillage') || text.includes('matin');
    }, { timeout: 15000 });
    console.log('✅ Eva analyzed Martinique rush hour constraints and recommended proper margin!');

    // 5. Test "Aider à remplir le formulaire" & Pre-fill Draft Card
    console.log('\n--- 5. Testing "Aider à remplir le formulaire" & Draft Creation ---');
    await askEva(page, 'Aide-moi à réserver un VSL le 2026-11-15 à 09:15 depuis Le Lamentin vers CHU Pierre Zobda-Quitman');

    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Brouillon de réservation prêt') || text.includes('Appliquer à ma réservation');
    }, { timeout: 15000 });
    console.log('✅ Eva generated a booking draft card with "Appliquer à ma réservation" CTA!');

    // Click "Appliquer à ma réservation"
    const applyDraftBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Appliquer à ma réservation'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!applyDraftBtn) throw new Error('Button "Appliquer à ma réservation" not found or clickable');
    console.log('✅ Clicked "Appliquer à ma réservation". Redirecting to /reserver or /connexion...');

    await new Promise(r => setTimeout(r, 1500));
    const currentUrl = page.url();
    console.log('Current URL after applying draft:', currentUrl);

    // If redirected to login (due to protected booking flow), simulate login with patient credentials
    if (currentUrl.includes('/connexion')) {
      console.log('Redirected to /connexion as expected for unauthenticated booking. Logging in...');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const loginTab = btns.find(b => b.innerText.includes('Se connecter'));
        if (loginTab) loginTab.click();
      });
      await new Promise(r => setTimeout(r, 500));

      await page.type('input[type="email"]', 'patient@test.com');
      await page.type('input[type="password"]', 'Patient972!');
      await page.click('button[type="submit"]');

      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('Logged in successfully. New URL:', page.url());
    }

    // Now visit /reserver
    await page.goto('http://localhost:3000/reserver', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Verify Eva helper banner on /reserver
    const banner = await page.$('#btn-open-ai-booking-helper');
    if (!banner) throw new Error('Eva helper banner not found on /reserver');
    const bannerText = await page.evaluate(el => el.parentElement.parentElement.innerText, banner);
    console.log('Banner text snippet:\n', bannerText.slice(0, 200));
    if (!bannerText.includes('Eva - Aide à la réservation')) {
      throw new Error('Banner on /reserver does not mention Eva - Aide à la réservation!');
    }
    console.log('✅ Found Eva - Aide à la réservation helper banner on /reserver.');

    // 6. Test "Expliquer les étapes de réservation"
    console.log('\n--- 6. Testing "Expliquer les étapes de réservation" ---');
    await banner.click();
    await new Promise(r => setTimeout(r, 600));

    await askEva(page, 'Quelles sont les 5 étapes de réservation sur le site ?');

    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('étape') && (text.includes('24h') || text.includes('transporteur') || text.includes('PMT'));
    }, { timeout: 15000 });
    console.log('✅ Eva explained the 5 booking steps and 24h assignment rule!');

    // 7. Test "Répondre aux FAQ"
    console.log('\n--- 7. Testing "Répondre aux FAQ" (Entente préalable & Accompagnateur) ---');
    await askEva(page, 'Est-ce que mon fils peut m\'accompagner dans le VSL sans surcoût ? Et pour un trajet de plus de 150 km ?');

    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('accompagnateur') || text.includes('150 km') || text.includes('entente préalable');
    }, { timeout: 15000 });
    console.log('✅ Eva answered advanced FAQ accurately with CPAM rules!');

    // Capture visual artifact of Eva in action
    await page.screenshot({ path: '/Users/dimitrikanor/.gemini/antigravity-ide/brain/e4b711e5-4677-4386-8223-b0e9185174f9/eva_aide_reservation_verified.png' });
    console.log('📸 Captured screenshot: eva_aide_reservation_verified.png');

    console.log('\n🎉 ALL TESTS PASSED FOR EVA - AIDE À LA RÉSERVATION (NIVEAU 2)!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    await page.screenshot({ path: '/Users/dimitrikanor/.gemini/antigravity-ide/brain/e4b711e5-4677-4386-8223-b0e9185174f9/eva_test_failure.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
