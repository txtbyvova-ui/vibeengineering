/**
 * apple-touch-icon.png и favicon.ico из public/favicon.svg на этапе сборки.
 *
 * Почему генерацией, а не коммитом: SVG — это исходник, растры — производные.
 * Держать в git обе версии одного знака значит завести рассинхрон при первой же
 * правке. Растры пишутся в public/ и закрыты .gitignore (как og.png).
 *
 * iOS не умеет SVG-иконки для «на экран Домой» и требует ровно 180×180 PNG.
 * `favicon.ico` нужен клиентам, которые не понимают SVG-иконку: они уходят
 * на /favicon.ico по умолчанию и до 2026-08-06 получали там 404.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public", "favicon.svg");
const PUBLIC = path.join(ROOT, "public");
const TOUCH_SIZE = 180;
const ICO_SIZE = 32;

const svg = await readFile(SRC, "utf8");
const raster = (size) =>
  new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();

/**
 * Однокадровый ICO с PNG внутри. Формат разрешает PNG вместо BMP с Vista,
 * и все живые клиенты это понимают — поэтому контейнер сводится к двум
 * заголовкам поверх готового растра, без второй библиотеки в зависимостях.
 */
function ico(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(1, 4); // число изображений

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // ширина, 0 = 256
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // высота
  entry.writeUInt8(0, 2); // палитры нет
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // цветовых плоскостей
  entry.writeUInt16LE(32, 6); // бит на пиксель
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12); // смещение данных

  return Buffer.concat([header, entry, png]);
}

await mkdir(PUBLIC, { recursive: true });

const touch = raster(TOUCH_SIZE);
await writeFile(path.join(PUBLIC, "apple-touch-icon.png"), touch);

const icoBuf = ico(raster(ICO_SIZE), ICO_SIZE);
await writeFile(path.join(PUBLIC, "favicon.ico"), icoBuf);

console.log(
  `icons: apple-touch-icon.png — ${TOUCH_SIZE}x${TOUCH_SIZE}, ${(touch.length / 1024).toFixed(1)} kB · ` +
    `favicon.ico — ${ICO_SIZE}x${ICO_SIZE}, ${(icoBuf.length / 1024).toFixed(1)} kB`
);
