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

export function handleRideAcceptedEmailMiddleware(req: any, res: any, resendApiKey?: string) {
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
        transporterName,
        driverName,
        driverPhone,
        vehiclePlate,
        pickupAddress,
        dropoffAddress,
        pickupDate,
        pickupTime,
        trackingUrl
      } = data;

      if (!email || !email.includes('@')) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Adresse email valide requise pour notifier le patient' }));
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPatient = (patientName || 'Cher patient').trim();
      const cleanRef = reference || 'MT-972';
      const cleanTransporter = transporterName || 'Ambulances Agréées Clinigo';
      const cleanDriver = driverName || 'Chauffeur Régulé';
      const cleanPlate = vehiclePlate || 'Véhicule Conventionné';
      const cleanTime = pickupTime || '08:30';
      const cleanDate = pickupDate || 'Aujourd’hui';
      const trackLink = trackingUrl || `https://clinigo.fr/suivi?ref=${cleanRef}`;

      const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Transport Confirmé #${cleanRef}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#FFFFFF;border-radius:24px;border:1px solid #E2E8F0;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #002D52 0%, #004479 100%);padding:36px 32px;text-align:center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <span style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.15);border-radius:9999px;color:#A7F3D0;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
                      ✓ Course Acceptée & Validée
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                      Votre transporteur est confirmé
                    </h1>
                    <p style="margin:8px 0 0 0;color:#BAE6FD;font-size:14px;font-weight:500;">
                      Demande N° <strong>#${cleanRef}</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#334155;">
                Bonjour <strong>${cleanPatient}</strong>,
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:24px;color:#334155;">
                Bonne nouvelle ! Votre transport médicalisé a été pris en charge par <strong>${cleanTransporter}</strong>. Voici les détails de votre course :
              </p>

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

              <!-- Journey Summary -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:20px;margin-bottom:28px;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">
                      Récapitulatif du Trajet
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
                        <td style="color:#004479;font-weight:700;padding-bottom:8px;">${dropoffAddress || 'Centre Hospitalier'}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color:#64748B;">🛡️ Prise en charge :</td>
                        <td style="color:#059669;font-weight:700;">Tiers-Payant CPAM 100% (ALD)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${trackLink}" style="display:inline-block;padding:14px 32px;background:#004479;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;border-radius:12px;box-shadow:0 4px 12px rgba(0,68,121,0.25);">
                      Accéder au Suivi en Direct →
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:14px;font-size:12px;color:#92400E;line-height:18px;">
                ℹ️ <strong>Rappel utile :</strong> Veuillez préparer votre <strong>Prescription Médicale de Transport (PMT Cerfa)</strong> et votre <strong>Carte Vitale</strong> à présenter au chauffeur lors de la prise en charge.
              </div>
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

      console.log(`[EmailMiddleware] Envoi de l'email d'acceptation de course à ${cleanEmail} (Réf #${cleanRef})...`);

      const payload = JSON.stringify({
        from: fromEmail,
        to: [cleanEmail],
        subject: `Transport Confirmé #${cleanRef} par ${cleanTransporter} 🚑`,
        html: htmlContent,
        tags: [
          { name: 'category', value: 'ride_accepted' },
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
              console.log(`[EmailMiddleware] Email d'acceptation envoyé avec succès ! ID: ${parsed.id}`);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, resendId: parsed.id }));
            } else {
              console.error(`[EmailMiddleware] Erreur Resend acceptation (${resendRes.statusCode}):`, resendBody);
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
      console.error('[EmailMiddleware] Erreur interne acceptation:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message || 'Erreur serveur interne' }));
    }
  });
}

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

