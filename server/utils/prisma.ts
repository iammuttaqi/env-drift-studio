import { PrismaClient } from '@prisma/client'
import fs from 'node:fs'
import path from 'node:path'

let prismaInstance: PrismaClient | null = null

export function getPrisma(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance
  }

  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    process.env.NODE_ENV === 'production'

  if (isServerless) {
    const tmpDbPath = '/tmp/envdrift.db'
    if (!fs.existsSync(tmpDbPath)) {
      const candidatePaths = [
        path.resolve(process.cwd(), 'prisma/starter.db'),
        path.resolve(process.cwd(), 'public/starter.db'),
        path.resolve(process.cwd(), 'prisma/dev.db'),
        path.resolve(process.cwd(), '.output/server/prisma/starter.db'),
      ]

      let seeded = false
      for (const src of candidatePaths) {
        if (fs.existsSync(src)) {
          try {
            fs.copyFileSync(src, tmpDbPath)
            seeded = true
            break
          } catch (e) {
            console.warn(`[getPrisma] Could not copy ${src} to /tmp:`, e)
          }
        }
      }

      if (!seeded) {
        try {
          fs.writeFileSync(tmpDbPath, '')
        } catch (e) {
          console.warn('[getPrisma] Could not initialize empty SQLite file in /tmp:', e)
        }
      }
    }
    process.env.DATABASE_URL = `file:${tmpDbPath}`
  } else if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dev.db'
  }

  prismaInstance = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

  return prismaInstance
}

export const prisma = getPrisma()
