import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import env from '#start/env'
import db from '#config/database'
import type { User } from '#database/types'
import { Role, type Tokens } from '@mindlapse/shared'

const JWT_SECRET = env.get('JWT_SECRET')
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

export interface JwtPayload {
  userId: string
  email: string
  role: Role
  organizationId: string
}

export default class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcryptjs.hash(password, 12)
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcryptjs.compare(password, hash)
  }

  static generateTokens(payload: JwtPayload): Tokens {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    })
    const refreshToken = jwt.sign({ userId: payload.userId }, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    })
    return { accessToken, refreshToken }
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  }

  static verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ user: Omit<User, 'password_hash'>; tokens: Tokens }> {
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst()

    if (!user) {
      throw new Error('INVALID_CREDENTIALS')
    }

    const valid = await this.verifyPassword(password, user.password_hash)
    if (!valid) {
      throw new Error('INVALID_CREDENTIALS')
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
    })

    const safeUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      organization_id: user.organization_id,
      created_at: user.created_at,
    }
    return { user: safeUser, tokens }
  }

  static async refreshTokens(refreshToken: string): Promise<Tokens> {
    const payload = this.verifyRefreshToken(refreshToken)

    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', payload.userId)
      .executeTakeFirst()

    if (!user) {
      throw new Error('USER_NOT_FOUND')
    }

    return this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
    })
  }

  static async getUserById(userId: string): Promise<Omit<User, 'password_hash'> | undefined> {
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst()

    if (!user) return undefined

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      organization_id: user.organization_id,
      created_at: user.created_at,
    }
  }
}
