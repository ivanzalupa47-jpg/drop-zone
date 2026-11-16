import 'dotenv/config';
import { PrismaClient, Rarity, WeaponKind } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { DEMO_CASES, DEMO_SKINS } from '../src/lib/demo-data';

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/dropzone?schema=public',
});
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

  await prisma.user.upsert({
    where: { username: 'DemoOperator' },
    update: {},
    create: {
      username: 'DemoOperator',
      demoBalance: 5000,
    },
  });

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

  console.log('Seed completed successfully.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
