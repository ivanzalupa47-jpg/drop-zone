import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const DEFAULT_DB_URL =
  'postgresql://postgres:postgres@127.0.0.1:5432/postgres?sslmode=disable';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
  txQueue: Promise<unknown> | undefined;
};

function isLocalHostUrl(connectionString: string): boolean {
  try {
    const parsed = new URL(connectionString);
    return (
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === '::1'
    );
  } catch {
    return true;
  }
}

function createPrismaBundle(): { prisma: PrismaClient; pool: Pool } {
  const connectionString = process.env.DATABASE_URL || DEFAULT_DB_URL;
  const configuredMax = process.env.PG_POOL_MAX
    ? Number(process.env.PG_POOL_MAX)
    : isLocalHostUrl(connectionString)
      ? 1
      : 10;

  const pool = new Pool({
    connectionString,
    max: configuredMax,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  return { prisma, pool };
}

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const bundle = createPrismaBundle();
    globalForPrisma.prisma = bundle.prisma;
    globalForPrisma.pgPool = bundle.pool;
  }
  return globalForPrisma.prisma;
}

/**
 * Runs an interactive Prisma transaction.
 * For local single-session PGlite sockets (and high-contention user mutations),
 * chaining onto `txQueue` ensures interactive transactions never interleave on the wire
 * while external PostgreSQL also gets full ACID transactional guarantees.
 */
export async function runDbTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const prisma = getPrismaClient();
  const previous = globalForPrisma.txQueue ?? Promise.resolve();

  let releaseQueue!: () => void;
  const currentGate = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });
  globalForPrisma.txQueue = previous.then(() => currentGate);

  await previous;
  try {
    return await prisma.$transaction(fn, {
      maxWait: 10000,
      timeout: 15000,
    });
  } finally {
    releaseQueue();
  }
}
