/**
 * Пережимает исходный медиа-архив в production-производные.
 *
 *   node scripts/optimize-media.mjs
 *
 * Вход  — `site media/` (оригиналы от владельца, в git не едут: .gitignore).
 * Выход — `public/media/` (AVIF + WebP + JPEG-fallback, видео h264/VP9 + poster).
 *
 * Скрипт разовый, в `build` не подключён: производные закоммичены, и пересобирать
 * их на каждой сборке незачем. Запускать, когда меняется архив.
 *
 * Требует ffmpeg на PATH (libaom-av1, libwebp, libvpx-vp9, libx264).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "site media");
const OUT = path.join(root, "public", "media");

/** Ширины: main — крупный визуал карточки, thumb — плитка, portrait — фото команды. */
const WIDTHS = {
  main: [640, 960, 1280],
  thumb: [320, 480],
  /** Одиночная плитка занимает всю ширину карточки — ей нужны те же ширины, что main. */
  wide: [640, 960],
  portrait: [320, 480, 720],
};

const IMAGES = [
  ["one swipe offer m.video.png", "cases/mvideo-billboards", "main"],
  ["one swipe offer m.video interview.png", "cases/mvideo-interview", "wide"],
  ["vegroove site.png", "cases/vegroove-site", "main"],
  ["kupikod render.jpg", "cases/kupikod-portal", "main"],
  ["kupikod pkd.webp", "cases/kupikod-model", "thumb"],
  ["kupikod pkd2.webp", "cases/kupikod-drawing", "thumb"],
  ["kupikod code.webp", "cases/kupikod-bot", "thumb"],
  ["Alfa Bank Batte.webp", "cases/alfabank-battle", "main"],
  ["Alfa Bank Battle.png", "cases/alfabank-deck", "wide"],
  ["vibeengineering art.png", "cases/ve-art", "main"],
  ["vova founder.webp", "team/vladimir", "portrait"],
  ["roman founder.webp", "team/roman", "portrait"],
];

const VIDEO = {
  src: "One Swipe Offer x MVideo-Eldorado 2022 .mp4",
  base: "cases/mvideo-one-swipe-offer",
  width: 640,
  /** Кадр для постера, секунды. */
  posterAt: 6,
};

const ff = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args]);
const probe = (file) =>
  execFileSync("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-of", "csv=p=0:s=x",
    file,
  ])
    .toString()
    .trim()
    .split("x")
    .map(Number);

const kb = (p) => (statSync(p).size / 1024).toFixed(1) + " kB";

function ensure(dir) {
  mkdirSync(dir, { recursive: true });
}

function image(file, base, kind) {
  const src = path.join(SRC, file);
  if (!existsSync(src)) throw new Error(`нет исходника: ${src}`);

  const [w0, h0] = probe(src);
  const widths = WIDTHS[kind].filter((w) => w <= w0);
  if (widths.length === 0) widths.push(w0);

  ensure(path.join(OUT, path.dirname(base)));
  const out = (suffix) => path.join(OUT, `${base}-${suffix}`);

  for (const w of widths) {
    // -2 держит чётную высоту: yuv420p требует кратности двум.
    const scale = `scale=${w}:-2:flags=lanczos`;
    ff(["-i", src, "-vf", scale, "-c:v", "libaom-av1", "-still-picture", "1",
        "-crf", "34", "-cpu-used", "8", "-pix_fmt", "yuv420p", out(`${w}.avif`)]);
    ff(["-i", src, "-vf", scale, "-c:v", "libwebp", "-quality", "74",
        "-compression_level", "6", out(`${w}.webp`)]);
  }

  // Один JPEG на случай отсутствия поддержки обоих современных форматов.
  const fallbackWidth = widths[Math.min(1, widths.length - 1)];
  ff(["-i", src, "-vf", `scale=${fallbackWidth}:-2:flags=lanczos`,
      "-q:v", "6", out("fallback.jpg")]);

  const [wMax, hMax] = probe(out(`${widths.at(-1)}.webp`));
  console.log(
    `${base.padEnd(28)} ${w0}x${h0} → ${widths.join("/")} · ` +
      `avif ${kb(out(`${widths.at(-1)}.avif`))} · webp ${kb(out(`${widths.at(-1)}.webp`))}`
  );
  return { base, widths, width: wMax, height: hMax };
}

function video() {
  const src = path.join(SRC, VIDEO.src);
  if (!existsSync(src)) throw new Error(`нет исходника: ${src}`);
  ensure(path.join(OUT, path.dirname(VIDEO.base)));
  const out = (suffix) => path.join(OUT, `${VIDEO.base}${suffix}`);
  const scale = `scale=${VIDEO.width}:-2:flags=lanczos`;

  // -an: звука нет по построению — ролик играет muted и в петле.
  // Только h264: замеряли VP9 (crf 38) — 1.9 MB против 1.2 MB у x264 crf 32
  // на этом материале, то есть «современный» формат вышел тяжелее. Второй
  // <source> ради худшего файла не нужен, h264 понимают все целевые браузеры.
  ff(["-i", src, "-vf", scale, "-c:v", "libx264", "-crf", "32", "-preset", "slow",
      "-profile:v", "main", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
      "-an", out(".mp4")]);

  for (const [ext, args] of [
    [".poster.webp", ["-c:v", "libwebp", "-quality", "76"]],
    [".poster.jpg", ["-q:v", "6"]],
  ]) {
    ff(["-ss", String(VIDEO.posterAt), "-i", src, "-frames:v", "1", "-vf", scale,
        ...args, out(ext)]);
  }

  const [w, h] = probe(out(".mp4"));
  console.log(
    `${VIDEO.base.padEnd(28)} ${w}x${h} · mp4 ${kb(out(".mp4"))} · ` +
      `poster ${kb(out(".poster.jpg"))}`
  );
  return { base: VIDEO.base, width: w, height: h };
}

function total(dir) {
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    bytes += entry.isDirectory() ? total(p) : statSync(p).size;
  }
  return bytes;
}

ensure(OUT);
for (const [file, base, kind] of IMAGES) image(file, base, kind);
video();
console.log(`\npublic/media — ${(total(OUT) / 1024 / 1024).toFixed(2)} MB`);
