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
  const apiKey = resendApiKey || process.env.RESEND_API_KEY || '';
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
