import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleAiChatMiddleware, handleAiSeoMiddleware, handleBlogMiddleware, handleClientsMiddleware, handleUsersMiddleware } from './src/server/aiDevMiddleware.ts'
import { handleWelcomeEmailMiddleware, handleRideAcceptedEmailMiddleware, handlePasswordResetEmailMiddleware } from './src/server/emailDevMiddleware.ts'
import { handleOtpSendMiddleware, handleOtpVerifyMiddleware } from './src/server/otpDevMiddleware.ts'
import { 
  handleStripeCheckoutSessionMiddleware, 
  handleStripePortalSessionMiddleware, 
  handleStripeWebhookMiddleware, 
  handleStripeSubscriptionStatusMiddleware 
} from './src/server/stripeDevMiddleware.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'ai-chat-dev-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
            const urlPath = (req.url || '').split('?')[0];

            // 1. Desserte directe et prioritaire des images dynamiques créées à chaud
            if (req.method === 'GET' && (urlPath.startsWith('/assets/generated/') || urlPath.startsWith('/assets/gallery/'))) {
              const fs = await import('fs');
              const path = await import('path');
              const localPath = path.join(process.cwd(), 'public', urlPath);
              if (fs.existsSync(localPath)) {
                const ext = path.extname(localPath).toLowerCase();
                const mimes: Record<string, string> = {
                  '.jpg': 'image/jpeg',
                  '.jpeg': 'image/jpeg',
                  '.png': 'image/png',
                  '.webp': 'image/webp',
                  '.svg': 'image/svg+xml'
                };
                res.setHeader('Content-Type', mimes[ext] || 'image/jpeg');
                res.setHeader('Cache-Control', 'public, max-age=3600');
                fs.createReadStream(localPath).pipe(res);
                return;
              }
            }

            if (req.url === '/api/ai/chat' && req.method === 'POST') {
              handleAiChatMiddleware(req, res, apiKey)
              return
            }
            if (req.url === '/api/ai/seo' && req.method === 'POST') {
              handleAiSeoMiddleware(req, res, apiKey)
              return
            }
            if (req.url === '/api/email/welcome' && req.method === 'POST') {
              const resendApiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY
              handleWelcomeEmailMiddleware(req, res, resendApiKey)
              return
            }
            if (req.url === '/api/email/ride-accepted' && req.method === 'POST') {
              const resendApiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY
              handleRideAcceptedEmailMiddleware(req, res, resendApiKey)
              return
            }
            if (req.url === '/api/email/password-reset' && req.method === 'POST') {
              const resendApiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY
              handlePasswordResetEmailMiddleware(req, res, resendApiKey)
              return
            }
            if (req.url === '/api/otp/send' && req.method === 'POST') {
              handleOtpSendMiddleware(req, res)
              return
            }
            if (req.url === '/api/otp/verify' && req.method === 'POST') {
              handleOtpVerifyMiddleware(req, res)
              return
            }
            if (req.url?.startsWith('/api/blog/')) {
              handleBlogMiddleware(req, res)
              return
            }
            if (req.url?.startsWith('/api/clients')) {
              handleClientsMiddleware(req, res)
              return
            }
            if (req.url?.startsWith('/api/users')) {
              handleUsersMiddleware(req, res)
              return
            }
            if (req.url === '/api/stripe/create-checkout-session' && (req.method === 'POST' || req.method === 'OPTIONS')) {
              handleStripeCheckoutSessionMiddleware(req, res)
              return
            }
            if (req.url === '/api/stripe/create-portal-session' && (req.method === 'POST' || req.method === 'OPTIONS')) {
              handleStripePortalSessionMiddleware(req, res)
              return
            }
            if (req.url === '/api/stripe/webhook' && req.method === 'POST') {
              handleStripeWebhookMiddleware(req, res)
              return
            }
            if (req.url?.startsWith('/api/stripe/subscription')) {
              const parsed = new URL(req.url, 'http://localhost:3000');
              handleStripeSubscriptionStatusMiddleware(req, res, parsed);
              return;
            }
            if (req.url === '/api/config/maps-key' && (req.method === 'GET' || req.method === 'HEAD')) {
              const key = (env.VITE_GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '').trim();
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-store');
              res.end(JSON.stringify({ key }));
              return;
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

