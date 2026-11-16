import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

const DEFAULT_DB_URL =
  'postgresql://postgres:postgres@127.0.0.1:5432/postgres?sslmode=disable';

async function applyMigrations() {
  const connectionString = process.env.DATABASE_URL || DEFAULT_DB_URL;
  const migrationsRoot = path.resolve(process.cwd(), 'prisma', 'migrations');

  if (!fs.existsSync(migrationsRoot)) {
    throw new Error(`Migrations directory not found: ${migrationsRoot}`);
  }

  const dirs = fs
    .readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) PRIMARY KEY NOT NULL,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );
    `);

    const appliedRes = await client.query<{
      migration_name: string;
      checksum: string;
    }>(
      `SELECT "migration_name", "checksum" FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL`
    );

    const appliedMap = new Map(
      appliedRes.rows.map((r) => [r.migration_name, r.checksum])
    );

    let appliedCount = 0;

    for (const dirName of dirs) {
      const sqlPath = path.join(migrationsRoot, dirName, 'migration.sql');
      if (!fs.existsSync(sqlPath)) continue;

      const sql = fs.readFileSync(sqlPath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');

      if (appliedMap.has(dirName)) {
        console.log(`[migrate] Already applied: ${dirName}`);
        continue;
      }

      console.log(`[migrate] Applying migration: ${dirName}...`);
      const id = crypto.randomUUID();

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
           VALUES ($1, $2, now(), $3, 1)`,
          [id, checksum, dirName]
        );
        await client.query('COMMIT');
        appliedCount += 1;
        console.log(`[migrate] Applied successfully: ${dirName}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    console.log(
      `[migrate] Done. Newly applied: ${appliedCount}, total migrations: ${dirs.length}.`
    );
  } finally {
    await client.end();
  }
}

applyMigrations().catch((err) => {
  console.error('[migrate] Migration error:', err);
  process.exit(1);
});
