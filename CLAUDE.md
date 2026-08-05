# CLAUDE.md — vibeengineering

Правила работы в этом репозитории живут в [AGENTS.md](AGENTS.md) — читать его целиком
перед первым действием. Этот файл — только указатель, дублировать содержимое сюда не нужно.

Порядок чтения в начале сессии:

1. Портфельный канон — `D:\Code\platform\canon\AGENTS.md` (подключён глобально).
2. [AGENTS.md](AGENTS.md) — что из канона здесь применимо, команды, гейты, конвенции.
3. [MEMORY.md](MEMORY.md) — факты, пережившие сброс контекста.
4. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — карта кода и дизайн-системы.
5. [docs/BACKLOG.md](docs/BACKLOG.md) — известные дефекты и технический долг.
6. [docs/SPEC-hero-truss.md](docs/SPEC-hero-truss.md) — спецификация переделки Hero
   (интерактивная ферма на Canvas 2D). Реализовано.
7. [docs/REPORT-cases-rail.md](docs/REPORT-cases-rail.md) — отчёт по ленте кейсов:
   схема кейса, замеры CLS и веса, открытые вопросы к владельцу.

Короткая версия, если читать больше нечего:

- Стек: Vite + React 18 + TypeScript (strict) + Tailwind + Framer Motion. Статический лендинг.
- Гейт перед «готово»: `npm run build` **и** смоук в браузере на 375 px и десктопе.
- `npm run lint` сломан (eslint не установлен) — не полагаться на него.
- Контент — в `src/data/*.ts`, импорты — через alias `@/`.
- Не коммитить в `main` напрямую, не пушить без спроса.
