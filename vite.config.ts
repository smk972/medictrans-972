import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleAiChatMiddleware } from './src/server/aiDevMiddleware'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'ai-chat-dev-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/api/whatsapp/send-otp' && req.method === 'POST') {
              let bodyStr = '';
              req.on('data', chunk => { bodyStr += chunk; });
              req.on('end', async () => {
                try {
                  const { phone, code } = JSON.parse(bodyStr || '{}');
                  const cleanDigits = (phone || '').replace(/\D/g, '');
                  let targetPhone = cleanDigits;
                  if (cleanDigits.startsWith('0696') || cleanDigits.startsWith('0796')) targetPhone = '596' + cleanDigits.slice(1);
                  else if (cleanDigits.startsWith('0690') || cleanDigits.startsWith('0790')) targetPhone = '590' + cleanDigits.slice(1);
                  else if (cleanDigits.startsWith('0694')) targetPhone = '594' + cleanDigits.slice(1);
                  else if (cleanDigits.startsWith('0692') || cleanDigits.startsWith('0693')) targetPhone = '262' + cleanDigits.slice(1);
                  else if (cleanDigits.startsWith('06') || cleanDigits.startsWith('07')) targetPhone = '33' + cleanDigits.slice(1);

                  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID || '1393408537178633';
                  const accessToken = env.WHATSAPP_ACCESS_TOKEN || 'EAAQNZAZAxZCXyABSd7kxlMxu8fSJmHzMA4MZCbkCQbI6ROeJuHXfYxlGmLLWEqA5lu6PffZBY9JGVEG57juFAexn28CBvJYGV0wqXChS3pjWtF3LzV6DCrDVQYUGEG9607ZAVub9PrivrdFLKPUYiCNMd072k57JPpew6U2GMYk0mIJBYPUZBhcdlvAknb55ZBZCFobD4r4fZAtpzKFodJMhugL1EuxOBHFEZByn58uuZCBIDlAr8xzSPdBl1A5jHxxodwubBEj0TSDvCcdqdeBfPnPs';

                  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      messaging_product: "whatsapp",
                      recipient_type: "individual",
                      to: targetPhone,
                      type: "text",
                      text: {
                        preview_url: false,
                        body: `*Clinigo — Transport Médical*\n\nVotre code confidentiel pour débloquer vos 30 jours d'essai gratuit est : *${code}*\n\nEntrez ce code sur votre tableau de bord pour activer immédiatement votre compte.`
                      }
                    })
                  });
                  const data: any = await response.json();
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify({
                    success: response.ok,
                    errorCode: data?.error?.code,
                    error: data?.error?.error_data?.details || data?.error?.message,
                    targetPhone
                  }));
                } catch (e: any) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ success: false, error: e.message }));
                }
              });
              return;
            }

            if (req.url === '/api/ai/chat' && req.method === 'POST') {
              const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
              handleAiChatMiddleware(req, res, apiKey)
              return
            }
            next()
          })
        }
      }
    ],
    server: {
      port: 3000,
    }
  }
})

