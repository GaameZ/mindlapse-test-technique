import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import helmet from 'helmet'

export default class SecurityHeadersMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const helmetMiddleware = helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      // Strict Transport Security (HSTS)
      hsts: {
        maxAge: 31536000, // 1 an
        includeSubDomains: true,
        preload: true,
      },
      // X-Frame-Options
      frameguard: {
        action: 'deny',
      },
      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      // Permissions Policy
      permittedCrossDomainPolicies: {
        permittedPolicies: 'none',
      },
    })

    // Wrapper pour adapter Helmet à AdonisJS
    return new Promise<void>((resolve, reject) => {
      helmetMiddleware(ctx.request.request, ctx.response.response, (error?: unknown) => {
        if (error) {
          reject(error)
        } else {
          next()
            .then(() => resolve())
            .catch(reject)
        }
      })
    })
  }
}
