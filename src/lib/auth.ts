import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret'

export interface JWTPayload {
  userId: string
  role: string
  email?: string
  phone?: string
}

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10)
}

export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash)
}

export const signToken = (payload: JWTPayload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}
