import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.warn(
      '[prisma] DATABASE_URL is not set — database queries will fail at runtime. ' +
        'Set DATABASE_URL (and DIRECT_URL) in Vercel Project Settings → Environment Variables.'
    )
    // Return a proxy that yields rejected promises instead of throwing
    // synchronously, so `prisma.x.findMany().catch(() => ...)` patterns keep
    // working and pages render fallbacks instead of site-wide 500s.
    const err = () =>
      new Error(
        'DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables and redeploy.'
      )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelProxy: any = new Proxy(() => {}, {
      get(_t, prop) {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          // Allow `await prisma.model.op()` to reject cleanly.
          const rejected = Promise.reject(err())
          // Prevent unhandled rejection warnings when only `.catch` is chained.
          rejected.catch(() => {})
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (rejected as any)[prop].bind(rejected)
        }
        return modelProxy
      },
      apply() {
        return Promise.reject(err())
      },
    })
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === 'then') return undefined
        if (prop === '$connect' || prop === '$disconnect' || prop === '$transaction') {
          return () => Promise.reject(err())
        }
        return modelProxy
      },
    })
  }
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma