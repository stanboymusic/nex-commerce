import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret'

export interface JWTPayload {
  userId: string
  role: string
  email?: string
  phone?: string
}

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}
