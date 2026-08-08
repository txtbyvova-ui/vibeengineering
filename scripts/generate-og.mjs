/**
 * Генерация OG-карточки на этапе сборки.
 *
 * Почему build-time, а не @vercel/og:
 *   @vercel/og — это edge-функция, ей нужен рантайм Vercel. Проект — статический
 *   Vite-SPA без серверной части и без зафиксированной платформы деплоя, а карточка
 *   для одностраничника не варьируется. Satori + resvg дают тот же результат
 *   на этапе сборки и работают на любом статическом хостинге.
 *
 * ВАЖНО про шрифты: у Clash Display и Space Grotesk НЕТ кириллицы (проверено:
 *   0 кодпоинтов в диапазоне U+0400–U+04FF). Поэтому латиница на карточке набрана
 *   Clash Display, а весь русский текст и знак ◆ — JetBrains Mono, единственным
 *   шрифтом дизайн-системы с кириллическим покрытием.
 *
 * ОТКУДА БЕРУТСЯ ШРИФТЫ — и почему по-разному. Разбор лицензий и провенанс —
 * в assets/fonts/README.md, коротко:
 *
 *   JetBrains Mono — SIL OFL 1.1, редистрибуция разрешена прямо. Лежит в git
 *   (assets/fonts/), читается с диска. Сети не требует.
 *
 *   Clash Display — ITF Free Font License, и она запрещает «uploading them in
 *   a public server». Репозиторий публичный, поэтому закоммитить TTF нельзя:
 *   его берём по Fontshare API — единственный путь доставки, который лицензия
 *   называет штатным, — и кладём в локальный кэш (.cache, вне git; §01 EULA
 *   разрешает резервные копии под собственное использование).
 *
 * Отсюда правило отказа: **нехватка Clash Display сборку НЕ валит.** Латинский
 * заголовок в этом случае набирается JetBrains Mono, карточка остаётся валидной,
 * а в лог уходит громкое предупреждение. Деплой не должен падать из-за
 * недоступности зарубежного CDN — при том что раньше падал ровно так.
 */

import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "og.png");
/** Шрифты, которые лицензия разрешает держать в git. Читаются с диска. */
const VENDORED = path.join(ROOT, "assets", "fonts");
const MONO_TTF = path.join(VENDORED, "JetBrainsMonoNL-Medium.ttf");
// Кэш вне node_modules: `npm ci` по спецификации сносит node_modules целиком,
// и кэш внутри него не переживал бы установку. Каталог закрыт .gitignore.
const CACHE = path.join(ROOT, ".cache", "og-fonts");

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

/**
 * Проверка, что перед нами целый sfnt-контейнер, а не огрызок и не HTML
 * от корпоративного прокси. Без неё битый кэш блокировал КАЖДУЮ последующую
 * сборку, включая офлайновую: `existsSync` возвращал true, сеть не спрашивалась,
 * а satori падал невнятным «Offset is outside the bounds of the DataView».
 *
 * Одной сигнатуры мало — у обрезанного файла первые четыре байта целые
 * (проверено: файл, урезанный до 4 КБ, сигнатуру проходит). Поэтому читаем
 * директорию таблиц и требуем, чтобы файл дотягивал до конца самой дальней.
 */
function isCompleteFont(buf) {
  if (buf.length < 12) return false;
  const tag = buf.subarray(0, 4).toString("latin1");
  const known =
    buf.readUInt32BE(0) === 0x00010000 || tag === "OTTO" || tag === "true";
  if (!known) return false;

  const numTables = buf.readUInt16BE(4);
  const dirEnd = 12 + numTables * 16;
  if (numTables === 0 || buf.length < dirEnd) return false;

  let needed = dirEnd;
  for (let i = 0; i < numTables; i++) {
    const record = 12 + i * 16;
    needed = Math.max(needed, buf.readUInt32BE(record + 8) + buf.readUInt32BE(record + 12));
  }
  return buf.length >= needed;
}

/** Скачивает шрифт с диска-кэша или из сети. Кэш вне git и вне node_modules. */
async function loadFont(cacheKey, cssUrl, userAgent) {
  const cached = path.join(CACHE, `${cacheKey}.ttf`);
  if (existsSync(cached)) {
    const buf = await readFile(cached);
    if (isCompleteFont(buf)) return buf;
    // Битый кэш чиним сами, а не заставляем человека догадываться.
    console.warn(`og: кэш ${cached} повреждён — качаю заново`);
    await rm(cached, { force: true });
  }

  const ttfUrl = await resolveTtfUrl(cssUrl, userAgent);
  const res = await fetch(ttfUrl);
  if (!res.ok) throw new Error(`${ttfUrl} → HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!isCompleteFont(buf))
    throw new Error(`${ttfUrl} отдал не шрифт или отдал не целиком (${buf.length} байт)`);

  // Запись через временный файл: прерванная сборка иначе оставляет в кэше
  // огрызок, который выглядит валидным для `existsSync`.
  await mkdir(CACHE, { recursive: true });
  const tmp = `${cached}.${process.pid}.tmp`;
  await writeFile(tmp, buf);
  await rename(tmp, cached);
  return buf;
}

const UA_MODERN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36";

/** Шрифт из git. Отсутствие — ошибка сборки: файл обязан быть в репозитории. */
async function loadVendored(file) {
  if (!existsSync(file)) {
    throw new Error(`нет шрифта ${file} — он должен лежать в git, см. assets/fonts/README.md`);
  }
  const buf = await readFile(file);
  if (!isCompleteFont(buf)) throw new Error(`${file} повреждён (${buf.length} байт)`);
  return buf;
}

/** Хелпер: satori принимает React-подобные объекты, JSX здесь не нужен. */
const h = (type, style, children) => ({ type, props: { style, children } });

function card(displayFamily) {
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

      // Заголовок — латиница, поэтому Clash Display работает. Если его не удалось
      // получить (CDN недоступен, а кэша ещё нет), сюда приезжает JetBrains Mono:
      // карточка выглядит иначе, но она есть, и сборка не падает.
      h(
        "div",
        { display: "flex", flexDirection: "column", marginTop: "auto" },
        [
          h(
            "div",
            {
              fontFamily: displayFamily,
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
              fontFamily: displayFamily,
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
  // Обязательный шрифт — из git, он и несёт всю кириллицу и ◆.
  const mono = await loadVendored(MONO_TTF);

  // Необязательный — по сети. Коммитить его лицензия не разрешает (см. шапку),
  // поэтому единственная защита от падения деплоя здесь — не падать.
  let clash = null;
  try {
    clash = await loadFont(
      "clash-display-600",
      "https://api.fontshare.com/v2/css?f%5B%5D=clash-display@600",
      UA_MODERN,
    );
  } catch (err) {
    console.warn(
      `og: Clash Display недоступен (${err.message}) — заголовок набираю JetBrains Mono.`,
    );
    console.warn("og: карточка будет собрана, но не в брендовой типографике.");
  }

  const displayFamily = clash ? "Clash Display" : "JetBrains Mono";
  const fonts = [{ name: "JetBrains Mono", data: mono, weight: 500, style: "normal" }];
  if (clash) fonts.push({ name: "Clash Display", data: clash, weight: 600, style: "normal" });

  const svg = await satori(card(displayFamily), { width: WIDTH, height: HEIGHT, fonts });

  const png = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } })
    .render()
    .asPng();

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, png);

  const kb = (png.length / 1024).toFixed(1);
  console.log(
    `og: public/og.png — ${WIDTH}x${HEIGHT}, ${kb} kB · заголовок ${displayFamily}`,
  );
}

main().catch((err) => {
  // Сюда доходят только настоящие поломки: пропавший вендоренный шрифт или
  // отказ рендера. Недоступность зарубежного CDN сборку больше не валит —
  // раньше валила, и деплой падал целиком из-за необязательной картинки.
  console.error("og: не удалось сгенерировать карточку —", err.message);
  console.error(`og: шрифты в git — ${VENDORED}; кэш Clash Display — ${CACHE}.`);
  process.exit(1);
});
