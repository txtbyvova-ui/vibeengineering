# Архитектура — Vibe Engineering Landing

Карта проекта для тех, кто (или что) заходит в репозиторий без контекста.
Статус на 2026-08-05: один коммит `14381b2 Initial commit`, ветка `main`,
remote `github.com/txtbyvova-ui/vibeengineering`.

---

## 1. Что это

Одностраничный B2B-лендинг инженерного бюро, которое перешло из оффлайн-стройки
(порталы, металлоконструкции, BIM) в веб-разработку и AI-интеграции. Задача сайта —
одна: довести посетителя до Telegram/почты. Никакой формы, бэкенда и CMS нет,
лид уходит по внешней ссылке.

Дизайн-язык — «Industrial Premium»: чёрный фон, единственный акцент `#FF4F00`,
крупная display-типографика на весь вьюпорт, hairline-сетка вместо карточек с тенями,
контурный (hollow) текст, промышленная мono-разметка подписей.

**Ценообразования на странице нет намеренно** — «Цену обсудим в личке»
([Process.tsx:47](../src/components/Process.tsx:47)). Это продуктовое решение, не упущение.

## 2. Стек

| Слой | Технология | Роль |
|------|-----------|------|
| Сборка | Vite 5 (`@vitejs/plugin-react`) | dev-сервер, prod-бандл, alias `@ → ./src` |
| UI | React 18 + TypeScript 5.5 (`strict`) | 8 секций-компонентов, без роутера и state-менеджера |
| Стили | Tailwind CSS 3.4 + PostCSS | дизайн-токены в конфиге, примитивы в `@layer components` |
| Анимация | Framer Motion 11 | только entry/scroll-анимации, интерактивной анимации нет |
| Шрифты | Clash Display (Fontshare), Space Grotesk + JetBrains Mono (Google Fonts) | подключены `<link>` из `index.html` |

Runtime-зависимостей ровно три: `react`, `react-dom`, `framer-motion`.
Ни роутера, ни fetch-слоя, ни аналитики.

## 3. Карта репозитория

```
vibeengineering/
├── index.html                  # <head>: title, description, OG, шрифты; <div id="root">
├── vite.config.ts              # plugin-react + alias "@" -> ./src
├── tsconfig.json               # strict, noUnusedLocals/Parameters, paths "@/*"
├── tailwind.config.js          # ЕДИНСТВЕННЫЙ источник дизайн-токенов
├── postcss.config.js           # tailwindcss + autoprefixer
├── package.json                # dev / build / preview / typecheck / lint*
├── docs/
│   ├── ARCHITECTURE.md         # этот файл
│   └── BACKLOG.md              # приоритизированные технические долги
├── tools/
│   └── rag.config.json         # конфиг локального RAG-индекса
└── src/
    ├── main.tsx                # ReactDOM.createRoot + StrictMode
    ├── App.tsx                 # композиция секций, фоновая .bg-grid
    ├── index.css               # @layer base (сброс, ::selection) + @layer components (примитивы)
    ├── vite-env.d.ts
    ├── types/index.ts          # CaseStudy, TeamMember, ProcessStep, Client, ContactLink, Metric
    ├── data/                   # контент, отделённый от разметки
    │   ├── cases.ts            # 4 кейса
    │   ├── team.ts             # 2 основателя
    │   ├── process.ts          # 4 шага методологии
    │   └── clients.ts          # 8 логотипов для marquee
    └── components/
        ├── Nav.tsx             # fixed + mix-blend-difference, реагирует на scrollY > 24
        ├── Hero.tsx            # h1 + CTA, единственный h1 на странице
        ├── Marquee.tsx         # бесконечная лента клиентов (CSS-анимация, не JS)
        ├── USP.tsx             # 3 преимущества  (данные ИНЛАЙН в компоненте)
        ├── Cases.tsx           # сетка кейсов 2×N
        ├── Process.tsx         # 4 шага + оффер-цитата
        ├── Team.tsx            # 2 карточки основателей
        ├── Contact.tsx         # ссылки, финальный оффер, <footer> (данные ИНЛАЙН)
        └── ui/RevealText.tsx   # ЕДИНСТВЕННЫЙ переиспользуемый примитив
```

`*` про скрипт `lint` — см. [BACKLOG.md](BACKLOG.md), он объявлен, но нерабочий.

## 4. Сборка и запуск

```bash
npm install
```

| Команда | Что делает | Проверено 2026-08-05 |
|---------|-----------|----------------------|
| `npm run dev` | Vite dev-сервер, http://localhost:5173 | — |
| `npm run typecheck` | `tsc --noEmit` | ✅ без ошибок |
| `npm run build` | `tsc --noEmit && vite build` | ✅ 400 модулей, ~5.3 с |
| `npm run preview` | превью прод-сборки | — |
| `npm run lint` | `eslint .` | ❌ eslint не установлен и не сконфигурирован |

Прод-бандл (замер 2026-08-05):

```
dist/index.html                   1.79 kB │ gzip:  0.89 kB
dist/assets/index-*.css          14.13 kB │ gzip:  3.65 kB
dist/assets/index-*.js          270.44 kB │ gzip: 88.07 kB
```

88 КБ gzip JS для статического лендинга — это почти целиком React + Framer Motion.
Ориентир при любых правках: цифра не должна расти.

## 5. Поток данных

Однонаправленный и полностью статический — никакого рантайм-фетча:

```
src/types/index.ts   объявляет форму
        ↓
src/data/*.ts        типизированные константы (import type { CaseStudy } from "@/types")
        ↓
src/components/*.tsx рендер через .map(), key = стабильное поле (title / name / num)
        ↓
src/App.tsx          фиксированный порядок секций
```

**Правило репозитория:** контент живёт в `src/data/*`, разметка — в компонентах.
Правка текстов не должна затрагивать `.tsx`.

⚠️ Правило нарушено в двух местах — данные объявлены прямо в компоненте:
[USP.tsx:12](../src/components/USP.tsx:12) (`points`) и
[Contact.tsx:7](../src/components/Contact.tsx:7) (`links`). Это расхождение
с README и с остальными секциями, см. BACKLOG.

Порядок секций задаётся только в [App.tsx](../src/App.tsx:15):
`Nav → Hero → Marquee → USP → Cases → Process → Team → Contact`.
Якоря для навигации: `#top` (Hero), `#work` (Cases), `#process`, `#team`, `#contact`.

## 6. Дизайн-система

### 6.1 Токены — [tailwind.config.js](../tailwind.config.js)

| Категория | Токен | Значение | Где применяется |
|-----------|-------|----------|-----------------|
| Цвет | `bg` | `#0D0D0D` | фон страницы |
| Цвет | `surface` | `#1A1A1A` | **не используется нигде** |
| Цвет | `accent` | `#FF4F00` | CTA, метрики, hover, курсорные акценты |
| Цвет | `textMain` | `#F4F4F0` | основной текст |
| Цвет | `textMuted` | `#888888` | вторичный текст, подписи |
| Бордер | `hairline` | `rgba(255,255,255,0.08)` | все разделители (`border-hairline`) |
| Шрифт | `display` | Clash Display | заголовки, метрики, цитаты |
| Шрифт | `sans` | Space Grotesk | абзацы (дефолт `body`) |
| Шрифт | `mono` | JetBrains Mono | подписи, теги, кнопки, футер |
| Трекинг | `tightest` / `display` | `-0.04em` / `-0.03em` | display-заголовки |
| Easing | `premium` | `cubic-bezier(0.16, 1, 0.3, 1)` | `ease-premium` в hover-переходах |
| Анимация | `marquee` | 28 s linear infinite | лента клиентов |
| Анимация | `pulseDot` | 1.4 s ease-in-out infinite | «живая» точка в Hero |

Акцент задан **дважды**: как Tailwind-токен `accent` и как CSS-переменная
`--accent` в [index.css:7](../src/index.css:7). CSS-переменная нужна там, где
Tailwind не достаёт (`-webkit-text-stroke`, `::selection`). При смене цвета
править надо оба места — это известная ловушка.

### 6.2 CSS-примитивы — [index.css](../src/index.css) `@layer components`

| Класс | Что делает |
|-------|-----------|
| `.bg-grid` | фиксированная сетка 4rem на весь экран, `z-index: -1`, анимация `gridShift` 20 s |
| `.text-hollow` | контурный текст акцентом, заливается акцентом на hover |
| `.text-hollow-white` | контурный белым (35 %), на hover заливается акцентом |
| `.mono-label` | стандартная mono-подпись секции (11px / uppercase / tracking 0.18em) |
| `.btn-fill` | заливка снизу вверх через `::before` + `scaleY` |
| `.hairline` | **мёртвый класс** — везде применяется Tailwind-токен `border-hairline` |

Плюс глобально: скрытый скроллбар, `scroll-behavior: smooth`, кастомный `::selection`.

### 6.3 Повторяющиеся паттерны разметки

Три секции (`Cases`, `Process`, `Team`) используют один и тот же заголовок:
`flex items-end justify-between border-b border-hairline pb-6` + `h2` слева
+ `.mono-label` с ромбом `◆` справа. Компонента для него нет — паттерн скопирован
трижды. Кандидат №1 на извлечение в `ui/SectionHeader.tsx`.

## 7. Анимационная модель

Единая easing-кривая `[0.16, 1, 0.3, 1]` (out-expo) объявлена **пять раз** —
константа `EASE` продублирована в `Hero`, `USP`, `Cases`, `Process`, `Team`,
`Contact` и `RevealText`, плюс тот же кубик в `tailwind.config.js` и в `index.css`.

Два способа анимации, оба на въезд, ни один не реагирует на действия пользователя:

1. **`RevealText`** ([ui/RevealText.tsx](../src/components/ui/RevealText.tsx)) —
   маска: внешний `<span>` с `overflow-hidden`, внутри `motion`-элемент едет
   с `y: 110%` в `y: 0%`. Пропсы: `delay` (стаггер), `duration`, `as`, `className`.
   Используется для пословного раскрытия заголовков.
2. **Прямой `motion.*`** с `initial` + `whileInView` + `viewport={{ once: true, margin: "-10%..-15%" }}` —
   для карточек и абзацев. Стаггер задаётся `delay: i * 0.06…0.1`.

В Hero на `animate` (без ожидания вьюпорта) идут только микро-лейбл и абзац с CTA —
[Hero.tsx:14](../src/components/Hero.tsx:14) и [Hero.tsx:46](../src/components/Hero.tsx:46).
**Сам h1 собран из шести `RevealText`, то есть тоже ждёт `whileInView`** и стартует
скрытым (`y: 110%` внутри `overflow-hidden`). Практическое следствие — LCP-элемент
страницы не рисуется, пока не выполнится JS-бандл: см. [BACKLOG.md](BACKLOG.md) §12.

**Ни одна анимация не уважает `prefers-reduced-motion`** — ни marquee, ни `gridShift`,
ни `pulseDot`, ни smooth scroll, ни Framer Motion (замер: 0 таких правил из 191).
Это самый крупный системный пробел, см. [BACKLOG.md](BACKLOG.md) §1.

Маска `RevealText` при `leading < 1` **срезает выносные элементы глифов** — замерено
3.88 px на h1 (маска 66.23 px, ink-бокс 70.12 px). См. [BACKLOG.md](BACKLOG.md) §2.

## 8. Конвенции кода

- **Импорты только через alias `@/`** — относительных `../` в `src/` нет ни одного.
  Alias объявлен дважды: [vite.config.ts](../vite.config.ts:8) (рантайм) и
  [tsconfig.json](../tsconfig.json:24) (типы). Менять надо оба.
- **Один компонент = одна секция = `export default`**. Именованных экспортов нет.
- **Компоненты без пропсов** — данные берутся импортом из `@/data`, а не сверху.
- **`as const` для литеральных кортежей** (`EASE`, `LINKS`).
- **Типы импортируются через `import type`** — `isolatedModules: true` требует этого.
- **Комментарии редкие и по делу** — только там, где неочевиден приём
  (например, дублирование списка в Marquee ради бесшовной петли).
- **Язык:** UI-текст русский, идентификаторы и классы английские, mono-подписи
  часто английские намеренно («Selected Work», «Founders»).

## 9. Как расширять

| Задача | Что править |
|--------|-------------|
| Добавить кейс | `src/data/cases.ts` — новый объект `CaseStudy`. Нумерация `NN / total` и бордеры сетки считаются сами. |
| Добавить участника | `src/data/team.ts`. ⚠️ Вёрстка Team рассчитана ровно на 2 карточки (`md:first:border-r md:last:pr-0`) — третья сломает бордеры. |
| Добавить шаг методологии | `src/data/process.ts` — `num` задаётся вручную строкой. |
| Добавить клиента в ленту | `src/data/clients.ts` — дублирование списка для петли делает `Marquee` сам. |
| Поменять акцентный цвет | `tailwind.config.js` (`colors.accent`) **и** `src/index.css` (`--accent`) **и** `index.html` (`theme-color`, если меняется фон). |
| Добавить секцию | новый компонент в `src/components/`, вставить в `src/App.tsx`, при необходимости — якорь и пункт в `LINKS` внутри `Nav.tsx`. |
| Изменить порядок секций | только `src/App.tsx`. |

## 10. Чего в проекте намеренно нет

Это не пробелы, а границы текущего скоупа — важно, чтобы никто не «чинил» их случайно:

- **Роутер** — страница одна, навигация якорная.
- **Бэкенд, форма, база** — лид уходит в Telegram/почту внешней ссылкой.
- **State-менеджер** — единственное состояние во всём приложении это `scrolled` в `Nav`.
- **Изображения** — визуал строится типографикой и сеткой; в репозитории нет ни одного
  растрового/векторного ассета (это же означает: нет `og:image` для соцсетей — см. BACKLOG).
- **Светлая тема** — дизайн-система однорежимная, `prefers-color-scheme` не обрабатывается.

## 11. Навигация по коду: RAG

В репозитории настроен локальный поисковый индекс (SQLite FTS5) — см.
[AGENTS.md](../AGENTS.md) и `platform/tooling/rag/GUIDE.md`.

```bash
rag index --root .
```

```bash
rag query "reveal text mask animation" --root . --top-k 5
```

Конфиг — [tools/rag.config.json](../tools/rag.config.json); он поднимает единственную
ручку `maxFileBytes: 65536`, чтобы `package-lock.json` (~95 КБ) не засорял выдачу.
Индекс живёт в `.rag/` и сам себя игнорирует — в git не попадает.
