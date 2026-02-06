import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import env from '#start/env'
import db from '#config/database'
import type { User } from '#database/types'
import { Role } from '@mindlapse/shared'

const JWT_SECRET = env.get('JWT_SECRET')
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

export interface JwtPayload {
  userId: string
  email: string
  role: Role
  organizationId: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export default class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcryptjs.hash(password, 12)
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcryptjs.compare(password, hash)
  }

  static generateTokens(payload: JwtPayload): AuthTokens {
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

  static async register(data: {
    email: string
    password: string
    fullName: string
    role: Role
    organizationId: string
  }): Promise<{ user: Omit<User, 'password_hash'>; tokens: AuthTokens }> {
    const passwordHash = await this.hashPassword(data.password)

    const user = await db
      .insertInto('users')
      .values({
        email: data.email,
        password_hash: passwordHash,
        full_name: data.fullName,
        role: data.role,
        organization_id: data.organizationId,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
    })

    const { password_hash: _, ...safeUser } = user
    return { user: safeUser, tokens }
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ user: Omit<User, 'password_hash'>; tokens: AuthTokens }> {
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

    const { password_hash: _, ...safeUser } = user
    return { user: safeUser, tokens }
  }

  static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
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

    const { password_hash: _, ...safeUser } = user
    return safeUser
  }
}
