import limiter from '@adonisjs/limiter/services/main'
import env from '#start/env'

export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(10).every('1 minute')
})

export const registerThrottle = limiter.define('auth:register', () => {
  const isDev = env.get('NODE_ENV') === 'development' || env.get('NODE_ENV') === 'test'
  const requests = isDev ? 100 : 3
  const duration = isDev ? '1 hour' : '15 minutes'
  const blockDuration = isDev ? '5 minutes' : '30 minutes'

  return limiter.allowRequests(requests).every(duration).blockFor(blockDuration)
})

export const loginThrottle = limiter.define('auth:login', () => {
  const isDev = env.get('NODE_ENV') === 'development' || env.get('NODE_ENV') === 'test'
  const requests = isDev ? 100 : 5
  const duration = isDev ? '1 hour' : '5 minutes'
  const blockDuration = isDev ? '5 minutes' : '15 minutes'

  return limiter.allowRequests(requests).every(duration).blockFor(blockDuration)
})
