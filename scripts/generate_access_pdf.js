import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePDF() {
  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Clinigo - Guide Officiel des Comptes d'Accès</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      color: #1e293b;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo {
      background: #0f766e;
      color: white;
      font-weight: 900;
      font-size: 18px;
      padding: 6px 12px;
      border-radius: 8px;
      letter-spacing: 0.5px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f766e;
    }
    .brand-subtitle {
      font-size: 10px;
      color: #64748b;
      font-weight: 500;
    }
    .header-meta {
      text-align: right;
      font-size: 9px;
      color: #64748b;
    }
    .badge-confidential {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 9px;
      margin-bottom: 4px;
      border: 1px solid #fde68a;
    }
    .intro-banner {
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      border-left: 4px solid #0f766e;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 18px;
    }
    .intro-banner h3 {
      color: #0f766e;
      font-size: 12px;
      margin-bottom: 3px;
    }
    .intro-banner p {
      color: #334155;
      font-size: 10px;
    }

    .role-section {
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .role-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .role-facility {
      background: #e0f2fe;
      color: #0369a1;
      border-left: 4px solid #0284c7;
    }
    .role-transporter {
      background: #fef3c7;
      color: #b45309;
      border-left: 4px solid #d97706;
    }
    .role-patient {
      background: #f1f5f9;
      color: #334155;
      border-left: 4px solid #475569;
    }
    .role-admin {
      background: #fae8ff;
      color: #86198f;
      border-left: 4px solid #a21caf;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    th {
      background: #f8fafc;
      color: #475569;
      text-align: left;
      padding: 6px 8px;
      font-weight: 700;
      border-bottom: 1px solid #cbd5e1;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 7px 8px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:nth-child(even) {
      background: #fcfdfe;
    }
    .user-name {
      font-weight: 700;
      color: #0f172a;
    }
    .user-org {
      color: #475569;
      font-size: 9px;
    }
    .credential-box {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 9.5px;
      color: #0f766e;
      font-weight: 600;
    }
    .pwd-badge {
      display: inline-block;
      background: #f1f5f9;
      color: #334155;
      padding: 1px 6px;
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-weight: 700;
      font-size: 9px;
      border: 1px solid #e2e8f0;
    }
    .tag {
      display: inline-block;
      font-size: 8.5px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
    }
    .tag-metro {
      background: #e0e7ff;
      color: #3730a3;
    }
    .tag-dom {
      background: #fef08a;
      color: #854d0e;
    }
    .url-link {
      color: #0284c7;
      text-decoration: none;
      font-size: 9px;
      font-weight: 600;
    }

    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 8.5px;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="brand">
      <div class="brand-logo">CLINIGO</div>
      <div>
        <div class="brand-title">CLINIGO • MÉDICTRANS</div>
        <div class="brand-subtitle">Plateforme Sanitaire Numérique Nationale (France hexagonale & Outre-Mer)</div>
      </div>
    </div>
    <div class="header-meta">
      <div class="badge-confidential">ENVIRONNEMENT DE TEST &amp; DÉMONSTRATION</div>
      <div>Généré le 15 Septembre 2026</div>
      <div>Serveur Local : http://localhost:3000</div>
    </div>
  </div>

  <div class="intro-banner">
    <h3>Fiche Pratique des Accès par Profil Utilisateur</h3>
    <p>Ce document récapitule les comptes de démonstration opérationnels simulant des cas réels (Métropole &amp; DOM). Le mot de passe universel pré-configuré pour l'ensemble des comptes est : <strong class="pwd-badge">Clinigo2026!</strong> (ou <em>Admin972!</em>).</p>
  </div>

  <!-- 1. ÉTABLISSEMENTS DE SANTÉ -->
  <div class="role-section">
    <div class="role-header role-facility">
      <span>🏥 1. ÉTABLISSEMENTS DE SANTÉ (CHU, Hôpitaux, Cliniques, Dialyses)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 15%;">Zone</th>
          <th style="width: 25%;">Établissement &amp; N° FINESS</th>
          <th style="width: 25%;">Référent &amp; Fonction</th>
          <th style="width: 35%;">Identifiants de Connexion</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="tag tag-metro">Métropole</span> Paris (75)</td>
          <td>
            <div class="user-name">AP-HP Pitié-Salpêtrière</div>
            <div class="user-org">FINESS : <strong>750100018</strong></div>
          </td>
          <td>
            <div class="user-name">Dr. Alexandre Mercier</div>
            <div class="user-org">Cadre supérieur de santé / Régulation</div>
          </td>
          <td>
            <div class="credential-box">coordination@aphp.fr</div>
            <div>MDP : <span class="pwd-badge">Clinigo2026!</span></div>
            <div>Accès : <span class="url-link">/connexion?category=FACILITY</span></div>
          </td>
        </tr>
        <tr>
          <td><span class="tag tag-dom">DOM</span> Martinique (972)</td>
          <td>
            <div class="user-name">CHU de Martinique (Zobda-Quitman)</div>
            <div class="user-org">FINESS : <strong>970211145</strong></div>
          </td>
          <td>
            <div class="user-name">Mme Marie-Paule Valaire</div>
            <div class="user-org">Cadre de permanence hospitalière</div>
          </td>
          <td>
            <div class="credential-box">coordination@chu-martinique.fr</div>
            <div>MDP : <span class="pwd-badge">Clinigo2026!</span></div>
            <div>Accès : <span class="url-link">/connexion?category=FACILITY</span></div>
          </td>
        </tr>
        <tr>
          <td><span class="tag tag-metro">Métropole</span> Bordeaux (33)</td>
          <td>
            <div class="user-name">CHU de Bordeaux - Pellegrin</div>
            <div class="user-org">FINESS : <strong>330100012</strong></div>
          </td>
          <td>
            <div class="user-name">Mme Hélène Fabre</div>
            <div class="user-org">Régulatrice des départs hospitaliers</div>
          </td>
          <td>
            <div class="credential-box">coordination@chu-bordeaux.fr</div>
            <div>MDP : <span class="pwd-badge">Clinigo2026!</span></div>
            <div>Accès : <span class="url-link">/connexion?category=FACILITY</span></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 2. TRANSPORTEURS SANITAIRES -->
  <div class="role-section">
    <div class="role-header role-transporter">
      <span>🚑 2. TRANSPORTEURS SANITAIRES (Ambulances, VSL, Taxis Conventionnés)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 15%;">Zone</th>
          <th style="width: 25%;">Société &amp; N° Agrément ARS</th>
          <th style="width: 25%;">Contact Dispatch</th>
          <th style="width: 35%;">Identifiants de Connexion</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="tag tag-metro">Métropole</span> Île-de-France</td>
          <td>
            <div class="user-name">Ambulances Île-de-France Secours</div>
            <div class="user-org">Agrément : <strong>75-AMB-2024-12</strong></div>
          </td>
          <td>
            <div class="user-name">Thomas Leroy</div>
            <div class="user-org">Gérant Dispatch • Tél: 06 20 30 40 50</div>
          </td>
          <td>
            <div class="credential-box">dispatch@ambulances-idf.fr</div>
            <div>MDP : <span class="pwd-badge">Clinigo2026!</span></div>
            <div>Accès : <span class="url-link">/connexion?category=TRANSPORTER</span></div>
          </td>
        </tr>
        <tr>
          <td><span class="tag tag-dom">DOM</span> Martinique (972)</td>
          <td>
            <div class="user-name">Ambulances Madinina Secours</div>
            <div class="user-org">Agrément : <strong>972-AMB-2024-08</strong></div>
          </td>
          <td>
            <div class="user-name">Patrick Césaire</div>
            <div class="user-org">Gérant • Tél: 06 96 75 20 20</div>
          </td>
          <td>
            <div class="credential-box">dispatch@madinina-secours.mq</div>
            <div>MDP : <span class="pwd-badge">Clinigo2026!</span></div>
            <div>Accès : <span class="url-link">/connexion?category=TRANSPORTER</span></div>
          </td>
        </tr>
        <tr>
          <td><span class="tag tag-metro">Métropole</span> Lyon (69)</td>
          <td>
            <div class="user-name">Taxis Conventionnés Santé Rhône</div>
            <div class="user-org">Convention : <strong>69-CPAM-2023-45</strong></div>
          </td>
          <td>
            <div class="user-name">Karim Belkacem</div>
            <div class="user-org">Chauffeur Référent • Tél: 06 70 80 90 10</div>
          </td>
          <td>
            <div class="credential-box">contact@taxis-sante-lyon.fr</div>
            <div>MDP : <span class="pwd-badge">Clinigo2026!</span></div>
            <div>Accès : <span class="url-link">/connexion?category=TRANSPORTER</span></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 3. PATIENTS -->
  <div class="role-section">
    <div class="role-header role-patient">
      <span>👤 3. PATIENTS &amp; ASSURÉS SOCIAUX (Prise en charge CPAM 100% ALD)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 15%;">Zone</th>
          <th style="width: 25%;">Patient &amp; N° Sécurité Sociale (NIR)</th>
          <th style="width: 25%;">Droits &amp; Téléphone</th>
          <th style="width: 35%;">Identifiants de Connexion</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="tag tag-metro">Métropole</span> Paris (75)</td>
          <td>
            <div class="user-name">Jean Dupont</div>
            <div class="user-org">NIR : <strong>1 85 04 75 112 345 88</strong></div>
          </td>
          <td>
            <div class="user-name">ALD 100% (Tiers-Payant)</div>
            <div class="user-org">Tél : 06 12 34 56 78</div>
          </td>
          <td>
            <div class="credential-box">jean.dupont@orange.fr</div>
            <div>MDP : <span class="pwd-badge">Clinigo2026!</span></div>
            <div>Accès : <span class="url-link">/connexion?category=PATIENT</span></div>
          </td>
        </tr>
        <tr>
          <td><span class="tag tag-dom">DOM</span> Fort-de-France</td>
          <td>
            <div class="user-name">Christian Marie-Luce</div>
            <div class="user-org">NIR : <strong>1 54 11 97 208 771 72</strong></div>
          </td>
          <td>
            <div class="user-name">ALD 100% (Dialyse)</div>
            <div class="user-org">Tél : 06 96 55 44 33</div>
          </td>
          <td>
            <div class="credential-box">c.marieluce@orange.fr</div>
            <div>MDP : <span class="pwd-badge">Clinigo2026!</span></div>
            <div>Accès : <span class="url-link">/connexion?category=PATIENT</span></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 4. ADMINISTRATEURS -->
  <div class="role-section">
    <div class="role-header role-admin">
      <span>🛡️ 4. RÉGULATION CENTRALE &amp; ADMINISTRATION (Tour de Contrôle &amp; Audits)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 15%;">Périmètre</th>
          <th style="width: 25%;">Responsable &amp; Organisme</th>
          <th style="width: 25%;">Attributions</th>
          <th style="width: 35%;">Identifiants de Connexion</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="tag tag-metro">National</span> France Entière</td>
          <td>
            <div class="user-name">Pierre Delmas</div>
            <div class="user-org">Direction Régulation Clinigo France</div>
          </td>
          <td>
            <div class="user-name">Super-Administrateur</div>
            <div class="user-org">Gestion Flottes, Établissements, Tarifs</div>
          </td>
          <td>
            <div class="credential-box">admin@clinigo.fr</div>
            <div>MDP : <span class="pwd-badge">Clinigo2026!</span></div>
            <div>Accès : <span class="url-link">/connexion?category=ADMIN</span> (ou /admin)</div>
          </td>
        </tr>
        <tr>
          <td><span class="tag tag-dom">Régional</span> Antilles-Guyane</td>
          <td>
            <div class="user-name">Régulation Territoriale</div>
            <div class="user-org">Auditeurs CPAM &amp; ARS</div>
          </td>
          <td>
            <div class="user-name">Audit &amp; Dispatch Régional</div>
            <div class="user-org">Supervision des flux sanitaires</div>
          </td>
          <td>
            <div class="credential-box">admin@medictrans972.mq</div>
            <div>MDP : <span class="pwd-badge">Clinigo2026!</span></div>
            <div>Accès : <span class="url-link">/connexion?category=ADMIN</span></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div>Plateforme Clinigo • Document réservé aux démonstrations et tests techniques</div>
    <div>Conformité RGPD &amp; Secret Médical • 100% Tiers-Payant CPAM</div>
  </div>

</body>
</html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // 1. Sauvegarde dans public/
  const publicPath = path.resolve(__dirname, '../public/acces_comptes_clinigo.pdf');
  await page.pdf({
    path: publicPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' }
  });

  // 2. Sauvegarde à la racine du projet
  const rootPath = path.resolve(__dirname, '../acces_comptes_clinigo.pdf');
  fs.copyFileSync(publicPath, rootPath);

  await browser.close();

  console.log(`PDF généré avec succès dans :
- ${publicPath}
- ${rootPath}`);
}

generatePDF().catch(err => {
  console.error("Erreur génération PDF:", err);
  process.exit(1);
});
