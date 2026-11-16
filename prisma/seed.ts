import 'dotenv/config';
import { PrismaClient, Rarity, WeaponKind } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  DEMO_CASES,
  DEMO_SKINS,
  INITIAL_LIVE_DROPS,
} from '../src/lib/demo-data';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@127.0.0.1:5432/postgres?sslmode=disable';

const pool = new Pool({ connectionString, max: 1 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const rarityMap: Record<string, Rarity> = {
  MIL_SPEC: Rarity.MIL_SPEC,
  RESTRICTED: Rarity.RESTRICTED,
  CLASSIFIED: Rarity.CLASSIFIED,
  COVERT: Rarity.COVERT,
  SPECIAL_GOLD: Rarity.SPECIAL_GOLD,
};

const kindMap: Record<string, WeaponKind> = {
  RIFLE: WeaponKind.RIFLE,
  SNIPER: WeaponKind.SNIPER,
  PISTOL: WeaponKind.PISTOL,
  SMG: WeaponKind.SMG,
  KNIFE: WeaponKind.KNIFE,
  GLOVES: WeaponKind.GLOVES,
};

async function main() {
  console.log('Seeding DROP ZONE PostgreSQL database (Demo catalog)...');

  for (const skin of DEMO_SKINS) {
    await prisma.skin.upsert({
      where: { slug: skin.slug },
      update: {
        weapon: skin.weapon,
        skinName: skin.skinName,
        kind: kindMap[skin.kind],
        rarity: rarityMap[skin.rarity],
        demoValue: skin.demoValue,
        wearLabel: skin.wearLabel,
        accentHex: skin.accentHex,
      },
      create: {
        slug: skin.slug,
        weapon: skin.weapon,
        skinName: skin.skinName,
        kind: kindMap[skin.kind],
        rarity: rarityMap[skin.rarity],
        demoValue: skin.demoValue,
        wearLabel: skin.wearLabel,
        accentHex: skin.accentHex,
      },
    });
  }

  for (const [idx, c] of DEMO_CASES.entries()) {
    const createdCase = await prisma.case.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        subtitle: c.subtitle,
        category: c.category,
        demoPrice: c.demoPrice,
        accentColor: c.accentColor,
        badge: c.badge ?? null,
        isFeatured: Boolean(c.isFeatured),
        sortOrder: idx,
      },
      create: {
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        category: c.category,
        demoPrice: c.demoPrice,
        accentColor: c.accentColor,
        badge: c.badge ?? null,
        isFeatured: Boolean(c.isFeatured),
        sortOrder: idx,
      },
    });

    for (const item of c.items) {
      const dbSkin = await prisma.skin.findUnique({
        where: { slug: item.skin.slug },
      });
      if (!dbSkin) continue;

      await prisma.caseItem.upsert({
        where: {
          caseId_skinId: {
            caseId: createdCase.id,
            skinId: dbSkin.id,
          },
        },
        update: { dropChance: item.dropChance },
        create: {
          caseId: createdCase.id,
          skinId: dbSkin.id,
          dropChance: item.dropChance,
        },
      });
    }
  }

  const existingDrops = await prisma.dropLog.count();
  if (existingDrops === 0) {
    const allCases = await prisma.case.findMany();
    const allSkins = await prisma.skin.findMany();

    for (const sample of [...INITIAL_LIVE_DROPS].reverse()) {
      const botUser = await prisma.user.upsert({
        where: { username: sample.username },
        update: {},
        create: {
          username: sample.username,
          demoBalance: 5000,
        },
      });
      const matchedCase =
        allCases.find((c) => c.title === sample.caseTitle) ?? allCases[0];
      const matchedSkin =
        allSkins.find((s) => s.slug === sample.skin.slug) ?? allSkins[0];

      if (matchedCase && matchedSkin) {
        await prisma.dropLog.create({
          data: {
            userId: botUser.id,
            caseId: matchedCase.id,
            skinId: matchedSkin.id,
            rollSeed: `dz_seed_init_${sample.id}`,
          },
        });
      }
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
