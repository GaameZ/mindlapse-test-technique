import { defineConfig } from '@adonisjs/cors'
import env from '#start/env'
import app from '@adonisjs/core/services/app'

const allowedOrigins = env.get('CORS_ALLOWED_ORIGINS')
  ? env.get('CORS_ALLOWED_ORIGINS')!.split(',')
  : ['http://localhost:5173']

const corsConfig = defineConfig({
  enabled: true,
  origin: (origin) => {
    if (!origin) {
      return !app.inProduction
    }

    return allowedOrigins.includes(origin)
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-Total-Count'],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
