import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ==============================================================================
// STYLES COMMUNS POUR LES 3 GUIDES PDF
// ==============================================================================
const getCommonStyles = (primaryColor = '#0f766e', accentColor = '#0284c7') => `
  @page {
    size: A4;
    margin: 14mm 14mm 16mm 14mm;
    @bottom-right {
      content: counter(page) " / " counter(pages);
      font-size: 8px;
      color: #64748b;
    }
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
    font-size: 10.5px;
    line-height: 1.5;
  }
  .page {
    page-break-after: always;
    position: relative;
    min-height: 260mm;
    display: flex;
    flex-direction: column;
  }
  .page:last-child {
    page-break-after: avoid;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid ${primaryColor};
    padding-bottom: 10px;
    margin-bottom: 16px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .brand-logo {
    background: ${primaryColor};
    color: white;
    font-weight: 900;
    font-size: 17px;
    padding: 6px 12px;
    border-radius: 8px;
    letter-spacing: 0.5px;
  }
  .brand-title {
    font-size: 16px;
    font-weight: 800;
    color: ${primaryColor};
    line-height: 1.2;
  }
  .brand-subtitle {
    font-size: 9px;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .doc-badge {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 5px 10px;
    text-align: right;
  }
  .doc-badge-title {
    font-size: 8.5px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
  }
  .doc-badge-val {
    font-size: 10px;
    font-weight: 800;
    color: ${primaryColor};
  }
  
  .hero-banner {
    background: linear-gradient(135deg, ${primaryColor} 0%, #064e3b 100%);
    color: white;
    border-radius: 12px;
    padding: 18px 20px;
    margin-bottom: 18px;
    box-shadow: 0 4px 12px rgba(15, 118, 110, 0.15);
  }
  .hero-tag {
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.35);
    color: white;
    font-size: 8.5px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 20px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .hero-title {
    font-size: 19px;
    font-weight: 900;
    margin-bottom: 6px;
    letter-spacing: -0.3px;
    line-height: 1.2;
  }
  .hero-desc {
    font-size: 10.5px;
    color: #e2e8f0;
    line-height: 1.4;
    max-width: 90%;
  }

  h2 {
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
    border-left: 3.5px solid ${primaryColor};
    padding-left: 8px;
    margin-top: 14px;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  h3 {
    font-size: 11px;
    font-weight: 700;
    color: ${primaryColor};
    margin-top: 8px;
    margin-bottom: 5px;
  }
  p {
    margin-bottom: 8px;
    color: #334155;
    text-align: justify;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin-bottom: 12px;
  }
  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 9px;
    padding: 10px 12px;
    break-inside: avoid;
  }
  .card-highlight {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
  }
  .card-blue {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
  }
  .card-amber {
    background: #fffbeb;
    border: 1px solid #fde68a;
  }
  .card-title {
    font-weight: 800;
    font-size: 11px;
    color: #0f172a;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .card-text {
    font-size: 9.5px;
    color: #475569;
    line-height: 1.35;
  }

  .step-box {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 9px 12px;
    break-inside: avoid;
  }
  .step-num {
    background: ${primaryColor};
    color: white;
    font-weight: 800;
    font-size: 12px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .step-content {
    flex: 1;
  }
  .step-title {
    font-weight: 800;
    font-size: 11px;
    color: #0f172a;
    margin-bottom: 2px;
  }
  .step-desc {
    font-size: 9.5px;
    color: #475569;
    line-height: 1.35;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 14px 0;
    font-size: 9.5px;
    break-inside: avoid;
  }
  th {
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 800;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    font-size: 9px;
    text-transform: uppercase;
  }
  td {
    padding: 6px 8px;
    border: 1px solid #e2e8f0;
    color: #334155;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background: #f8fafc;
  }

  .pill {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 8.5px;
  }
  .pill-green { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  .pill-blue { background: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
  .pill-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .pill-purple { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
  .pill-slate { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

  .callout {
    background: #f8fafc;
    border-left: 3px solid ${accentColor};
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
    margin: 10px 0;
    font-size: 9.5px;
    color: #334155;
    break-inside: avoid;
  }
  .callout-warning {
    background: #fffbeb;
    border-left-color: #f59e0b;
    color: #78350f;
  }
  .callout-success {
    background: #f0fdf4;
    border-left-color: #10b981;
    color: #065f46;
  }

  .footer {
    margin-top: auto;
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
    display: flex;
    justify-content: space-between;
    font-size: 8.5px;
    color: #94a3b8;
  }
`;

// ==============================================================================
// 1. CONTENU DU GUIDE TRANSPORTEUR
// ==============================================================================
function getTransporterGuideHTML() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Clinigo — Guide d'Utilisation Transporteur Sanitaire</title>
  <style>
    ${getCommonStyles('#0f766e', '#d97706')}
    .hero-banner { padding: 12px 16px; margin-bottom: 12px; }
    .hero-title { font-size: 17px; margin-bottom: 4px; }
    .hero-desc { font-size: 9.5px; }
    h2 { margin-top: 10px; margin-bottom: 6px; }
    .step-box { padding: 6px 10px; margin-bottom: 6px; }
    .step-num { width: 20px; height: 20px; font-size: 11px; }
    .step-title { font-size: 10px; }
    .step-desc { font-size: 9px; line-height: 1.3; }
    .grid-3 { margin-bottom: 8px; }
    .grid-2 { margin-bottom: 8px; }
    .card { padding: 8px 10px; }
    p { margin-bottom: 6px; font-size: 10px; }
  </style>
</head>
<body>

  <!-- PAGE 1 -->
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="brand-logo">CLINIGO</div>
        <div>
          <div class="brand-title">Espace Professionnel Transporteur</div>
          <div class="brand-subtitle">Sociétés d'Ambulances • VSL • Taxis Conventionnés CPAM</div>
        </div>
      </div>
      <div class="doc-badge">
        <div class="doc-badge-title">Document Officiel</div>
        <div class="doc-badge-val">Guide Exploitation 2026</div>
      </div>
    </div>

    <div class="hero-banner" style="background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);">
      <span class="hero-tag">Console Télématique Embarquée</span>
      <div class="hero-title">Manuel d'Utilisation & Régulation Opérationnelle</div>
      <div class="hero-desc">
        Optimisez vos tournées sanitaires, recevez instantanément les demandes de transport de votre secteur territorial et assurez une traçabilité conforme aux exigences ARS et Assurance Maladie.
      </div>
    </div>

    <h2>1. Connexion & Prise en Main du Portail</h2>
    <p>
      L'accès à l'espace transporteur s'effectue via l'adresse <strong>https://clinigo.fr/transporteur</strong> après authentification avec vos identifiants professionnels (adresse email certifiée et mot de passe sécurisé).
    </p>

    <div class="grid-3">
      <div class="card">
        <div class="card-title">🛡️ Agrément & Convention</div>
        <div class="card-text">
          Votre compte est rattaché à votre numéro d'agrément ARS et votre conventionnement CPAM. Le badge « Conventionné » garantit votre éligibilité auprès des prescripteurs.
        </div>
      </div>
      <div class="card">
        <div class="card-title">📍 Rayon d'Intervention</div>
        <div class="card-text">
          Définissez votre commune de rattachement et votre rayon d'action (ex: 25 km ou île entière en Martinique/Guadeloupe). Les missions sont filtrées en temps réel selon votre zone.
        </div>
      </div>
      <div class="card">
        <div class="card-title">🔔 Alertes & Notifications</div>
        <div class="card-text">
          Alerte visuelle et sonore instantanée à l'arrivée d'une nouvelle demande. Notification SMS et WhatsApp disponible pour vos régulateurs de permanence.
        </div>
      </div>
    </div>

    <h2>2. Réception & Typologie des Demandes</h2>
    <p>Clinigo gère deux circuits de distribution de courses transparents et équitables :</p>

    <div class="grid-2">
      <div class="card card-blue">
        <div class="card-title">📢 Diffusion Ouverte (« Pot Commun »)</div>
        <div class="card-text">
          Missions transmises simultanément à l'ensemble des transporteurs conventionnés du secteur géographique. Le premier transporteur qui valide l'acceptation se voit attribuer la course de manière <strong>irrévocable et atomique</strong>.
        </div>
      </div>
      <div class="card card-amber">
        <div class="card-title">🎯 Demande Directe Nominative (Priorité 24h)</div>
        <div class="card-text">
          Un patient ou un hôpital vous sollicite personnellement en priorité. Vous disposez d'un <strong>délai exclusif de 24h00</strong> pour accepter ou décliner avant que la mission ne bascule automatiquement dans le pot commun.
        </div>
      </div>
    </div>

    <h2>3. Cycle de Vie d'une Course en 5 Étapes</h2>
    <p>Chaque mission acceptée suit une machine à états stricte garantissant la bonne information du patient et des services hospitaliers :</p>

    <div class="step-box">
      <div class="step-num">1</div>
      <div class="step-content">
        <div class="step-title">ACCEPTÉE (Attribuée)</div>
        <div class="step-desc">Vous affectez un chauffeur DEA/Auxiliaire et un véhicule de votre flotte (plaque d'immatriculation). Le patient reçoit immédiatement votre confirmation et votre heure estimée de passage.</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-num">2</div>
      <div class="step-content">
        <div class="step-title">EN ROUTE (Départ dépôt / rotation)</div>
        <div class="step-desc">Le chauffeur quitte sa base vers le lieu de prise en charge. Le patient est prévenu par SMS et peut visualiser l'approche sur sa carte de suivi.</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-num">3</div>
      <div class="step-content">
        <div class="step-title">SUR PLACE (Arrivé au domicile ou à l'hôpital)</div>
        <div class="step-desc">Le véhicule est stationné à l'adresse. L'équipage prend contact avec le patient ou le service hospitalier (chambre, étage, service de dialyse).</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-num">4</div>
      <div class="step-content">
        <div class="step-title">À BORD (Prise en charge active)</div>
        <div class="step-desc">Le patient est installé à bord (fauteuil, brancard avec monitoring si ambulance). Trajet vers l'établissement de soins ou retour à domicile.</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-num">5</div>
      <div class="step-content">
        <div class="step-title">TERMINÉE (Dépose et clôture)</div>
        <div class="step-desc">Le patient est remis au service d'accueil ou raccompagné à son domicile. Clôture de la mission, génération automatique de la fiche récapitulative télétransmissible.</div>
      </div>
    </div>

    <div class="footer">
      <span>Clinigo.fr • Guide d'Utilisation Transporteur</span>
      <span>Page 1 / 2</span>
      <span>Confidentiel • Réservé aux Professionnels Conventionnés</span>
    </div>
  </div>

  <!-- PAGE 2 -->
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="brand-logo">CLINIGO</div>
        <div>
          <div class="brand-title">Espace Professionnel Transporteur</div>
          <div class="brand-subtitle">Gestion de Parc • Télétransmission • Facturation</div>
        </div>
      </div>
      <div class="doc-badge">
        <div class="doc-badge-title">Module Avancé</div>
        <div class="doc-badge-val">Flotte & Justificatifs</div>
      </div>
    </div>

    <h2>4. Gestion de la Flotte & des Équipages</h2>
    <p>
      Depuis votre onglet <strong>« Flotte & Chauffeurs »</strong>, vous pilotez en autonomie la disponibilité de vos moyens opérationnels :
    </p>

    <table>
      <thead>
        <tr>
          <th>Type de Véhicule</th>
          <th>Spécifications & Matériel</th>
          <th>Missions Autorisées</th>
          <th>Statuts Configurables</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Ambulance Type A / B / C</strong></td>
          <td>Brancard obligatoire, oxygénothérapie, matériel de premiers secours d'urgence.</td>
          <td>Patients allongés, urgences, transferts inter-hospitaliers, surveillance active.</td>
          <td><span class="pill pill-green">Disponible</span> <span class="pill pill-blue">En mission</span> <span class="pill pill-amber">Maintenance</span></td>
        </tr>
        <tr>
          <td><strong>VSL (Véhicule Sanitaire Léger)</strong></td>
          <td>Transport assis professionnalisé, hygiène médicale, trousse de secours.</td>
          <td>Consultations, chimiothérapie, dialyse, rééducation, patients autonomes assis.</td>
          <td><span class="pill pill-green">Disponible</span> <span class="pill pill-blue">En mission</span> <span class="pill pill-slate">En pause</span></td>
        </tr>
        <tr>
          <td><strong>Taxi Conventionné CPAM</strong></td>
          <td>Agrément préfectoral + convention CPAM / CGSS en cours de validité.</td>
          <td>Transports assis réguliers, sorties d'hospitalisation, radiothérapie.</td>
          <td><span class="pill pill-green">Disponible</span> <span class="pill pill-blue">En mission</span> <span class="pill pill-slate">Hors service</span></td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-success">
      <strong>Affectation nominative des chauffeurs :</strong> Vous pouvez attribuer un chauffeur DEA Diplômé ou Auxiliaire à chaque véhicule. Son prénom et son numéro de téléphone de bord s'affichent automatiquement au patient pour faciliter la prise de contact lors de l'approche.
    </div>

    <h2>5. Prescription Médicale de Transport (PMT) & Télétransmission</h2>
    <p>
      Pour chaque transport soumis à remboursement Sécurité Sociale (Régime Général 65% ou ALD 100%), la plateforme centralise les pièces justificatives :
    </p>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">📄 Consultation de la PMT</div>
        <div class="card-text">
          Dès l'acceptation, visualisez ou téléchargez la prescription médicale au format PDF ou image téléversée par le patient ou le prescripteur. Vérifiez la date et le motif médical avant le départ.
        </div>
      </div>
      <div class="card">
        <div class="card-title">🗂️ Justificatif Tiers Payant</div>
        <div class="card-text">
          Chaque fiche de course génère les données prêtes pour votre logiciel de facturation (BPEC, Pyxvital, Santé 400, etc.) : NIR vérifié, taux de prise en charge, coordonnées du médecin prescripteur.
        </div>
      </div>
    </div>

    <h2>6. Gestion des Imprévus & Annulations</h2>
    <p>
      La réglementation encadre strictement les annulations et déprogrammations de transport sanitaire :
    </p>
    <ul>
      <li style="margin-bottom: 4px;"><strong>Annulation par le patient :</strong> Si le patient annule avant votre départ, la course est marquée <code>ANNULÉE</code> sans pénalité. Si le déplacement est déjà engagé, une trace d'audit est enregistrée.</li>
      <li style="margin-bottom: 4px;"><strong>Impossibilité de prise en charge (panne, retard) :</strong> Vous devez obligatoirement sélectionner un motif réglementaire (Panne mécanique, Retard prise en charge antérieure, Urgence vitale déroutée) et cliquer sur « Rebasculer au pot commun » pour que la course soit immédiatement reprise par une autre entreprise du secteur.</li>
    </ul>

    <h2>7. Bonnes Pratiques pour Maximiser vos Revenus</h2>
    <div class="grid-3">
      <div class="card card-highlight">
        <div class="card-title">⚡ Réactivité aux alertes</div>
        <div class="card-text">Les courses du pot commun sont attribuées en moins de 3 minutes. Gardez votre console active sur tablette de bord ou smartphone.</div>
      </div>
      <div class="card card-highlight">
        <div class="card-title">📍 Géolocalisation active</div>
        <div class="card-text">Les patients privilégient les transporteurs dont la position est actualisée, diminuant les appels anxieux au standard.</div>
      </div>
      <div class="card card-highlight">
        <div class="card-title">⭐ Fidélisation directe</div>
        <div class="card-text">Un patient satisfait peut vous sélectionner nommément lors de ses futures consultations ou séances de chimiothérapie régulières.</div>
      </div>
    </div>

    <div class="callout">
      <strong>Support Technique & Assistance Régulation :</strong> En cas de difficulté sur une mission, notre équipe d'assistance est joignable 7j/7 depuis le bouton d'urgence de votre console ou par email à <code>support@clinigo.fr</code>.
    </div>

    <div class="footer">
      <span>Clinigo.fr • Guide d'Utilisation Transporteur</span>
      <span>Page 2 / 2</span>
      <span>Conforme Réglementation CPAM / ARS</span>
    </div>
  </div>

</body>
</html>
`;
}

// ==============================================================================
// 2. CONTENU DU GUIDE ADMINISTRATEUR
// ==============================================================================
function getAdminGuideHTML() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Clinigo — Manuel Administrateur & Régulation Régionale</title>
  <style>
    ${getCommonStyles('#1e293b', '#0f766e')}
  </style>
</head>
<body>

  <!-- PAGE 1 -->
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="brand-logo" style="background: #0f172a;">CLINIGO</div>
        <div>
          <div class="brand-title">Tour de Contrôle & Régulation</div>
          <div class="brand-subtitle">Console Administrateur • Supervision Régionale de Santé</div>
        </div>
      </div>
      <div class="doc-badge">
        <div class="doc-badge-title">Niveau d'Accès</div>
        <div class="doc-badge-val">Superviseur Global</div>
      </div>
    </div>

    <div class="hero-banner" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
      <span class="hero-tag">Supervision & Arbitrage ARS</span>
      <div class="hero-title">Manuel de Pilotage Régional des Flux Sanitaires</div>
      <div class="hero-desc">
        Visualisez en direct l'intégralité des flux de transport médical, arbitrez les missions critiques, gérez les habilitations des transporteurs agréés et auditez la conformité réglementaire de la plateforme.
      </div>
    </div>

    <h2>1. Vue d'Ensemble du Tableau de Bord Régional</h2>
    <p>
      Accessible via <strong>https://clinigo.fr/admin</strong>, le tableau de bord centralise en temps réel les indicateurs clés de performance (KPI) calculés directement sur la base de données PostgreSQL :
    </p>

    <div class="grid-2">
      <div class="card card-blue">
        <div class="card-title">📊 Demandes Actives & Répartition</div>
        <div class="card-text">
          Nombre total de courses en cours de traitement, distinguant les demandes <strong>En Attente (PENDING)</strong> d'attribution et les véhicules en rotation active <strong>(EN_ROUTE, IN_PROGRESS)</strong>.
        </div>
      </div>
      <div class="card card-highlight">
        <div class="card-title">⏱️ Délai Moyen d'Attribution</div>
        <div class="card-text">
          Chronomètre dynamique calculant le temps écoulé entre la diffusion d'une course par le patient/hôpital et sa prise en charge par un transporteur. Objectif réglementaire BPEC &lt; 8 minutes.
        </div>
      </div>
      <div class="card card-amber">
        <div class="card-title">🚨 Arbitrages Urgents & Souffrance</div>
        <div class="card-text">
          Alerte prioritaire sur les demandes d'urgences hospitalières ou transferts en brancardage n'ayant reçu aucune acceptation après 15 minutes de diffusion. Action régulateur requise.
        </div>
      </div>
      <div class="card">
        <div class="card-title">🚑 Flottes Sanitaires Engagées</div>
        <div class="card-text">
          Recensement dynamique des ambulances, VSL et taxis conventionnés actuellement connectés et en service opérationnel sur l'ensemble des bassins de santé du territoire.
        </div>
      </div>
    </div>

    <h2>2. Console de Supervision & Carte Interactive</h2>
    <p>
      L'espace <strong>« Supervision Active »</strong> (<code>/admin/supervision</code>) offre une vision tactique du territoire :
    </p>
    <ul>
      <li style="margin-bottom: 5px;"><strong>Filtrage par Bassin de Santé :</strong> Bassin Centre (Fort-de-France, Lamentin, Schœlcher), Bassin Sud (Marin, Ste-Luce, Diamant), Nord Atlantique (Trinité, Robert) et Nord Caraïbe (St-Pierre).</li>
      <li style="margin-bottom: 5px;"><strong>Statut de Tension des Zones :</strong> Calcul automatique de la couverture (Fluide, Tension, Vigilance) basé sur le ratio entre le nombre de véhicules disponibles et le volume de courses en attente.</li>
      <li style="margin-bottom: 5px;"><strong>Tracé Cartographique :</strong> Visualisation des trajets Point A ➔ Point B et des corridors sanitaires vers les CHU et cliniques de référence.</li>
    </ul>

    <h2>3. Procédure d'Arbitrage et d'Attribution Forcée</h2>
    <p>
      Lorsqu'une demande sanitaire reste sans transporteur ou qu'une urgence médicale l'exige, le régulateur peut intervenir manuellement :
    </p>

    <div class="step-box">
      <div class="step-num">1</div>
      <div class="step-content">
        <div class="step-title">Sélection du dossier prioritaire</div>
        <div class="step-desc">Cliquez sur « Arbitrer » en face de la course en attente dans la liste des arbitrages prioritaires.</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-num">2</div>
      <div class="step-content">
        <div class="step-title">Sélection de l'entreprise sanitaire agréée</div>
        <div class="step-desc">Dans la modal d'attribution, choisissez le transporteur le plus proche parmi les sociétés conventionnées actives dans le bassin concerné.</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-num">3</div>
      <div class="step-content">
        <div class="step-title">Validation & Notification immédiate</div>
        <div class="step-desc">Validez l'affectation. Le statut passe automatiquement à <code>ACCEPTED</code>, la course est retirée du pot commun et une notification prioritaire est transmise au transporteur sélectionné.</div>
      </div>
    </div>

    <div class="footer">
      <span>Clinigo.fr • Manuel Administrateur & Régulation</span>
      <span>Page 1 / 2</span>
      <span>Accès Restreint • Habilité Secret Médical & RGPD</span>
    </div>
  </div>

  <!-- PAGE 2 -->
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="brand-logo" style="background: #0f172a;">CLINIGO</div>
        <div>
          <div class="brand-title">Gestion des Référentiels & Traçabilité</div>
          <div class="brand-subtitle">Transporteurs • Clients • Établissements de Santé</div>
        </div>
      </div>
      <div class="doc-badge">
        <div class="doc-badge-title">Module Avancé</div>
        <div class="doc-badge-val">Audit & Conformité</div>
      </div>
    </div>

    <h2>4. Gestion des Transporteurs Conventionnés</h2>
    <p>
      Depuis l'onglet <strong>« Transporteurs »</strong> (<code>/admin/transporteurs</code>), le superviseur administre l'annuaire professionnel :
    </p>

    <table>
      <thead>
        <tr>
          <th>Fonctionnalité</th>
          <th>Actions Possibles</th>
          <th>Impact Système</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Validation d'Agrément</strong></td>
          <td>Contrôle du numéro ARS, attestation de conventionnement CPAM/CGSS, SIRET.</td>
          <td>Activation du badge officiel « Transporteur Vérifié ».</td>
        </tr>
        <tr>
          <td><strong>Audit de Flotte & Chauffeurs</strong></td>
          <td>Consultation et édition des véhicules déclarés (plaques, types) et des chauffeurs DEA rattachés.</td>
          <td>Mise à jour instantanée des capacités d'intervention par zone.</td>
        </tr>
        <tr>
          <td><strong>Statut du Compte</strong></td>
          <td>Basculer entre <span class="pill pill-green">Actif</span>, <span class="pill pill-amber">En attente</span> ou <span class="pill pill-slate">Suspendu</span>.</td>
          <td>Un compte suspendu ne peut plus recevoir ni accepter de courses.</td>
        </tr>
        <tr>
          <td><strong>Gestion de l'Essai & Facturation</strong></td>
          <td>Déblocage des jours d'essai gratuit, suivi des abonnements mensuels.</td>
          <td>Accès aux courses et émission des reçus de paiement.</td>
        </tr>
      </tbody>
    </table>

    <h2>5. Répertoire des Établissements de Santé (FINESS)</h2>
    <p>
      L'espace <strong>« Établissements »</strong> recense les hôpitaux, cliniques, centres de dialyse et EHPAD du réseau :
    </p>
    <ul>
      <li style="margin-bottom: 4px;"><strong>Fiche Structure :</strong> Numéro FINESS à 9 chiffres, adresse exacte, téléphone direct du cadre de santé ou du bureau des entrées/sorties.</li>
      <li style="margin-bottom: 4px;"><strong>Points de dépose spécifiques :</strong> Configuration des accès réservés aux ambulances (ex: Quai brancards Néphrologie, Dépose Urgences Adultes, Entrée Ambulatoire).</li>
    </ul>

    <h2>6. Fichier Patients & Contrôle des Droits CPAM</h2>
    <p>
      L'espace <strong>« Clients »</strong> (<code>/admin/clients</code>) permet de gérer les dossiers patients en conformité RGPD :
    </p>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">🔍 Recherche & NIR Sécurisé</div>
        <div class="card-text">
          Recherche multicritère (Nom, NIR, Ville, ALD). Vérification de la validité de la clé de contrôle Sécurité Sociale (clé NIR 97/972).
        </div>
      </div>
      <div class="card">
        <div class="card-title">📋 Historique & Prescriptions</div>
        <div class="card-text">
          Consultation de toutes les courses rattachées à un patient, statut des PMT téléversées et motif d'exonération du ticket modérateur.
        </div>
      </div>
    </div>

    <h2>7. Journal d'Audit Réglementaire & Sécurité</h2>
    <p>
      Conformément aux exigences de la CNIL et des Agences Régionales de Santé, Clinigo garantit une <strong>traçabilité intégrale et infalsifiable</strong> de chaque action :
    </p>
    <ul>
      <li style="margin-bottom: 4px;"><strong>Horodatage certifié :</strong> Heure exacte de création, d'attribution, de prise en charge et de dépose.</li>
      <li style="margin-bottom: 4px;"><strong>Identifiant de l'opérateur :</strong> Chaque arbitrage forcé ou réassignation enregistre l'identifiant de l'administrateur ayant validé la décision.</li>
      <li style="margin-bottom: 4px;"><strong>Export Réglementaire :</strong> Génération de rapports périodiques d'activité aux formats Excel et PDF pour communication aux caisses d'assurance maladie et comités paritaires locaux.</li>
    </ul>

    <div class="callout callout-warning">
      <strong>Règle de Sécurité Absolue :</strong> Les comptes administrateurs sont strictement personnels. Toute attribution de rôle Admin dans la base de données est protégée contre l'escalade de privilèges non autorisée.
    </div>

    <div class="footer">
      <span>Clinigo.fr • Manuel Administrateur & Régulation</span>
      <span>Page 2 / 2</span>
      <span>Traçabilité Conforme ARS / CPAM</span>
    </div>
  </div>

</body>
</html>
`;
}

// ==============================================================================
// 3. CONTENU DU GUIDE PATIENT & FAMILLES
// ==============================================================================
function getPatientGuideHTML() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Clinigo — Guide Patient & Familles</title>
  <style>
    ${getCommonStyles('#0284c7', '#0f766e')}
  </style>
</head>
<body>

  <!-- PAGE 1 -->
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="brand-logo" style="background: #0284c7;">CLINIGO</div>
        <div>
          <div class="brand-title">Espace Patient & Famille</div>
          <div class="brand-subtitle">Transports Médicaux Conventionnés • Tiers Payant Intégral</div>
        </div>
      </div>
      <div class="doc-badge">
        <div class="doc-badge-title">Guide Pratique</div>
        <div class="doc-badge-val">Édition 2026</div>
      </div>
    </div>

    <div class="hero-banner" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
      <span class="hero-tag">Votre Santé, Notre Priorité</span>
      <div class="hero-title">Réserver & Suivre son Transport Médical en Toute Sérénité</div>
      <div class="hero-desc">
        Clinigo vous met en relation instantanément avec les ambulanciers, VSL et taxis conventionnés agréés par la Sécurité Sociale pour vos rendez-vous médicaux, dialyses, chimiothérapies et hospitalisations.
      </div>
    </div>

    <h2>1. Vos Droits & Prise en Charge Sécurité Sociale</h2>
    <p>
      Le transport sanitaire terrestre est un soin prescrit sur ordonnance par votre médecin traitant ou hospitalier. Selon votre situation médicale, vos frais de transport peuvent être couverts jusqu'à 100% :
    </p>

    <div class="grid-2">
      <div class="card card-highlight">
        <div class="card-title">🩺 Prise en Charge à 100% (Tiers Payant Intégral)</div>
        <div class="card-text">
          Si vous êtes reconnu en <strong>Affection de Longue Durée (ALD 30)</strong>, en accident du travail, en maternité à partir du 6e mois, ou bénéficiaire de la Complémentaire Santé Solidaire (CSS). <strong>Vous n'avancez aucun frais !</strong>
        </div>
      </div>
      <div class="card card-blue">
        <div class="card-title">📄 Régime Général (65% Sécurité Sociale + 35% Mutuelle)</div>
        <div class="card-text">
          Pour les autres situations prises en charge (hospitalisation, soins réguliers). La part restante est généralement couverte à 100% par votre mutuelle ou complémentaire santé.
        </div>
      </div>
    </div>

    <div class="callout callout-success">
      <strong>La Règle d'Or : La Prescription Médicale de Transport (PMT) :</strong> Pour être pris en charge, le transport doit obligatoirement avoir fait l'objet d'une prescription par un médecin <strong>avant la réalisation du trajet</strong> (sauf convocation médicale officielle ou urgence).
    </div>

    <h2>2. Quel Véhicule Choisir pour Votre Trajet ?</h2>
    <p>
      Le choix du mode de transport dépend exclusivement de votre état de santé et de votre autonomie :
    </p>

    <div class="grid-3">
      <div class="card">
        <div class="card-title">🚕 Taxi Conventionné</div>
        <div class="card-text">
          <strong>Vous voyagez assis :</strong> Vous marchez seul ou avec une canne, sans aide physique permanente. Véhicule tout confort climatisé.
        </div>
      </div>
      <div class="card">
        <div class="card-title">🚙 VSL (Véhicule Sanitaire)</div>
        <div class="card-text">
          <strong>Besoin d'assistance à la marche :</strong> Chauffeur professionnel formé, aide aux démarches administratives, accompagnement jusqu'au service.
        </div>
      </div>
      <div class="card">
        <div class="card-title">🚑 Ambulance Médicalisée</div>
        <div class="card-text">
          <strong>Position allongée ou surveillance :</strong> Brancardage obligatoire, bouteille d'oxygène, ou état de santé nécessitant deux ambulanciers DEA.
        </div>
      </div>
    </div>

    <h2>3. Réserver Votre Transport en 4 Étapes Simples</h2>
    <p>Rendez-vous sur <strong>https://clinigo.fr/reserver</strong> depuis votre ordinateur, tablette ou smartphone :</p>

    <div class="step-box">
      <div class="step-num">1</div>
      <div class="step-content">
        <div class="step-title">Indiquez vos Adresses de Départ et d'Arrivée</div>
        <div class="step-desc">Votre domicile et le centre de soins de destination (ex: CHU Pierre Zobda-Quitman, Clinique Sainte-Marie, etc.).</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-num">2</div>
      <div class="step-content">
        <div class="step-title">Choisissez la Date et l'Heure du Rendez-vous</div>
        <div class="step-desc">Précisez l'heure exacte de votre convocation médicale. Notre système calcule automatiquement l'heure optimale de départ selon la circulation.</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-num">3</div>
      <div class="step-content">
        <div class="step-title">Renseignez vos Besoins de Mobilité</div>
        <div class="step-desc">Fauteuil roulant, brancard, présence d'escaliers sans ascenseur, besoin d'un accompagnant.</div>
      </div>
    </div>

    <div class="step-box">
      <div class="step-num">4</div>
      <div class="step-content">
        <div class="step-title">Sélectionnez Votre Mode de Diffusion</div>
        <div class="step-desc">
          <strong>Option A : Diffusion Express</strong> à tous les professionnels conventionnés de votre secteur.<br>
          <strong>Option B : Demande Directe</strong> adressée exclusivement à votre société de transport habituelle (délai de réponse 24h).
        </div>
      </div>
    </div>

    <div class="footer">
      <span>Clinigo.fr • Guide Pratique Patient & Famille</span>
      <span>Page 1 / 2</span>
      <span>Information Conforme Assurance Maladie</span>
    </div>
  </div>

  <!-- PAGE 2 -->
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="brand-logo" style="background: #0284c7;">CLINIGO</div>
        <div>
          <div class="brand-title">Espace Patient & Famille</div>
          <div class="brand-subtitle">Suivi en Direct • Sérénité • Transports Répétés</div>
        </div>
      </div>
      <div class="doc-badge">
        <div class="doc-badge-title">Votre Espace</div>
        <div class="doc-badge-val">Suivi en Temps Réel</div>
      </div>
    </div>

    <h2>4. Votre Numéro de Référence & Confirmation</h2>
    <p>
      Dès validation de votre formulaire, vous recevez un numéro de dossier unique formaté <strong>MT-972-XXXX</strong> (ex: MT-972-4108).
      Ce numéro est votre référence permanente pour vos échanges avec le transporteur et le service de soins.
    </p>

    <div class="grid-2">
      <div class="card card-highlight">
        <div class="card-title">📲 SMS de Confirmation Automatique</div>
        <div class="card-text">
          Dès qu'un transporteur valide votre prise en charge, vous recevez un SMS contenant :
          <ul style="margin-left: 15px; margin-top: 4px;">
            <li>Le nom de l'entreprise d'ambulance / VSL / taxi.</li>
            <li>Le prénom du chauffeur attitré.</li>
            <li>La plaque d'immatriculation du véhicule.</li>
            <li>L'heure confirmée d'arrivée à votre domicile.</li>
          </ul>
        </div>
      </div>
      <div class="card card-blue">
        <div class="card-title">🗺️ Suivi Cartographique en Ligne</div>
        <div class="card-text">
          Connectez-vous à la page <strong>https://clinigo.fr/suivi</strong> avec votre numéro de référence ou votre compte patient pour visualiser l'approche de votre véhicule en direct.
        </div>
      </div>
    </div>

    <h2>5. Séries de Soins & Transports Répétés (Dialyse, Chimiothérapie, Rééducation)</h2>
    <p>
      Si vous devez vous rendre fréquemment à l'hôpital ou dans un centre de dialyse (plusieurs fois par semaine) :
    </p>
    <ul>
      <li style="margin-bottom: 5px;"><strong>Réservation de séries en 1 clic :</strong> Cochez « Transport Récurrent » lors de votre réservation et sélectionnez l'ensemble de vos dates programmées sur le calendrier.</li>
      <li style="margin-bottom: 5px;"><strong>Attribution Groupée :</strong> Un même transporteur partenaire peut prendre en charge l'ensemble de vos allers-retours pour assurer une continuité et une familiarité rassurante.</li>
      <li style="margin-bottom: 5px;"><strong>Renouvellement Simplifié :</strong> Depuis votre espace historique, cliquez sur « Renouveler ce trajet » pour reprogrammer votre course sans devoir tout ressaisir.</li>
    </ul>

    <h2>6. Que Faire en Cas d'Imprévu ou de Report ?</h2>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">📞 Consultation Décalée ou Reportée</div>
        <div class="card-text">
          Prévenez directement votre chauffeur via le numéro affiché sur votre écran de suivi, ou cliquez sur « Modifier l'horaire » dans votre espace personnel.
        </div>
      </div>
      <div class="card">
        <div class="card-title">❌ Annulation sans Frais</div>
        <div class="card-text">
          Si votre rendez-vous est annulé par le médecin, vous pouvez annuler votre transport sans pénalité depuis votre suivi en indiquant le motif (Rendez-vous décalé, Soin annulé, Transport personnel).
        </div>
      </div>
    </div>

    <h2>7. Vos Pièces à Préparer le Jour du Départ</h2>
    <div class="callout callout-success">
      <div style="font-weight: 800; font-size: 11px; margin-bottom: 5px;">Rappel des pièces indispensables pour la prise en charge à 100% :</div>
      <ol style="margin-left: 18px; line-height: 1.6;">
        <li><strong>Votre Carte Vitale</strong> à jour (mise à jour possible en pharmacie).</li>
        <li><strong>Votre Attestation de Droits Sécurité Sociale</strong> (mentionnant vos droits ALD si concerné).</li>
        <li><strong>La Prescription Médicale de Transport (PMT)</strong> originale signée et tamponnée par le médecin.</li>
        <li><strong>Votre Carte de Mutuelle / Complémentaire Santé</strong> en cours de validité.</li>
      </ol>
    </div>

    <h2>8. Besoin d'Aide ? Contactez le Support Clinigo</h2>
    <p>
      Nos conseillers accompagnent les patients et leurs familles du lundi au samedi de 06h00 à 20h00 :
    </p>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">📧 Par Email</div>
        <div class="card-text"><strong>contact@clinigo.fr</strong> — Réponse en moins de 2 heures ouvrées.</div>
      </div>
      <div class="card">
        <div class="card-title">🌐 En Ligne</div>
        <div class="card-text">Consultez notre foire aux questions sur <strong>https://clinigo.fr/aide</strong></div>
      </div>
    </div>

    <div class="footer">
      <span>Clinigo.fr • Guide Pratique Patient & Famille</span>
      <span>Page 2 / 2</span>
      <span>Plateforme Agréée de Transport Sanitaire</span>
    </div>
  </div>

</body>
</html>
`;
}

// ==============================================================================
// FONCTION PRINCIPALE DE GÉNÉRATION DES 3 PDFS
// ==============================================================================
async function generateAllGuides() {
  console.log('🚀 Démarrage de la génération des 3 guides PDF officiels Clinigo...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const guides = [
      {
        filename: 'GUIDE_UTILISATION_TRANSPORTEUR.pdf',
        title: 'Guide Transporteur Sanitaire',
        html: getTransporterGuideHTML()
      },
      {
        filename: 'GUIDE_UTILISATION_ADMINISTRATEUR.pdf',
        title: 'Manuel Administrateur & Régulation',
        html: getAdminGuideHTML()
      },
      {
        filename: 'GUIDE_UTILISATION_PATIENT.pdf',
        title: 'Guide Patient & Familles',
        html: getPatientGuideHTML()
      }
    ];

    for (const guide of guides) {
      console.log(`📄 Génération de : ${guide.title} (${guide.filename})...`);
      const page = await browser.newPage();
      await page.setContent(guide.html, { waitUntil: 'networkidle0' });

      const outputPath = path.join(ROOT_DIR, guide.filename);
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        }
      });

      const stats = fs.statSync(outputPath);
      console.log(`   ✅ Créé avec succès : ${outputPath} (${(stats.size / 1024).toFixed(1)} Ko)`);
      await page.close();
    }

    console.log('\n🎉 TOUS LES GUIDES PDF ONT ÉTÉ GÉNÉRÉS AVEC SUCCÈS DANS LE RÉPERTOIRE DU PROJET !');
  } catch (err) {
    console.error('❌ Erreur lors de la génération des PDF :', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generateAllGuides();
