import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function cleanDatabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  let stripped = rawUrl.replace(/^["']|["']$/g, '').trim();
  if (stripped.startsWith('postgres://')) {
    stripped = 'postgresql://' + stripped.substring(11);
  }
  // Optimize Supabase Connection Pooler for Vercel Serverless Lambdas
  if (stripped.includes('pooler.supabase.com') && !stripped.includes('connection_limit')) {
    const separator = stripped.includes('?') ? '&' : '?';
    stripped += `${separator}connection_limit=5&pool_timeout=10`;
  }
  return stripped;
}

const dbUrl = cleanDatabaseUrl(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
