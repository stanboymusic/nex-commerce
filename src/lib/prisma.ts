import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

let prisma: PrismaClient

export default new Proxy({} as any, {
  get(target, prop) {
    if (!prisma) {
      prisma = new PrismaClient()
      if (process.env.NODE_ENV !== 'production') {
        globalThis.prisma = prisma
      }
    }
    return (prisma as any)[prop]
  },
}) as PrismaClient
