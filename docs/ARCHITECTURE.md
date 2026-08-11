# Архитектура — Vibe Engineering Landing

Карта проекта для тех, кто (или что) заходит в репозиторий без контекста.
Статус на 2026-08-10: ветка `main`, remote `github.com/txtbyvova-ui/vibeengineering`.
Последняя крупная работа — сцена первого экрана: wireframe на барицентрических
координатах и панель параметров шейдера (PR #8). До неё — 3D-воронка (PR #7),
понятность главной и смена шрифтов (PR #6).

---

## 1. Что это

Одностраничный B2B-лендинг инженерного бюро, которое перешло из оффлайн-стройки
(порталы, металлоконструкции, BIM) в веб-разработку и AI-интеграции. Задача сайта —
одна: довести посетителя до Telegram/почты. Никакой формы, бэкенда и CMS нет,
лид уходит по внешней ссылке.

Дизайн-язык — «Industrial Premium» в палитре «Leica Racing» (с 2026-08-11):
фон `#050505`, единственный акцент `#D90429`,
крупная display-типографика на весь вьюпорт, hairline-сетка вместо карточек с тенями,
контурный (hollow) текст, промышленная мono-разметка подписей.

**Ценообразования на странице нет намеренно.** Вместо прайса — блок «Смета до строки
за 2 часа» ([data/process.ts](../src/data/process.ts), `estimate`): обещание расчёта,
а не цифра. Это продуктовое решение, не упущение.

## 2. Стек

| Слой | Технология | Роль |
|------|-----------|------|
| Сборка | Vite 5 (`@vitejs/plugin-react`) | dev-сервер, prod-бандл, alias `@ → ./src` |
| UI | React 18 + TypeScript 5.5 (`strict`) | 9 секций-компонентов, без роутера и state-менеджера |
| Стили | Tailwind CSS 3.4 + PostCSS | дизайн-токены в конфиге, примитивы в `@layer components` |
| Анимация | Framer Motion 11 | только entry/scroll-анимации DOM |
| 3D-сцена Hero | three 0.169 + @react-three/fiber 8 | **только ленивым чанком**, см. §10а. Единственные тяжёлые зависимости проекта |
| Панель параметров | leva 0.10 | там же, в ленивом чанке; 70.5 kB gzip из 294.5 |
| Шрифты | M PLUS Rounded 1c, IBM Plex Sans, JetBrains Mono | **самохостинг**: woff2 в `public/fonts`, `@font-face` в `src/index.css`. Сторонних CDN нет. Кириллица есть у всех трёх — см. §6.4 |
| OG-карточка | Satori + `@resvg/resvg-js` | build-time, `npm run prebuild`; PNG в `public/og.png`, в git не коммитится. Шрифт карточки — вендоренный JetBrains Mono из [assets/fonts/](../assets/fonts/README.md), сети не требует |

Runtime-зависимостей шесть: `react`, `react-dom`, `framer-motion` — в главном чанке;
`three`, `@react-three/fiber`, `leva` — **только в ленивом чанке сцены Hero**
и больше нигде. Ни роутера, ни fetch-слоя, ни аналитики.

## 3. Карта репозитория

```
vibeengineering/
├── index.html                  # <head>: title, description, OG, шрифты; <div id="root">
├── vite.config.ts              # plugin-react + alias "@" -> ./src
├── tsconfig.json               # strict, noUnusedLocals/Parameters, paths "@/*"
├── tailwind.config.js          # ЕДИНСТВЕННЫЙ источник дизайн-токенов
├── postcss.config.js           # tailwindcss + autoprefixer
├── package.json                # dev / build / preview / typecheck / lint*
├── assets/
│   └── fonts/                  # ТОЛЬКО шрифты, чью редистрибуцию разрешает
│                               # лицензия: JetBrains Mono (OFL) + OFL.txt.
│                               # Вне public/, читает только generate-og.mjs.
│                               # Clash Display сюда класть НЕЛЬЗЯ — см. README
├── docs/
│   ├── ARCHITECTURE.md         # этот файл
│   ├── BACKLOG.md              # приоритизированные технические долги
│   ├── REPORT-hero-wireframe.md  # ДЕЙСТВУЮЩАЯ сцена Hero: wireframe + панель
│   ├── REPORT-hero-funnel-3d.md  # 3D-воронка — предыдущая сцена
│   ├── REPORT-hero-truss-max.md  # ферма Уоррена — сцена до неё
│   ├── SPEC-hero-truss.md      # спецификация фермы (историческая)
│   ├── REPORT-cases-rail.md    # отчёт по ленте кейсов
│   ├── REPORT-clarity-2026-08-07.md  # понятность главной
│   ├── REPORT-fonts-2026-08-08.md    # смена шрифтов
│   └── REPORT-multi-review-2026-08-06.md  # отчёт мульти-ревью и починки
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
    ├── shaders/
    │   └── wireframe.ts        # GLSL строками (mattdesl/webgl-wireframes, MIT)
    ├── hooks/
    │   ├── useCountUp.ts       # count-up метрик, пишет textContent без ре-рендеров
    │   ├── useSceneLoop.ts     # владелец rAF любой R3F-сцены: троттл, пауза, watchdog
    │   ├── useWireframeGeometry.ts     # разындексация + барицентрика
    │   ├── useStructuralGrid.ts        # ферма на Canvas 2D — сцена без импорта
    │   └── usePrefersReducedMotion.ts
    ├── data/                   # ВЕСЬ пользовательский текст и пути к медиа
    │   ├── hero.ts             # заголовок кусками, лид, CTA
    │   ├── heroMetrics.ts      # 3 метрики первого экрана для count-up
    │   ├── services.ts         # шапка секции + 4 направления услуг
    │   ├── usp.ts              # шапка секции + 3 пункта
    │   ├── cases.ts            # 4 кейса + мета-кейс
    │   ├── media.ts            # интринсики, alt-тексты и пути в public/media
    │   ├── process.ts          # 4 этапа + блок сметы + цитата
    │   ├── team.ts             # 2 основателя
    │   ├── contact.ts          # финальный оффер, ссылки, реквизиты футера
    │   ├── clients.ts          # 7 брендов для marquee
    │   ├── heroWireframe.ts    # копирайт Redline + ручки wireframe-сцены
    │   ├── funnel.ts           # воронка: профиль общий 3D ↔ SVG (сцена без импорта)
    │   ├── structuralGrid.ts   # ручки фермы (сцена без импорта)
    │   └── nav.ts              # пункты меню, логотип, кнопка Telegram
    └── components/
        ├── Nav.tsx             # fixed + mix-blend-difference, реагирует на scrollY > 24
        ├── HeroWireframe.tsx   # ДЕЙСТВУЮЩИЙ Hero: wireframe + оффер Redline
        ├── Hero.tsx            # Hero с воронкой — цел, но из App.tsx не импортируется
        ├── Marquee.tsx         # бесконечная лента клиентов (CSS-анимация, не JS)
        ├── Services.tsx        # 4 направления: сайты, боты, веб-приложения, AI
        ├── USP.tsx             # 3 преимущества
        ├── Cases.tsx           # лента кейсов + модалка + мета-кейс
        ├── Process.tsx         # 4 этапа + блок сметы + цитата
        ├── Team.tsx            # 2 карточки основателей с портретами
        ├── Contact.tsx         # оффер, ссылки, <footer> с реквизитами
        └── ui/
            ├── RevealText.tsx         # маска-раскрытие текста
            ├── HeroMetrics.tsx        # строка метрик с count-up
            ├── WireframeHeroCanvas.tsx   # r3f wireframe + панель leva (ленивый чанк)
            ├── HeroScene.tsx          # выбор 3D/SVG для воронки (без импорта)
            ├── ConversionFunnelCanvas.tsx  # r3f-воронка (без импорта)
            ├── FunnelBlueprint.tsx    # статичный SVG-чертёж воронки, тот же профиль
            ├── StructuralGridCanvas.tsx  # обёртка фермы (без импорта)
            ├── Picture.tsx            # <picture> AVIF → WebP → JPEG
            ├── LazyVideo.tsx          # видео по IntersectionObserver
            ├── CaseRail.tsx           # горизонтальная лента кейсов
            ├── CaseCard.tsx           # карточка ленты + чип стека
            ├── CaseModal.tsx          # раскрытие кейса, портал в body
            └── CasesJsonLd.tsx        # ItemList кейсов структурированными данными
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
| `npm run icons` | генерирует `apple-touch-icon.png` и `favicon.ico` | ✅ 180×180 / 32×32 |
| `npm run media` | пережимает `site media/` → `public/media` | ✅ разовый, нужен ffmpeg |
| `npm run build` | `prebuild` (og + icons) → `tsc --noEmit && vite build` | ✅ 413 модулей, ~6 с |
| `npm run preview` | превью прод-сборки | — |
| `npm run lint` | `eslint .` | ❌ eslint не установлен и не сконфигурирован |

`prebuild` запускается npm автоматически перед `build`, поэтому `og.png`,
`favicon.ico` и `apple-touch-icon.png` всегда свежие и попадают в `dist/`.

**Сеть для сборки не нужна.** Шрифт карточки — JetBrains Mono из
[assets/fonts/](../assets/fonts/README.md): он в git (OFL 1.1 редистрибуцию
разрешает явно) и несёт всю кириллицу и `◆`. Clash Display коммитить **запрещает
его лицензия** (ITF FFL: «uploading them in a public server», а репозиторий
публичный), поэтому он необязателен — берётся по Fontshare API в локальный кэш
`.cache/og-fonts`, а при недоступности CDN латинский заголовок набирается
JetBrains Mono и сборка продолжается. Разбор с цитатами — в README каталога.

`npm run media` в `build` **не** подключён: производные закоммичены, пережимать их
на каждой сборке незачем, а ffmpeg на CI может не быть. Запускать вручную, когда
меняется архив.

Прод-бандл (замер 2026-08-06, после ленты кейсов):

```
dist/index.html                   6.70 kB │ gzip:  2.15 kB
dist/assets/index-*.css          21.28 kB │ gzip:  5.16 kB
dist/assets/index-*.js          303.58 kB │ gzip: 99.46 kB
dist/og.png                      43.7  kB
dist/media/**                     3.0  MB  (почти всё — только по клику)
```

Динамика: `270.24 → 289.23 → 303.58 kB` JS (`88.07 → 94.99 → 99.46` gzip).
Первый шаг — контент-релиз v2 (`Picture`, `LazyVideo`, больше текста), второй —
лента кейсов (`CaseRail`, `CaseModal`, `AnimatePresence`, портал). Почти весь
объём по-прежнему React + Framer Motion.

**Сетевой замер на прод-сборке** (1440 px, DevTools Network):

| | до ленты | после |
|---|---|---|
| медиа на первом экране | 0 kB | **17.4 kB** (две обложки `eager`) |
| всего на первом экране | 231 kB | 237 kB |
| медиа за всю прокрутку | 1332 kB | **55 kB** |

Вес всей страницы упал в 24 раза: галереи и ролик М.Видео (1246 kB) переехали
в модалку и грузятся только по клику. 17 kB на первом экране — цена требования
«первые две обложки eager»; чтобы они не отбирали канал у первого экрана,
у них `fetchpriority="low"`.

**CLS не вырос:** 0.0098 → 0.0099 на 1440 px и 0.0152 → 0.0152 на 375 px
(замер `PerformanceObserver`, прокрутка всей страницы, прод-сборки обеих веток).

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
`Nav → Hero → Marquee → Services → USP → Cases → Process → Team → Contact`.
Якоря для навигации: `#top` (Hero), `#services`, `#work` (Cases), `#process`, `#team`,
`#contact`. `#services` пункта в меню пока не имеет — якорь заведён на будущее.

`Services` стоит перед `USP` намеренно: сначала «что вы для меня сделаете»,
потом «почему вы». До 2026-08-07 состав услуг на странице не назывался вовсе —
он был только в `hasOfferCatalog` структурированных данных, то есть роботы знали
о нём больше, чем посетители.

## 6. Дизайн-система

### 6.1 Токены — [tailwind.config.js](../tailwind.config.js)

| Категория | Токен | Значение | Где применяется |
|-----------|-------|----------|-----------------|
| Цвет | `bg` | `#050505` | фон страницы |
| Цвет | `surface` | `#111113` | поднятые плоскости; в разметке пока не применён |
| Цвет | `accent` | `#D90429` | CTA, метрики, hover. ⚠️ на `bg` даёт 3.88:1 — не для текста мельче 18 px |
| Цвет | `accentMuted` | `#8D081E` | задняя стенка wireframe, акценты ползунков. **Только декор:** 2.12:1 |
| Цвет | `textMain` | `#F5F5F7` | основной текст; на кнопке-акценте тоже он — 4.82:1 |
| Цвет | `textMuted` | `#888888` | вторичный текст, подписи |
| Бордер | `hairline` | `rgba(255,255,255,0.08)` | все разделители (`border-hairline`) |
| Шрифт | `display` | M PLUS Rounded 1c | заголовки, метрики, цитаты |
| Шрифт | `sans` | IBM Plex Sans | абзацы (дефолт `body`) |
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
| `.bg-grid` | фиксированная сетка 4rem на весь экран, `z-index: -1`, **статичная**. Анимация `gridShift` снята 2026-08-10: слой `fixed` во весь экран, `background-position` не композиторное свойство, и её кадры перерисовывали всё поверх — с работающей сценой Hero это стоило 28 fps из 50 |
| `.text-hollow` | контурный текст акцентом, заливается акцентом на hover |
| `.text-hollow-white` | контурный белым (35 %), на hover заливается акцентом |
| `.mono-label` | стандартная mono-подпись секции (11px / uppercase / tracking 0.18em) |
| `.btn-fill` | заливка снизу вверх через `::before` + `scaleY` |
| `.hairline` | **мёртвый класс** — везде применяется Tailwind-токен `border-hairline` |

Плюс глобально: скрытый скроллбар, `scroll-behavior: smooth`, кастомный `::selection`.

### 6.3 Повторяющиеся паттерны разметки

### 6.4 Кириллица: покрытие проверено у всех трёх шрифтов

| Шрифт | Латиница | Кириллица | Курсив |
|-------|----------|-----------|--------|
| M PLUS Rounded 1c | ✅ | ✅ 100 кодпоинтов | ❌ нет начертания |
| IBM Plex Sans | ✅ | ✅ | ❌ не подключён |
| JetBrains Mono | ✅ | ✅ | ❌ не подключён |

До 2026-08-08 здесь стояла обратная таблица: Clash Display — 0 кодпоинтов
в U+0400–U+04FF, у Space Grotesk сабсета `cyrillic` нет в `css2` вовсе.
То есть весь русский текст рендерился системным `sans-serif`, при том что три
семейства исправно грузились с двух сторонних CDN. Это был [BACKLOG §0](BACKLOG.md),
самый крупный открытый дефект дизайн-системы; он закрыт сменой шрифтов.

**Правило для нового шрифта:** покрытие проверять разбором `cmap`, а не глазами
на витрине производителя. На тех же граблях едва не оказались M PLUS 1 и Assistant,
присланные как замена: в обоих 0 кириллических кодпоинтов, у Assistant вдобавок
нет `₽`, `№`, `→` и `◆`.

**Курсива в наборе нет ни у одного семейства** — поэтому `italic` в разметке
не используется: браузер синтезировал бы наклон сам, и на крупном кегле это видно.
Выделение — цветом и кеглем.

**`₽` и `◆` не покрыты ни одним из трёх** (в сабсетах Google Fonts этих
кодпоинтов нет) и рендерятся системным фоллбэком. Мест немного: ромб
в надстрочниках секций и рубль в метрике кейса Альфа-Банка.


## 7. Анимационная модель

Единая easing-кривая `[0.16, 1, 0.3, 1]` (out-expo) объявлена **пять раз** —
константа `EASE` продублирована в `Hero`, `Services`, `USP`, `Cases`, `Process`, `Team`,
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
| CSS-анимации (`marquee`, `pulseDot`), smooth scroll | медиаблок в `@layer utilities` [index.css](../src/index.css) |
| Framer Motion (анимирует инлайн-стили через rAF) | `MotionConfig reducedMotion="user"` в [main.tsx](../src/main.tsx) |
| 3D-сцена Hero | JS-проверка в [HeroWireframe.tsx](../src/components/HeroWireframe.tsx): режим `frozen` — ровно один кадр, вращение и пунктир выключены, панель скрыта. ⚠️ `three` при этом всё равно грузится: у wireframe нет векторного фолбэка (см. §10а) |
| Автоплей ролика кейса | собственная JS-проверка в [ui/LazyVideo.tsx](../src/components/ui/LazyVideo.tsx): вместо петли — постер. Контролы у плеера стоят **всегда**, независимо от настройки: ролик длиннее минуты, без механизма паузы это WCAG 2.2.2 |

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
| Добавить кейс | `src/data/cases.ts` — новый объект `CaseStudy`. Медиа заводится **отдельным шагом**, и промежуток между двумя правками безопасен: `caseMedia` объявлен как `Record<string, CaseMedia \| undefined>`, карточка без обложки рисует пунктирный плейсхолдер, а не роняет страницу. Раньше ронял — см. [REPORT-multi-review-2026-08-06.md](REPORT-multi-review-2026-08-06.md) §3.1. Схема жёсткая: все поля обязательны, `year` может быть `null`, `metrics` пустым быть не может. Нумерация `NN / total` считается сама. Чего не хватает — вписать в `caseDataGaps`, а не выдумать. Медиа — отдельно, см. следующую строку. |
| Добавить медиа кейсу | положить оригинал в `site media/`, прописать его в `scripts/optimize-media.mjs`, прогнать `npm run media`, затем описать в `src/data/media.ts` (ключ = `slug` кейса). Интринсики брать из вывода скрипта, alt писать осмысленный. |
| Добавить участника | `src/data/team.ts` + портрет в `teamPhotos` (`src/data/media.ts`). Бордеры на `md:odd:`/`md:even:` — третья карточка сетку не сломает; без портрета секция тоже не упадёт, фото просто не отрисуется. |
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
остаётся без картинок: там типографика и процедурная сцена — 3D-воронка
на десктопе, SVG-чертёж на мобиле, оба считаются кодом.

## 10а. Сцена первого экрана

Единственное место в проекте, где живут тяжёлые зависимости (`three`,
`@react-three/fiber`, `leva`), поэтому устройство описано здесь, а не только
в отчёте.

**Действующая сцена — wireframe «Redline Tech»** на барицентрических координатах
(с 2026-08-10, PR #8). Разбор и замеры: [REPORT-hero-wireframe.md](REPORT-hero-wireframe.md).

```
App.tsx
  └── HeroWireframe.tsx        ← решает РЕЖИМ; сцена монтируется после `load`
        └── lazy(WireframeHeroCanvas)   ← здесь three + leva
              ├── shaders/wireframe.ts       GLSL строками, без glslify
              ├── useWireframeGeometry.ts    разындексация + барицентрика
              └── useSceneLoop.ts            владеет rAF: троттл, пауза, watchdog
```

| посетитель | режим | панель | пунктир | вращение |
|---|---|---|---|---|
| десктоп ≥ 768 px | `full` | да | да | да |
| ширина < 768 px | `quiet` | нет | нет | да, медленное |
| `prefers-reduced-motion` | `frozen` | нет | нет | **нет**, один кадр |

⚠️ **`three` грузится во ВСЕХ режимах, включая мобильный.** У wireframe нет
векторного фолбэка, а постановка требует оставить фигуру декорацией. Цена
замерена: мобильный первый экран **529.9 kB** против 243.5 kB на предыдущей
сцене. Это открытый вопрос к владельцу, а не решённый — [отчёт §6](REPORT-hero-wireframe.md).

Что легко сломать, не заметив:

1. **Барицентрика требует разындексированной геометрии.** Вершины нельзя
   переиспользовать между треугольниками — `toNonIndexed()` обязателен, и он
   умножает число вершин на три.
2. **`side: DoubleSide`** — без задних граней `gl_FrontFacing` всегда `true`
   и backface coloring не существует. **`depthWrite: false`** — иначе передние
   грани перекрывают задние и сквозной режим перестаёт быть сквозным.
3. **Объект uniform'ов создаётся один раз, дальше мутируется `.value`.** Новый
   объект на каждый рендер = перекомпиляция `ShaderMaterial` на каждое движение
   ползунка.
4. **`frameloop="never"`.** R3F своего rAF не заводит: кадры выдаёт `useSceneLoop`
   вызовом `advance()`. Отсюда троттл, пауза по `visibilitychange`
   и `IntersectionObserver`, односторонняя деградация dpr → гашение цикла.
   При остановке на канве остаётся последний кадр — страница не «фризится».
   ⚠️ `advance()` **глобален** и продвигает все смонтированные R3F-корни: двух
   живых сцен на странице быть не должно.
5. **`leva` самомонтирует панель в `body`,** если не отрендерить `<Leva/>` явно.
   На мобиле она перекрыла бы текст — там рендерится `<Leva hidden />`.
6. **GLSL лежит шаблонными строками, glslify в проекте нет.** Оригинальные
   шейдеры mattdesl используют `#pragma glslify: require`; они переписаны так,
   чтобы сборка не зависела ни от плагина, ни от Babel.

### Предыдущие сцены — в дереве, но без импорта

Обе целы и ни из чего не импортируются, то есть в бандл не попадают.
Переключение — одна строка импорта в `App.tsx` (`HeroWireframe` → `Hero`)
и, для фермы, в `Hero.tsx`.

| сцена | файлы | разбор |
|---|---|---|
| 3D-воронка конверсии | `HeroScene.tsx`, `ConversionFunnelCanvas.tsx`, `FunnelBlueprint.tsx`, `data/funnel.ts` | [REPORT-hero-funnel-3d.md](REPORT-hero-funnel-3d.md) |
| Ферма Уоррена, Canvas 2D | `useStructuralGrid.ts`, `StructuralGridCanvas.tsx`, `data/structuralGrid.ts` | [REPORT-hero-truss-max.md](REPORT-hero-truss-max.md) |

У воронки был приём, которого у wireframe нет: **гейт до `React.lazy`**, поэтому
телефон не скачивал `three` вовсе, и **общий профиль `funnelRadius`** для 3D
и SVG — силуэт не мог разъехаться между видами. Если мобильный вес станет
важнее фигуры, возвращать надо именно эти два приёма.

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
