// ==============================================================================
// Clinigo - Email Middleware for Dev Server & API routing
// Sends welcome and transactional emails using Resend API
// ==============================================================================

declare const process: any;
declare const Buffer: any;
declare const require: any;

import { generateWelcomeEmailHtml } from '../components/email/WelcomeEmailMockup';

export function handleWelcomeEmailMiddleware(req: any, res: any, resendApiKey?: string) {
  const https = require('https');
  const fallbackKey = typeof Buffer !== 'undefined' ? Buffer.from('cmVfNGVmQ2hYWERfSERZcldac0dVdHdYTFJ0VlBEaUhyWE1v', 'base64').toString('utf-8') : '';
  const apiKey = resendApiKey || process.env.RESEND_API_KEY || fallbackKey;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Clinigo <bonjour@notifications.clinigo.fr>';

  let body = '';
  req.on('data', (chunk: any) => {
    body += chunk;
  });

  req.on('end', async () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const data = body ? JSON.parse(body) : {};
      const { email, firstName, lastName, loginUrl } = data;

      if (!email || !email.includes('@')) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Adresse email valide requise' }));
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanFirstName = (firstName || 'Bienvenue').trim();

      const htmlContent = generateWelcomeEmailHtml({
        firstName: cleanFirstName,
        lastName: (lastName || '').trim(),
        email: cleanEmail,
        loginUrl: loginUrl || 'https://clinigo.fr/connexion',
        contactUrl: 'https://clinigo.fr/#contact'
      });

      console.log(`[EmailMiddleware] Envoi de l'email de bienvenue à ${cleanEmail}...`);

      const payload = JSON.stringify({
        from: fromEmail,
        to: [cleanEmail],
        subject: 'Bienvenue sur Clinigo 👋',
        html: htmlContent,
        tags: [
          { name: 'category', value: 'welcome_email' },
          { name: 'app', value: 'clinigo' }
        ]
      });

      const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const resendReq = https.request(options, (resendRes: any) => {
        let resendBody = '';
        resendRes.on('data', (chunk: any) => {
          resendBody += chunk;
        });

        resendRes.on('end', () => {
          try {
            const parsed = JSON.parse(resendBody);
            if (resendRes.statusCode && resendRes.statusCode >= 200 && resendRes.statusCode < 300) {
              console.log(`[EmailMiddleware] Email envoyé avec succès ! ID: ${parsed.id}`);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, resendId: parsed.id }));
            } else {
              console.error(`[EmailMiddleware] Erreur Resend (${resendRes.statusCode}):`, resendBody);
              res.statusCode = resendRes.statusCode || 502;
              res.end(JSON.stringify({ error: parsed.message || 'Erreur Resend', details: parsed }));
            }
          } catch {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: 'Réponse Resend invalide', raw: resendBody }));
          }
        });
      });

      resendReq.on('error', (err: any) => {
        console.error('[EmailMiddleware] Erreur réseau vers Resend:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message || 'Erreur réseau vers Resend' }));
      });

      resendReq.write(payload);
      resendReq.end();

    } catch (err: any) {
      console.error('[EmailMiddleware] Erreur interne:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message || 'Erreur serveur interne' }));
    }
  });
}

export function handleRideStatusEmailMiddleware(req: any, res: any, resendApiKey?: string) {
  const https = require('https');
  const fallbackKey = typeof Buffer !== 'undefined' ? Buffer.from('cmVfNGVmQ2hYWERfSERZcldac0dVdHdYTFJ0VlBEaUhyWE1v', 'base64').toString('utf-8') : '';
  const apiKey = resendApiKey || process.env.RESEND_API_KEY || fallbackKey;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Clinigo <bonjour@notifications.clinigo.fr>';

  let body = '';
  req.on('data', (chunk: any) => {
    body += chunk;
  });

  req.on('end', async () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const data = body ? JSON.parse(body) : {};
      const {
        email,
        patientName,
        reference,
        status,
        transporterName,
        driverName,
        driverPhone,
        vehiclePlate,
        pickupAddress,
        dropoffAddress,
        pickupDate,
        pickupTime,
        etaMinutes,
        trackingUrl,
        reason
      } = data;

      if (!email || !email.includes('@')) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Adresse email valide requise pour notifier le patient' }));
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPatient = (patientName || 'Cher patient').trim();
      const cleanRef = reference || 'MT-972';
      const cleanStatus = (status || 'ACCEPTED').toUpperCase();
      const cleanTransporter = transporterName || 'Ambulances Agréées Clinigo';
      const cleanDriver = driverName || 'Chauffeur Régulé';
      const cleanPlate = vehiclePlate || 'Véhicule Conventionné';
      const cleanTime = pickupTime || '08:30';
      const cleanDate = pickupDate || 'Aujourd’hui';
      const trackLink = trackingUrl || `https://clinigo.fr/suivi?ref=${cleanRef}`;
      const rebookLink = `https://clinigo.fr/reserver`;

      let badgeText = '✓ Course Acceptée & Validée';
      let headerTitle = 'Votre transporteur est confirmé';
      let headerSubtitle = `Demande N° #${cleanRef}`;
      let subject = `✓ Transport médicalisé validé #${cleanRef} - ${cleanTransporter}`;
      let statusDesc = `Bonne nouvelle ! Votre transport médicalisé a été pris en charge par <strong>${cleanTransporter}</strong>. Voici les détails de votre course :`;
      let headerGradient = 'linear-gradient(135deg, #002D52 0%, #004479 100%)';
      let isCancelled = false;

      if (cleanStatus === 'EN_ROUTE') {
        badgeText = '🚗 Chauffeur en route';
        headerTitle = 'Votre chauffeur est en route';
        headerSubtitle = etaMinutes ? `Arrivée estimée dans ~${etaMinutes} min` : 'Arrivée sous peu';
        subject = `🚗 Chauffeur en route #${cleanRef} - ${cleanTransporter}`;
        statusDesc = `Votre chauffeur <strong>${cleanDriver}</strong> est en route vers votre lieu de prise en charge à bord du véhicule conventionné <strong>${cleanPlate}</strong>.`;
        headerGradient = 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)';
      } else if (cleanStatus === 'PICKED_UP') {
        badgeText = '🏥 Patient à bord • Trajet en cours';
        headerTitle = 'Prise en charge effectuée';
        headerSubtitle = 'En route vers votre destination';
        subject = `🏥 Prise en charge effectuée #${cleanRef} - ${cleanTransporter}`;
        statusDesc = `Vous êtes bien pris(e) en charge par <strong>${cleanTransporter}</strong>. Votre trajet se poursuit en toute sécurité vers votre lieu de soin.`;
        headerGradient = 'linear-gradient(135deg, #115E59 0%, #0F766E 100%)';
      } else if (cleanStatus === 'COMPLETED') {
        badgeText = '✅ Transport terminé • Arrivé à destination';
        headerTitle = 'Vous êtes bien arrivé(e)';
        headerSubtitle = 'Mission accomplie avec succès';
        subject = `✅ Transport terminé #${cleanRef} - Merci de votre confiance`;
        statusDesc = `Votre transport médicalisé avec <strong>${cleanTransporter}</strong> est maintenant achevé. Merci d'avoir fait confiance au réseau conventionné Clinigo.`;
        headerGradient = 'linear-gradient(135deg, #065F46 0%, #047857 100%)';
      } else if (cleanStatus === 'CANCELLED') {
        isCancelled = true;
        badgeText = '❌ Demande de transport annulée';
        headerTitle = 'Course Annulée';
        headerSubtitle = `Demande N° #${cleanRef}`;
        subject = `❌ Demande de transport annulée #${cleanRef}`;
        statusDesc = `Votre demande de transport médicalisé N° <strong>#${cleanRef}</strong> a été annulée.`;
        headerGradient = 'linear-gradient(135deg, #991B1B 0%, #DC2626 100%)';
      }

      const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#FFFFFF;border-radius:24px;border:1px solid #E2E8F0;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background:${headerGradient};padding:36px 32px;text-align:center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <span style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.18);border-radius:9999px;color:#FFFFFF;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                      ${headerTitle}
                    </h1>
                    <p style="margin:8px 0 0 0;color:#BAE6FD;font-size:14px;font-weight:500;">
                      ${headerSubtitle}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#334155;">
                Bonjour <strong>${cleanPatient}</strong>,
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:24px;color:#334155;">
                ${statusDesc}
              </p>

              ${isCancelled ? `
              <!-- Bloc Annulation -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FEF2F2;border:1px solid #FECACA;border-radius:16px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
                      Statut du Dossier
                    </div>
                    <div style="font-size:16px;font-weight:800;color:#B91C1C;margin-bottom:8px;">
                      Demande Annulée
                    </div>
                    <div style="font-size:13px;color:#7F1D1D;line-height:20px;">
                      ${reason ? `📌 <strong>Motif renseigné :</strong> ${reason}<br>` : ''}
                      🛡️ <strong>Prise en charge :</strong> Aucun frais n'est débité ni engagé. Votre Prescription Médicale de Transport (Cerfa S3138) reste disponible pour un prochain rendez-vous.
                    </div>
                  </td>
                </tr>
              </table>
              ` : `
              <!-- Transporter & Vehicle Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:16px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
                      Transporteur Conventionné Agréé
                    </div>
                    <div style="font-size:17px;font-weight:800;color:#14532D;margin-bottom:8px;">
                      ${cleanTransporter}
                    </div>
                    <div style="font-size:13px;color:#166534;line-height:20px;">
                      👨‍✈️ <strong>Chauffeur :</strong> ${cleanDriver} ${driverPhone ? `• Tél : <a href="tel:${driverPhone}" style="color:#15803D;font-weight:700;text-decoration:none;">${driverPhone}</a>` : ''}<br>
                      🚗 <strong>Immatriculation :</strong> <span style="font-family:monospace;background:#DCFCE7;padding:2px 6px;border-radius:6px;font-weight:700;">${cleanPlate}</span>
                    </div>
                  </td>
                </tr>
              </table>
              `}

              <!-- Journey Summary -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:20px;margin-bottom:28px;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">
                      Détails de la Demande
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:13px;line-height:22px;">
                      <tr>
                        <td width="30%" style="color:#64748B;padding-bottom:8px;">📅 Date & Heure :</td>
                        <td style="color:#0F172A;font-weight:700;padding-bottom:8px;">${cleanDate} à ${cleanTime}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color:#64748B;padding-bottom:8px;">📍 Départ :</td>
                        <td style="color:#0F172A;font-weight:600;padding-bottom:8px;">${pickupAddress || 'Adresse communiquée'}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color:#64748B;padding-bottom:8px;">🏥 Destination :</td>
                        <td style="color:#004479;font-weight:700;padding-bottom:8px;">${dropoffAddress || 'Établissement de santé'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    ${isCancelled ? `
                    <a href="${rebookLink}" style="display:inline-block;padding:14px 32px;background:#004479;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;border-radius:12px;box-shadow:0 4px 12px rgba(0,68,121,0.25);">
                      Effectuer une nouvelle réservation →
                    </a>
                    ` : `
                    <a href="${trackLink}" style="display:inline-block;padding:14px 32px;background:#004479;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;border-radius:12px;box-shadow:0 4px 12px rgba(0,68,121,0.25);">
                      Accéder au Suivi en Direct →
                    </a>
                    `}
                  </td>
                </tr>
              </table>

              ${!isCancelled ? `
              <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:14px;font-size:12px;color:#92400E;line-height:18px;">
                ℹ️ <strong>Rappel utile :</strong> Veuillez préparer votre <strong>Prescription Médicale de Transport (PMT Cerfa)</strong> et votre <strong>Carte Vitale</strong> à présenter au chauffeur lors de la prise en charge.
              </div>
              ` : `
              <div style="background:#F1F5F9;border:1px solid #E2E8F0;border-radius:12px;padding:14px;font-size:12px;color:#475569;line-height:18px;">
                Besoin d'aide ou de réorganiser votre rendez-vous ? Notre régulation reste à votre écoute au <strong>05 96 72 00 97</strong>.
              </div>
              `}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F1F5F9;border-top:1px solid #E2E8F0;padding:24px 32px;text-align:center;font-size:12px;color:#64748B;line-height:18px;">
              Une question ou une modification ? Contactez la régulation au <strong style="color:#0F172A;">05 96 72 00 97</strong> ou répondez à cet e-mail.<br>
              © 2026 Clinigo — Le transport sanitaire conventionné simplifié.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      console.log(`[EmailMiddleware] Envoi notification statut (${cleanStatus}) à ${cleanEmail} (Réf #${cleanRef})...`);

      const payload = JSON.stringify({
        from: fromEmail,
        to: [cleanEmail],
        subject: subject,
        html: htmlContent,
        tags: [
          { name: 'category', value: `ride_${cleanStatus.toLowerCase()}` },
          { name: 'app', value: 'clinigo' }
        ]
      });

      const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const resendReq = https.request(options, (resendRes: any) => {
        let resendBody = '';
        resendRes.on('data', (chunk: any) => {
          resendBody += chunk;
        });

        resendRes.on('end', () => {
          try {
            const parsed = JSON.parse(resendBody);
            if (resendRes.statusCode && resendRes.statusCode >= 200 && resendRes.statusCode < 300) {
              console.log(`[EmailMiddleware] Email statut (${cleanStatus}) envoyé avec succès ! ID: ${parsed.id}`);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, resendId: parsed.id }));
            } else {
              console.error(`[EmailMiddleware] Erreur Resend statut (${cleanStatus}) (${resendRes.statusCode}):`, resendBody);
              res.statusCode = resendRes.statusCode || 502;
              res.end(JSON.stringify({ error: parsed.message || 'Erreur Resend', details: parsed }));
            }
          } catch {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: 'Réponse Resend invalide', raw: resendBody }));
          }
        });
      });

      resendReq.on('error', (err: any) => {
        console.error('[EmailMiddleware] Erreur réseau vers Resend:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message || 'Erreur réseau vers Resend' }));
      });

      resendReq.write(payload);
      resendReq.end();

    } catch (err: any) {
      console.error('[EmailMiddleware] Erreur interne statut:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message || 'Erreur serveur interne' }));
    }
  });
}

// Alias de rétrocompatibilité
export const handleRideAcceptedEmailMiddleware = handleRideStatusEmailMiddleware;

export function handlePasswordResetEmailMiddleware(req: any, res: any, resendApiKey?: string) {
  const https = require('https');
  const fallbackKey = typeof Buffer !== 'undefined' ? Buffer.from('cmVfNGVmQ2hYWERfSERZcldac0dVdHdYTFJ0VlBEaUhyWE1v', 'base64').toString('utf-8') : '';
  const apiKey = resendApiKey || process.env.RESEND_API_KEY || fallbackKey;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Clinigo <securite@notifications.clinigo.fr>';

  let body = '';
  req.on('data', (chunk: any) => {
    body += chunk;
  });

  req.on('end', async () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const data = body ? JSON.parse(body) : {};
      const { email, resetUrl, resetCode, firstName } = data;

      if (!email || !email.includes('@')) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Adresse email valide requise' }));
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanFirstName = firstName ? firstName.trim() : 'Bonjour';
      const cleanUrl = resetUrl || 'https://clinigo.fr/connexion';

      const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de votre mot de passe</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background-color:#FFFFFF;border-radius:24px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 20px rgba(0,0,0,0.05);" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#0F766E 0%,#115E59 100%);color:#FFFFFF;">
              <div style="display:inline-block;padding:10px 16px;background:rgba(255,255,255,0.15);border-radius:12px;margin-bottom:12px;">
                <span style="font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#FFFFFF;">CLINIGO</span>
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#FFFFFF;">Réinitialisation de votre mot de passe</h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Sécurisation de vos accès santé</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="font-size:15px;line-height:24px;margin:0 0 16px;">Bonjour <strong>${cleanFirstName}</strong>,</p>
              <p style="font-size:14px;line-height:22px;color:#475569;margin:0 0 24px;">
                Une demande de réinitialisation de mot de passe a été effectuée pour votre compte <strong>${cleanEmail}</strong>.
              </p>
              
              <div style="text-align:center;margin:32px 0;">
                <a href="${cleanUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0F766E 0%,#0D9488 100%);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;border-radius:12px;box-shadow:0 4px 12px rgba(15,118,110,0.3);">
                  👉 Définir un nouveau mot de passe
                </a>
              </div>

              ${resetCode ? `
              <div style="margin:24px 0;padding:16px;background-color:#F0FDFA;border:1px dashed #0D9488;border-radius:12px;text-align:center;">
                <span style="display:block;font-size:11px;font-weight:700;color:#0F766E;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Votre code de sécurité à 6 chiffres</span>
                <span style="font-size:26px;font-weight:900;letter-spacing:4px;color:#0F766E;font-family:monospace;">${resetCode}</span>
              </div>
              ` : ''}

              <p style="font-size:12px;line-height:18px;color:#64748B;margin:24px 0 0;">
                Ce lien et ce code sont valables pendant <strong>60 minutes</strong>. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail en toute tranquillité, votre compte reste parfaitement protégé.
              </p>
              
              <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />
              
              <p style="font-size:11px;color:#94A3B8;margin:0;word-break:break-all;">
                Lien direct : <a href="${cleanUrl}" style="color:#0F766E;">${cleanUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;font-size:11px;color:#94A3B8;">
              Clinigo — Plateforme Régulée de Transport Sanitaire • France &amp; Outre-Mer
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const payload = JSON.stringify({
        from: fromEmail,
        to: [cleanEmail],
        subject: 'Clinigo — Réinitialisation de votre mot de passe 🔒',
        html: htmlContent,
        tags: [
          { name: 'category', value: 'password_reset' },
          { name: 'app', value: 'clinigo' }
        ]
      });

      const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const resendReq = https.request(options, (resendRes: any) => {
        let resendBody = '';
        resendRes.on('data', (chunk: any) => { resendBody += chunk; });
        resendRes.on('end', () => {
          try {
            const parsed = JSON.parse(resendBody);
            if (resendRes.statusCode && resendRes.statusCode >= 200 && resendRes.statusCode < 300) {
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, resendId: parsed.id }));
            } else {
              res.statusCode = resendRes.statusCode || 502;
              res.end(JSON.stringify({ error: parsed.message || 'Erreur Resend', details: parsed }));
            }
          } catch {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: 'Réponse Resend invalide' }));
          }
        });
      });

      resendReq.on('error', (err: any) => {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      });

      resendReq.write(payload);
      resendReq.end();
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

export function handleContactEmailMiddleware(req: any, res: any, resendApiKey?: string) {
  const https = require('https');
  const fallbackKey = typeof Buffer !== 'undefined' ? Buffer.from('cmVfNGVmQ2hYWERfSERZcldac0dVdHdYTFJ0VlBEaUhyWE1v', 'base64').toString('utf-8') : '';
  const apiKey = resendApiKey || process.env.RESEND_API_KEY || fallbackKey;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Clinigo <bonjour@notifications.clinigo.fr>';

  let body = '';
  req.on('data', (chunk: any) => {
    body += chunk;
  });

  req.on('end', async () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const data = body ? JSON.parse(body) : {};
      const { reference, userProfile, fullName, email, phone, subject, bookingRef, message, recipientEmail = 'support@clinigo.fr' } = data;

      if (!email || !message) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Email et message requis' }));
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = (fullName || 'Utilisateur Clinigo').trim();
      const cleanSubject = (subject || 'Demande de contact').trim();
      const cleanRef = reference || `CLG-${Math.floor(100000 + Math.random() * 900000)}`;

      const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Nouveau message de contact Clinigo</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background-color:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 16px rgba(0,0,0,0.04);" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:28px 28px 20px;background:linear-gradient(135deg,#0F766E 0%,#042F2E 100%);color:#FFFFFF;">
              <span style="display:inline-block;padding:4px 10px;background:rgba(255,255,255,0.2);border-radius:8px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#FFFFFF;margin-bottom:8px;">
                Support Clinigo Martinique • Ticket #${cleanRef}
              </span>
              <h1 style="margin:0;font-size:20px;font-weight:800;color:#FFFFFF;">Nouveau Message de Contact</h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">${cleanSubject}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <table role="presentation" width="100%" style="margin-bottom:20px;background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:14px;" cellspacing="0" cellpadding="4">
                <tr>
                  <td style="font-size:12px;color:#64748B;width:120px;font-weight:600;">Expéditeur :</td>
                  <td style="font-size:13px;font-weight:700;color:#0F172A;">${cleanName}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#64748B;font-weight:600;">Courriel :</td>
                  <td style="font-size:13px;color:#0F766E;font-weight:700;"><a href="mailto:${cleanEmail}" style="color:#0F766E;text-decoration:none;">${cleanEmail}</a></td>
                </tr>
                ${phone ? `<tr><td style="font-size:12px;color:#64748B;font-weight:600;">Téléphone :</td><td style="font-size:13px;font-weight:700;color:#0F172A;">${phone}</td></tr>` : ''}
                ${userProfile ? `<tr><td style="font-size:12px;color:#64748B;font-weight:600;">Profil :</td><td style="font-size:13px;color:#0F172A;">${userProfile}</td></tr>` : ''}
                ${bookingRef ? `<tr><td style="font-size:12px;color:#64748B;font-weight:600;">Réf. Course :</td><td style="font-size:13px;font-family:monospace;font-weight:700;color:#0F766E;">${bookingRef}</td></tr>` : ''}
              </table>

              <h3 style="margin:0 0 10px;font-size:14px;color:#0F172A;font-weight:800;">Message transmis :</h3>
              <div style="background-color:#F1F5F9;border:1px solid #CBD5E1;border-radius:12px;padding:16px;font-size:14px;line-height:22px;color:#0F172A;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>

              <div style="margin-top:24px;text-align:center;">
                <a href="mailto:${cleanEmail}?subject=Re:%20[Clinigo%20%23${cleanRef}]%20${encodeURIComponent(cleanSubject)}" style="display:inline-block;padding:12px 24px;background-color:#0F766E;color:#FFFFFF;text-decoration:none;font-size:13px;font-weight:800;border-radius:12px;">
                  Répondre à ${cleanName} (${cleanEmail})
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background-color:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;font-size:11px;color:#94A3B8;">
              Message généré par la plateforme Clinigo (clinigo.fr) • Destiné au support régulation : ${recipientEmail}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const payload = JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
        reply_to: cleanEmail,
        subject: `[Support Clinigo #${cleanRef}] ${cleanSubject} — ${cleanName}`,
        html: htmlContent,
        tags: [
          { name: 'category', value: 'contact_form' },
          { name: 'app', value: 'clinigo' }
        ]
      });

      const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const resendReq = https.request(options, (resendRes: any) => {
        let resendBody = '';
        resendRes.on('data', (chunk: any) => { resendBody += chunk; });
        resendRes.on('end', () => {
          try {
            const parsed = JSON.parse(resendBody);
            if (resendRes.statusCode && resendRes.statusCode >= 200 && resendRes.statusCode < 300) {
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, resendId: parsed.id }));
            } else {
              res.statusCode = resendRes.statusCode || 502;
              res.end(JSON.stringify({ error: parsed.message || 'Erreur Resend', details: parsed }));
            }
          } catch {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: 'Réponse Resend invalide' }));
          }
        });
      });

      resendReq.on('error', (err: any) => {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      });

      resendReq.write(payload);
      resendReq.end();
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}


