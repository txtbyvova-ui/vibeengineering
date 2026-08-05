/**
 * Генерация OG-карточки на этапе сборки.
 *
 * Почему build-time, а не @vercel/og:
 *   @vercel/og — это edge-функция, ей нужен рантайм Vercel. Проект — статический
 *   Vite-SPA без серверной части и без зафиксированной платформы деплоя, а карточка
 *   для одностраничника не варьируется. Satori + resvg дают тот же результат
 *   на этапе сборки и работают на любом статическом хостинге.
 *
 * Почему это не нарушает политику «ноль ассетов в репозитории»:
 *   PNG пишется в public/og.png и закрыт .gitignore — в git попадает только код,
 *   которым он получен. Шрифты не коммитятся, а тянутся с тех же CDN, что и сайт,
 *   и кэшируются в node_modules/.cache (тоже вне git).
 *
 * ВАЖНО про шрифты: у Clash Display и Space Grotesk НЕТ кириллицы (проверено:
 *   0 кодпоинтов в диапазоне U+0400–U+04FF). Поэтому латиница на карточке набрана
 *   Clash Display, а весь русский текст и знак ◆ — JetBrains Mono, единственным
 *   шрифтом дизайн-системы с кириллическим покрытием.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "og.png");
const CACHE = path.join(ROOT, "node_modules", ".cache", "og-fonts");

const WIDTH = 1200;
const HEIGHT = 630;

// Токены продублированы из tailwind.config.js: satori не читает Tailwind.
// При смене палитры править оба места (известная ловушка, см. docs/ARCHITECTURE.md).
const BG = "#0D0D0D";
const ACCENT = "#FF4F00";
const TEXT = "#F4F4F0";
const MUTED = "#888888";
const HAIRLINE = "rgba(255,255,255,0.10)";

/** Достаёт первый .ttf из CSS шрифтового CDN. Legacy User-Agent заставляет
 *  Google Fonts отдать полный TTF вместо woff2 — satori woff2 не понимает. */
async function resolveTtfUrl(cssUrl, userAgent) {
  const res = await fetch(cssUrl, { headers: { "User-Agent": userAgent } });
  if (!res.ok) throw new Error(`${cssUrl} → HTTP ${res.status}`);
  const css = await res.text();
  const match = css.match(/url\(['"]?((?:https:)?\/\/[^)'"]+\.ttf)['"]?\)/);
  if (!match) throw new Error(`в ответе ${cssUrl} нет ссылки на .ttf`);
  return match[1].startsWith("//") ? `https:${match[1]}` : match[1];
}

/** Скачивает шрифт с диска-кэша или из сети. Кэш живёт в node_modules — вне git. */
async function loadFont(cacheKey, cssUrl, userAgent) {
  const cached = path.join(CACHE, `${cacheKey}.ttf`);
  if (existsSync(cached)) return readFile(cached);

  const ttfUrl = await resolveTtfUrl(cssUrl, userAgent);
  const res = await fetch(ttfUrl);
  if (!res.ok) throw new Error(`${ttfUrl} → HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  await mkdir(CACHE, { recursive: true });
  await writeFile(cached, buf);
  return buf;
}

const UA_LEGACY = "Mozilla/4.0";
const UA_MODERN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36";

/** Хелпер: satori принимает React-подобные объекты, JSX здесь не нужен. */
const h = (type, style, children) => ({ type, props: { style, children } });

function card() {
  return h(
    "div",
    {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      backgroundColor: BG,
      padding: "64px 72px",
      position: "relative",
    },
    [
      // Верхняя линия: акцентный ромб + услуги
      h(
        "div",
        { display: "flex", alignItems: "center", gap: "16px" },
        [
          h("div", { fontFamily: "JetBrains Mono", fontSize: 26, color: ACCENT }, "◆"),
          h(
            "div",
            {
              fontFamily: "JetBrains Mono",
              fontSize: 24,
              letterSpacing: "0.18em",
              color: ACCENT,
            },
            "САЙТЫ · БОТЫ · ВЕБ-ПРИЛОЖЕНИЯ",
          ),
        ],
      ),

      // Заголовок — латиница, поэтому Clash Display работает
      h(
        "div",
        { display: "flex", flexDirection: "column", marginTop: "auto" },
        [
          h(
            "div",
            {
              fontFamily: "Clash Display",
              fontSize: 132,
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              color: TEXT,
            },
            "VIBE",
          ),
          h(
            "div",
            {
              fontFamily: "Clash Display",
              fontSize: 132,
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              color: ACCENT,
            },
            "ENGINEERING",
          ),
        ],
      ),

      // Подпись — кириллица, только JetBrains Mono её умеет
      h(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          marginTop: "44px",
          borderTop: `1px solid ${HAIRLINE}`,
          paddingTop: "28px",
        },
        [
          h(
            "div",
            { fontFamily: "JetBrains Mono", fontSize: 28, color: TEXT, lineHeight: 1.4 },
            "Считаем нагрузку до старта. Первый рабочий результат — через 48 часов",
          ),
          h(
            "div",
            { display: "flex", justifyContent: "space-between", alignItems: "center" },
            [
              h(
                "div",
                {
                  fontFamily: "JetBrains Mono",
                  fontSize: 22,
                  letterSpacing: "0.12em",
                  color: ACCENT,
                },
                "48Ч ДО ЗАПУСКА · 400+ ПРОЕКТОВ · 30M+ ОХВАТОВ",
              ),
              h(
                "div",
                {
                  fontFamily: "JetBrains Mono",
                  fontSize: 22,
                  letterSpacing: "0.12em",
                  color: MUTED,
                },
                "VIBEENGINEERING.RU",
              ),
            ],
          ),
        ],
      ),
    ],
  );
}

async function main() {
  const [clash, mono] = await Promise.all([
    loadFont(
      "clash-display-600",
      "https://api.fontshare.com/v2/css?f%5B%5D=clash-display@600",
      UA_MODERN,
    ),
    loadFont(
      "jetbrains-mono-500",
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500",
      UA_LEGACY,
    ),
  ]);

  const svg = await satori(card(), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "Clash Display", data: clash, weight: 600, style: "normal" },
      { name: "JetBrains Mono", data: mono, weight: 500, style: "normal" },
    ],
  });

  const png = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } })
    .render()
    .asPng();

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, png);

  const kb = (png.length / 1024).toFixed(1);
  console.log(`og: public/og.png — ${WIDTH}x${HEIGHT}, ${kb} kB`);
}

main().catch((err) => {
  // Падаем громко: без картинки og:image указывал бы на 404, а это хуже,
  // чем упавшая сборка. После первого успешного прогона шрифты берутся из кэша,
  // и сборка перестаёт зависеть от сети.
  console.error("og: не удалось сгенерировать карточку —", err.message);
  process.exit(1);
});
