# Архитектура — Vibe Engineering Landing

Карта проекта для тех, кто (или что) заходит в репозиторий без контекста.
Статус на 2026-08-05: ветка `main`, remote `github.com/txtbyvova-ui/vibeengineering`.
Последняя крупная работа — контент-релиз v2 (новый копирайт, медиа в кейсах,
SEO-обвязка), ветка `feat/content-v2`.

---

## 1. Что это

Одностраничный B2B-лендинг инженерного бюро, которое перешло из оффлайн-стройки
(порталы, металлоконструкции, BIM) в веб-разработку и AI-интеграции. Задача сайта —
одна: довести посетителя до Telegram/почты. Никакой формы, бэкенда и CMS нет,
лид уходит по внешней ссылке.

Дизайн-язык — «Industrial Premium»: чёрный фон, единственный акцент `#FF4F00`,
крупная display-типографика на весь вьюпорт, hairline-сетка вместо карточек с тенями,
контурный (hollow) текст, промышленная мono-разметка подписей.

**Ценообразования на странице нет намеренно.** Вместо прайса — блок «Смета до строки
за 2 часа» ([data/process.ts](../src/data/process.ts), `estimate`): обещание расчёта,
а не цифра. Это продуктовое решение, не упущение.

## 2. Стек

| Слой | Технология | Роль |
|------|-----------|------|
| Сборка | Vite 5 (`@vitejs/plugin-react`) | dev-сервер, prod-бандл, alias `@ → ./src` |
| UI | React 18 + TypeScript 5.5 (`strict`) | 8 секций-компонентов, без роутера и state-менеджера |
| Стили | Tailwind CSS 3.4 + PostCSS | дизайн-токены в конфиге, примитивы в `@layer components` |
| Анимация | Framer Motion 11 | только entry/scroll-анимации, интерактивной анимации нет |
| Шрифты | Clash Display (Fontshare), Space Grotesk + JetBrains Mono (Google Fonts) | подключены `<link>` из `index.html`. ⚠️ см. §6.4 — кириллицу из них умеет только JetBrains Mono |
| OG-карточка | Satori + `@resvg/resvg-js` | build-time, `npm run prebuild`; PNG в `public/og.png`, в git не коммитится |

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
│   ├── BACKLOG.md              # приоритизированные технические долги
│   └── SPEC-hero-truss.md      # спецификация переделки Hero (реализована)
├── scripts/
│   ├── generate-og.mjs         # OG-карточка (Satori + resvg), хук prebuild
│   ├── generate-icons.mjs      # apple-touch-icon.png из favicon.svg, хук prebuild
│   └── optimize-media.mjs      # РАЗОВЫЙ: «site media/» → public/media (ffmpeg)
├── public/                     # копируется Vite в dist/ как есть
│   ├── favicon.svg             # исходник знака, в git
│   ├── robots.txt              # allow-all + ссылка на sitemap
│   ├── sitemap.xml             # единственный URL
│   ├── media/                  # AVIF/WebP/JPEG кейсов и команды + ролик, В GIT
│   ├── og.png                  # ГЕНЕРИРУЕТСЯ, в git не коммитится
│   └── apple-touch-icon.png    # ГЕНЕРИРУЕТСЯ, в git не коммитится
├── tools/
│   └── rag.config.json         # конфиг локального RAG-индекса
└── src/
    ├── main.tsx                # createRoot + StrictMode + MotionConfig reducedMotion="user"
    ├── App.tsx                 # композиция секций, фоновая .bg-grid
    ├── index.css               # @layer base + components + utilities (prefers-reduced-motion)
    ├── vite-env.d.ts
    ├── types/index.ts          # CaseStudy, TeamMember, ProcessStep, ResponsiveImage, …
    ├── hooks/                  # useCountUp, useStructuralGrid
    ├── data/                   # ВЕСЬ пользовательский текст и пути к медиа
    │   ├── hero.ts             # заголовок кусками, лид, CTA
    │   ├── heroMetrics.ts      # 3 метрики первого экрана для count-up
    │   ├── usp.ts              # шапка секции + 3 пункта
    │   ├── cases.ts            # 4 кейса + мета-кейс
    │   ├── media.ts            # интринсики, alt-тексты и пути в public/media
    │   ├── process.ts          # 4 этапа + блок сметы + цитата
    │   ├── team.ts             # 2 основателя
    │   ├── contact.ts          # финальный оффер, ссылки, реквизиты футера
    │   ├── clients.ts          # 7 брендов для marquee
    │   └── nav.ts              # пункты меню, логотип, кнопка Telegram
    └── components/
        ├── Nav.tsx             # fixed + mix-blend-difference, реагирует на scrollY > 24
        ├── Hero.tsx            # h1 + метрики + CTA, единственный h1 на странице
        ├── Marquee.tsx         # бесконечная лента клиентов (CSS-анимация, не JS)
        ├── USP.tsx             # 3 преимущества
        ├── Cases.tsx           # сетка кейсов 2×N + мета-кейс
        ├── Process.tsx         # 4 этапа + блок сметы + цитата
        ├── Team.tsx            # 2 карточки основателей с портретами
        ├── Contact.tsx         # оффер, ссылки, <footer> с реквизитами
        └── ui/
            ├── RevealText.tsx         # маска-раскрытие текста
            ├── HeroMetrics.tsx        # строка метрик с count-up
            ├── StructuralGridCanvas.tsx  # ферма первого экрана, Canvas 2D
            ├── Picture.tsx            # <picture> AVIF → WebP → JPEG
            └── LazyVideo.tsx          # видео по IntersectionObserver
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
| `npm run og` | генерирует `public/og.png` | ✅ 1200×630, 43.7 kB |
| `npm run icons` | генерирует `public/apple-touch-icon.png` | ✅ 180×180, 2.3 kB |
| `npm run media` | пережимает `site media/` → `public/media` | ✅ разовый, нужен ffmpeg |
| `npm run build` | `prebuild` (og + icons) → `tsc --noEmit && vite build` | ✅ 413 модулей, ~6 с |
| `npm run preview` | превью прод-сборки | — |
| `npm run lint` | `eslint .` | ❌ eslint не установлен и не сконфигурирован |

`prebuild` запускается npm автоматически перед `build`, поэтому `og.png`
и `apple-touch-icon.png` всегда свежие и попадают в `dist/`. Скрипт OG тянет TTF
шрифтов с тех же CDN, что и сайт, и кэширует их в `node_modules/.cache/og-fonts` —
**первая** сборка на чистой машине требует сети, последующие нет. При недоступности
CDN сборка падает громко: битый `og:image` хуже упавшего билда.

`npm run media` в `build` **не** подключён: производные закоммичены, пережимать их
на каждой сборке незачем, а ffmpeg на CI может не быть. Запускать вручную, когда
меняется архив.

Прод-бандл (замер 2026-08-05, после контент-релиза v2):

```
dist/index.html                   6.54 kB │ gzip:  2.14 kB
dist/assets/index-*.css          16.98 kB │ gzip:  4.35 kB
dist/assets/index-*.js          289.23 kB │ gzip: 94.99 kB
dist/og.png                      43.7  kB
dist/media/**                     3.0  MB  (лениво, на первый экран не попадает)
```

Было до релиза: `270.24 kB` JS (`88.07` gzip), `14.13 kB` CSS (`3.65` gzip),
`2.91 kB` HTML. Рост HTML — JSON-LD, рост JS/CSS — новый контент, `Picture`
и `LazyVideo`. 95 КБ gzip JS — это почти целиком React + Framer Motion.

**Сетевой замер на прод-сборке** (1440 px, DevTools Network): первый экран —
**0 kB медиа**, 231 kB всего; вся страница после прокрутки — 1332 kB медиа,
из них 1246 kB это ролик М.Видео. Бюджет ТЗ (≤200 kB медиа на первый экран)
держится с запасом: выше сгиба медиа нет вообще.

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

С контент-релиза v2 правило соблюдается везде: в компонентах не осталось ни одной
пользовательской строки — включая подписи блоков кейса, префикс «Клиенты:»,
пункты меню и реквизиты футера. Пути к медиа, интринсики и alt-тексты живут
в [data/media.ts](../src/data/media.ts) — одном месте, синхронном с `public/media`.

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

### 6.4 ⚠️ Кириллица: работает только JetBrains Mono

Замерено 2026-08-05, подтверждено и в браузере, и разбором TTF:

| Шрифт | Латиница | Кириллица |
|---|---|---|
| Clash Display | ✅ | ❌ 0 кодпоинтов U+0400–U+04FF |
| Space Grotesk | ✅ | ❌ сабсета `cyrillic` нет в css2 |
| JetBrains Mono | ✅ | ✅ 98 кодпоинтов, включая `◆` |

**Весь русский текст сайта рендерится браузерным фоллбэком `sans-serif`**, а не
выбранной типографикой. Реальные гарнитуры получают только латинские вкрапления.
Это не косметика, а вопрос к бренду — подробности и варианты решения
в [BACKLOG.md §0](BACKLOG.md).

Практическое следствие для любого нового кода: **если текст русский, Clash Display
и Space Grotesk на него не подействуют.** OG-карточка это уже учитывает —
латинский заголовок набран Clash Display, русский текст и `◆` — JetBrains Mono.

### 6.5 Повторяющиеся паттерны разметки

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

`prefers-reduced-motion` закрыт в четырёх местах — по одному на каждый механизм
движения, потому что ни один не гасится другими:

| Механизм | Чем гасится |
|---|---|
| CSS-анимации (`marquee`, `gridShift`, `pulseDot`), smooth scroll | медиаблок в `@layer utilities` [index.css](../src/index.css) |
| Framer Motion (анимирует инлайн-стили через rAF) | `MotionConfig reducedMotion="user"` в [main.tsx](../src/main.tsx) |
| Canvas-ферма Hero | собственная JS-проверка в `useStructuralGrid` |
| Автоплей ролика кейса | собственная JS-проверка в [ui/LazyVideo.tsx](../src/components/ui/LazyVideo.tsx): вместо петли — постер с контролами |

**Правило для нового кода:** любой новый источник движения вне CSS и Framer Motion
обязан проверять `matchMedia('(prefers-reduced-motion: reduce)')` сам.

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
| Добавить кейс | `src/data/cases.ts` — новый объект `CaseStudy`. Нумерация `NN / total` и бордеры сетки считаются сами. Медиа — отдельно, см. следующую строку. |
| Добавить медиа кейсу | положить оригинал в `site media/`, прописать его в `scripts/optimize-media.mjs`, прогнать `npm run media`, затем описать в `src/data/media.ts` (ключ = `slug` кейса). Интринсики брать из вывода скрипта, alt писать осмысленный. |
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
- **Светлая тема** — дизайн-система однорежимная, `prefers-color-scheme` не обрабатывается.

⚠️ Пункт «в репозитории нет ни одного графического ассета» **снят** контент-релизом v2:
владелец прислал медиа-архив и поставил задачу подключить его к кейсам. Теперь политика
такая: **производные — в git (`public/media`), оригиналы — нет** (`site media/`
в `.gitignore`), а всё, что можно получить из исходника кодом (`og.png`,
`apple-touch-icon.png`), по-прежнему генерируется, а не коммитится. Первый экран
остаётся без картинок: там типографика, сетка и Canvas-ферма.

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
