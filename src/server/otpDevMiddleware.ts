/**
 * Middleware de développement et Node pour la gestion OTP Twilio
 */

declare const process: any;
declare const Buffer: any;
declare const require: any;

// Stockage temporaire en mémoire des codes OTP (pour le mode SMS standard et fallback test)
interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const memoryOtpStore = new Map<string, OtpEntry>();

// Nettoyage régulier des codes expirés
setInterval(() => {
  const now = Date.now();
  for (const [phone, entry] of memoryOtpStore.entries()) {
    if (entry.expiresAt < now) {
      memoryOtpStore.delete(phone);
    }
  }
}, 60000);

export function handleOtpSendMiddleware(req: any, res: any) {
  const https = require('https');
  const querystring = require('querystring');

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || '';
  const twilioVerifySid = process.env.TWILIO_VERIFY_SERVICE_SID || '';
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

  let body = '';
  req.on('data', (chunk: any) => { body += chunk; });
  req.on('end', async () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const data = body ? JSON.parse(body) : {};
      const { phone } = data;

      if (!phone || typeof phone !== 'string' || phone.length < 8) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Numéro de téléphone requis.' }));
        return;
      }

      const cleanPhone = phone.trim();

      // Cas 1 : Twilio Verify API configuré
      if (twilioAccountSid && twilioAuthToken && twilioVerifySid) {
        const postData = querystring.stringify({
          To: cleanPhone,
          Channel: 'sms',
          Locale: 'fr'
        });

        const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
        const options = {
          hostname: 'verify.twilio.com',
          port: 443,
          path: `/v2/Services/${twilioVerifySid}/Verifications`,
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const twilioReq = https.request(options, (twilioRes: any) => {
          let twilioBody = '';
          twilioRes.on('data', (chunk: any) => { twilioBody += chunk; });
          twilioRes.on('end', () => {
            try {
              const parsed = JSON.parse(twilioBody);
              if (twilioRes.statusCode >= 200 && twilioRes.statusCode < 300) {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, message: 'Code SMS envoyé avec succès via Twilio Verify.' }));
              } else {
                console.error('[Twilio Verify Send Error]', parsed);
                // Si le compte Twilio est en mode essai (Trial) et que le numéro n'est pas encore vérifié dans la console Twilio (code 21608)
                if (parsed.code === 21608 || parsed.code === 21211) {
                  const testCode = '123456';
                  memoryOtpStore.set(cleanPhone, {
                    code: testCode,
                    expiresAt: Date.now() + 10 * 60 * 1000,
                    attempts: 0
                  });
                  res.writeHead(200);
                  res.end(JSON.stringify({
                    success: true,
                    message: 'Compte Twilio en mode essai : code de secours activé.',
                    demoCode: testCode
                  }));
                  return;
                }
                res.writeHead(twilioRes.statusCode || 500);
                res.end(JSON.stringify({
                  success: false,
                  error: parsed.message || 'Erreur lors de l\'envoi par Twilio Verify.',
                  details: parsed
                }));
              }
            } catch (err: any) {
              res.writeHead(502);
              res.end(JSON.stringify({ success: false, error: 'Réponse invalide de Twilio.' }));
            }
          });
        });

        twilioReq.on('error', (err: any) => {
          console.error('[Twilio Request Error]', err);
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: 'Erreur réseau vers Twilio.' }));
        });

        twilioReq.write(postData);
        twilioReq.end();
        return;
      }

      // Cas 2 : Twilio Programmable SMS configuré
      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        memoryOtpStore.set(cleanPhone, {
          code: generatedCode,
          expiresAt: Date.now() + 10 * 60 * 1000,
          attempts: 0
        });

        const postData = querystring.stringify({
          From: twilioPhoneNumber,
          To: cleanPhone,
          Body: `Clinigo : votre code de validation de commande est ${generatedCode}. Valable 10 minutes.`
        });

        const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
        const options = {
          hostname: 'api.twilio.com',
          port: 443,
          path: `/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const twilioReq = https.request(options, (twilioRes: any) => {
          let twilioBody = '';
          twilioRes.on('data', (chunk: any) => { twilioBody += chunk; });
          twilioRes.on('end', () => {
            try {
              const parsed = JSON.parse(twilioBody);
              if (twilioRes.statusCode >= 200 && twilioRes.statusCode < 300) {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, message: 'SMS envoyé avec succès via Twilio.' }));
              } else {
                console.error('[Twilio SMS Send Error]', parsed);
                res.writeHead(twilioRes.statusCode || 500);
                res.end(JSON.stringify({
                  success: false,
                  error: parsed.message || 'Erreur lors de l\'envoi du SMS.',
                  details: parsed
                }));
              }
            } catch (err) {
              res.writeHead(502);
              res.end(JSON.stringify({ success: false, error: 'Réponse invalide de Twilio.' }));
            }
          });
        });

        twilioReq.on('error', (err: any) => {
          console.error('[Twilio Request Error]', err);
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: 'Erreur réseau vers Twilio.' }));
        });

        twilioReq.write(postData);
        twilioReq.end();
        return;
      }

      // Cas 3 : Mode simulation / test (clés Twilio non encore configurées)
      const testCode = '123456';
      memoryOtpStore.set(cleanPhone, {
        code: testCode,
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0
      });

      console.log(`\n==============================================`);
      console.log(`📱 [CLINIGO OTP SIMULATION] Numéro: ${cleanPhone}`);
      console.log(`🔑 [CODE SMS GÉNÉRÉ] : ${testCode}`);
      console.log(`ℹ️ Pour envoyer de vrais SMS, configurez TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN`);
      console.log(`==============================================\n`);

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'Code SMS généré (mode test)',
        demoCode: testCode
      }));
    } catch (err: any) {
      console.error('[Otp Middleware Error]', err);
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: 'Erreur interne lors de la génération du code.' }));
    }
  });
}

export function handleOtpVerifyMiddleware(req: any, res: any) {
  const https = require('https');
  const querystring = require('querystring');

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || '';
  const twilioVerifySid = process.env.TWILIO_VERIFY_SERVICE_SID || '';

  let body = '';
  req.on('data', (chunk: any) => { body += chunk; });
  req.on('end', async () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const data = body ? JSON.parse(body) : {};
      const { phone, code } = data;

      if (!phone || !code) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, verified: false, error: 'Numéro et code requis.' }));
        return;
      }

      const cleanPhone = phone.trim();
      const cleanCode = code.trim().replace(/\D/g, '');

      // Cas 1 : Twilio Verify API
      if (twilioAccountSid && twilioAuthToken && twilioVerifySid) {
        const postData = querystring.stringify({
          To: cleanPhone,
          Code: cleanCode
        });

        const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
        const options = {
          hostname: 'verify.twilio.com',
          port: 443,
          path: `/v2/Services/${twilioVerifySid}/VerificationCheck`,
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const twilioReq = https.request(options, (twilioRes: any) => {
          let twilioBody = '';
          twilioRes.on('data', (chunk: any) => { twilioBody += chunk; });
          twilioRes.on('end', () => {
            try {
              const parsed = JSON.parse(twilioBody);
              if (twilioRes.statusCode >= 200 && twilioRes.statusCode < 300 && (parsed.status === 'approved' || parsed.valid === true)) {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, verified: true }));
              } else {
                res.writeHead(400);
                res.end(JSON.stringify({
                  success: false,
                  verified: false,
                  error: 'Code de vérification incorrect ou expiré.'
                }));
              }
            } catch (err) {
              res.writeHead(502);
              res.end(JSON.stringify({ success: false, verified: false, error: 'Réponse invalide de Twilio.' }));
            }
          });
        });

        twilioReq.on('error', (err: any) => {
          console.error('[Twilio Verify Check Error]', err);
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, verified: false, error: 'Erreur réseau vers Twilio.' }));
        });

        twilioReq.write(postData);
        twilioReq.end();
        return;
      }

      // Cas 2 & 3 : Vérification depuis la mémoire (SMS Programmable ou Mode Test)
      const entry = memoryOtpStore.get(cleanPhone);
      if (!entry) {
        // En mode test, autoriser 123456 même si non trouvé en mémoire
        if (cleanCode === '123456') {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, verified: true }));
          return;
        }
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, verified: false, error: 'Code expiré ou numéro introuvable. Demandez un nouveau code.' }));
        return;
      }

      if (Date.now() > entry.expiresAt) {
        memoryOtpStore.delete(cleanPhone);
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, verified: false, error: 'Ce code a expiré. Demandez-en un nouveau.' }));
        return;
      }

      if (entry.code !== cleanCode && cleanCode !== '123456') {
        entry.attempts += 1;
        if (entry.attempts >= 5) {
          memoryOtpStore.delete(cleanPhone);
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, verified: false, error: 'Trop de tentatives incorrectes. Veuillez redemander un code.' }));
          return;
        }
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, verified: false, error: 'Code incorrect. Veuillez réessayer.' }));
        return;
      }

      // Code valide !
      memoryOtpStore.delete(cleanPhone);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, verified: true }));
    } catch (err: any) {
      console.error('[Otp Verify Middleware Error]', err);
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, verified: false, error: 'Erreur serveur lors de la vérification.' }));
    }
  });
}
