# drop-zone
DROP ZONE CS2 Website

---

## О платформе (`DEMO_MODE=true`)

Современная веб-платформа открытия кейсов и апгрейда скинов **CS2**, построенная на **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **Framer Motion** и **Prisma + PostgreSQL**.

> **Важно:** по умолчанию активирован режим `DEMO_MODE=true`. Реальные денежные операции, платежи и выводы полностью отключены — все механики работают исключительно на виртуальных демо-кредитах **DZ**.

## Стек технологий

- **Framework:** Next.js 14 (App Router)
- **Язык:** TypeScript (`strict: true`)
- **Стилизация:** Tailwind CSS
- **Анимации:** Framer Motion (живая лента дропов, рулетка кейсов, колесо апгрейда)
- **ORM и БД:** Prisma + PostgreSQL (`@prisma/adapter-pg`)
- **Режим работы:** `DEMO_MODE=true` (автономный демо-каталог + готовность к PostgreSQL)

## Архитектура проекта

```text
drop-zone/
├── prisma/
│   ├── schema.prisma        # Модели PostgreSQL (User, Case, Skin, CaseItem, InventoryItem, DropLog, UpgradeLog)
│   └── seed.ts              # Наполнение БД стартовым демо-каталогом
├── prisma.config.ts         # Конфигурация Prisma 7 для PostgreSQL
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cases/       # GET /api/cases — каталог кейсов
│   │   │   └── health/      # GET /api/health — статус платформы и DEMO_MODE
│   │   ├── cases/[slug]/    # Интерактивная страница открытия кейса
│   │   ├── inventory/       # Виртуальный демо-инвентарь пользователя
│   │   ├── upgrade/         # Лаборатория демо-апгрейда скинов
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx         # Главная страница DROP ZONE
│   ├── components/
│   │   ├── cases/           # HeroBanner, CaseCard, CaseCatalog, CaseOpeningArena
│   │   ├── layout/          # LiveDropsTicker, Navbar, Footer
│   │   └── ui/              # Векторные иллюстрации скинов и кейсов CS2
│   ├── context/
│   │   └── DemoStateContext.tsx # Управление демо-балансом DZ, инвентарём и live-лентой
│   ├── lib/
│   │   ├── repositories/    # Переключение DEMO_MODE <-> Prisma PostgreSQL
│   │   ├── case-engine.ts   # Взвешенный расчёт выпадения и генерация ленты рулетки
│   │   ├── config.ts        # Конфигурация приложения и редкостей CS2
│   │   ├── demo-data.ts     # Стартовый каталог кейсов и скинов
│   │   └── prisma.ts        # Singleton-клиент Prisma (PostgreSQL)
│   └── types/
│       └── index.ts         # Доменные типы TypeScript
└── .env.example             # Шаблон переменных окружения
```

## Быстрый старт

1. Скопируйте `.env.example` в `.env`:
   ```bash
   cp .env.example .env
   ```
2. Установите зависимости и сгенерируйте Prisma Client:
   ```bash
   npm install
   npm run db:generate
   ```
3. Запустите dev-сервер:
   ```bash
   npm run dev
   ```

## Команды проверки

- `npm run db:validate` — валидация схемы Prisma (`PostgreSQL`)
- `npm run typecheck` — проверка типов TypeScript
- `npm run lint` — проверка ESLint
- `npm run build` — production-сборка Next.js 14
