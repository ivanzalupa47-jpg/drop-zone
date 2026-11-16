import path from 'node:path';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const host = process.env.PG_HOST || '127.0.0.1';
const port = Number(process.env.PG_PORT || 5432);
const dataDir =
  process.env.PGDATA_DIR || path.resolve(process.cwd(), '.pgdata');

async function main() {
  fs.mkdirSync(dataDir, { recursive: true });

  console.log(`[DROP ZONE PG] Opening persistent PGlite storage at ${dataDir}...`);
  const db = await PGlite.create(dataDir);

  const server = new PGLiteSocketServer({
    db,
    host,
    port,
    maxConnections: 16,
  });

  await server.start();
  console.log(
    `[DROP ZONE PG] PostgreSQL wire-protocol server listening on ${host}:${port}`
  );

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[DROP ZONE PG] Received ${signal}, flushing & closing cleanly...`);
    try {
      await server.stop();
      await db.close();
    } catch (err) {
      console.error('[DROP ZONE PG] Error during shutdown:', err);
    }
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[DROP ZONE PG] Fatal startup error:', err);
  process.exit(1);
});
