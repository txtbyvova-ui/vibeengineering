/**
 * apple-touch-icon.png из public/favicon.svg на этапе сборки.
 *
 * Почему генерацией, а не коммитом: SVG — это исходник, PNG — производная.
 * Держать в git обе версии одного знака значит завести рассинхрон при первой же
 * правке. Растр пишется в public/ и закрыт .gitignore (как og.png).
 *
 * iOS не умеет SVG-иконки для «на экран Домой» и требует ровно 180×180 PNG.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public", "favicon.svg");
const OUT = path.join(ROOT, "public", "apple-touch-icon.png");
const SIZE = 180;

const svg = await readFile(SRC, "utf8");
const png = new Resvg(svg, { fitTo: { mode: "width", value: SIZE } }).render().asPng();

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, png);
console.log(`icons: public/apple-touch-icon.png — ${SIZE}x${SIZE}, ${(png.length / 1024).toFixed(1)} kB`);
