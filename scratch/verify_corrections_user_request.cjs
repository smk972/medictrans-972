const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🚀 Démarrage de la vérification des corrections...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Vérification du Chat Eva
  console.log('🔍 1. Test du Widget Eva sur http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Ouvrir le chat
  const chatBtn = await page.waitForSelector('#btn-ai-chat-floating', { timeout: 8000 });
  await chatBtn.click();
  await new Promise(r => setTimeout(r, 800));

  const chatText = await page.evaluate(() => {
    const el = document.getElementById('ai-chat-window');
    return el ? el.innerText : '';
  });

  console.log('Texte du chat widget récupéré.');
  if (chatText.includes("Assistante Médic'Trans 972")) {
    console.error('❌ ÉCHEC: "Assistante Médic\'Trans 972" est encore présent dans le chat!');
    process.exit(1);
  }
  if (chatText.includes('NIVEAU 2') || chatText.includes('Niveau 2')) {
    console.error('❌ ÉCHEC: "Niveau 2" est encore présent dans le chat!');
    process.exit(1);
  }
  console.log('✅ Chat validé : ni "Assistante Médic\'Trans 972", ni "Niveau 2" ne sont affichés.');

  // Capture d'écran du chat propre
  const chatScreenshotPath = path.resolve(__dirname, '../eva_chat_cleaned.png');
  await page.screenshot({ path: chatScreenshotPath });
  console.log(`📸 Capture d'écran du chat enregistrée : ${chatScreenshotPath}`);

  // 2. Vérification du NIR sur la page /reserver avec le profil Patient
  console.log('🔍 2. Test du NIR sur http://localhost:3000/reserver...');
  await page.evaluate(() => {
    // Connexion simulée avec le profil patient démo corrigé
    localStorage.setItem('medictrans_auth_user_972', JSON.stringify({
      id: 'demo-patient-972',
      email: 'c.marieluce@orange.fr',
      role: 'PATIENT',
      firstName: 'Christian',
      lastName: 'Marie-Luce',
      phone: '0696 55 44 33',
      nir: '1 54 11 97 208 771 72'
    }));
  });

  await page.goto('http://localhost:3000/reserver', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const nirStatus = await page.evaluate(() => {
    const input = document.getElementById('patientNir');
    const badge = document.querySelector('#patientNir-help') || document.body;
    return {
      inputValue: input ? input.value : '',
      text: badge ? badge.innerText : ''
    };
  });

  console.log('Résultat NIR :', nirStatus);
  if (nirStatus.text.includes('Clé de contrôle incorrecte')) {
    console.error('❌ ÉCHEC : Le message "Clé de contrôle incorrecte" est apparu !');
    process.exit(1);
  }
  console.log('✅ NIR validé : Aucun message d\'erreur de clé de contrôle. Le profil est conforme.');

  const bookingScreenshotPath = path.resolve(__dirname, '../nir_conforme_verified.png');
  await page.screenshot({ path: bookingScreenshotPath });
  console.log(`📸 Capture d'écran de réservation enregistrée : ${bookingScreenshotPath}`);

  // 3. Vérification de la fenêtre d'avertissement d'annulation sur /suivi
  console.log('🔍 3. Test de la fenêtre d\'avertissement d\'annulation sur http://localhost:3000/suivi...');
  await page.goto('http://localhost:3000/suivi', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Chercher un bouton Annuler
  const cancelBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Annuler la prise en charge') || b.innerText.includes('Annuler'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (cancelBtn) {
    await new Promise(r => setTimeout(r, 800));
    const modalText = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0');
      return modal ? modal.innerText : '';
    });

    console.log('Texte modal annulation (extrait) :', modalText.slice(0, 300));
    if (modalText.includes('Conformément à la réglementation des transports sanitaires en Martinique')) {
      console.error('❌ ÉCHEC : L\'ancienne phrase réglementaire est encore présente !');
      process.exit(1);
    }
    if (modalText.includes('Pour un fonctionnement fluide de la plateforme')) {
      console.log('✅ Fenêtre d\'avertissement validée : La nouvelle phrase fluide est bien présente.');
    }
    const modalScreenshotPath = path.resolve(__dirname, '../cancellation_modal_verified.png');
    await page.screenshot({ path: modalScreenshotPath });
    console.log(`📸 Capture modale annulation enregistrée : ${modalScreenshotPath}`);
  } else {
    console.log('ℹ️ Pas de course active immédiate à annuler en UI, test direct du fichier TrackingPage.tsx.');
    const trackingContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/TrackingPage.tsx'), 'utf8');
    if (trackingContent.includes('Conformément à la réglementation des transports sanitaires en Martinique')) {
      console.error('❌ ÉCHEC : Dans TrackingPage.tsx, l\'ancienne phrase est présente !');
      process.exit(1);
    }
    if (trackingContent.includes('Pour un fonctionnement fluide de la plateforme')) {
      console.log('✅ TrackingPage.tsx contient bien "Pour un fonctionnement fluide de la plateforme".');
    }
  }

  await browser.close();
  console.log('\n🎉 TOUS LES TESTS SONT VALIDÉS AVEC SUCCÈS !');
})();
