import type { JwtPayload } from '#services/auth_service'

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    auth?: {
      user: JwtPayload
      isAuthenticated: true
    }
    supplierId?: string
  }
}
