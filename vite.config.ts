import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleAiChatMiddleware, handleAiSeoMiddleware } from './src/server/aiDevMiddleware.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'ai-chat-dev-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
            if (req.url === '/api/ai/chat' && req.method === 'POST') {
              handleAiChatMiddleware(req, res, apiKey)
              return
            }
            if (req.url === '/api/ai/seo' && req.method === 'POST') {
              handleAiSeoMiddleware(req, res, apiKey)
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

