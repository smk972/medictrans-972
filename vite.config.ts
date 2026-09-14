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

