const ACCESS_TOKEN_KEY = 'mindlapse_access_token'
const REFRESH_TOKEN_KEY = 'mindlapse_refresh_token'

export const authStorage = {
  // Access Token (sessionStorage pour plus de sécurité)
  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY)
  },

  setAccessToken(token: string): void {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
  },

  removeAccessToken(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },

  removeRefreshToken(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken)
    this.setRefreshToken(refreshToken)
  },

  clearTokens(): void {
    this.removeAccessToken()
    this.removeRefreshToken()
  },

  hasTokens(): boolean {
    return !!this.getAccessToken() || !!this.getRefreshToken()
  },
}
