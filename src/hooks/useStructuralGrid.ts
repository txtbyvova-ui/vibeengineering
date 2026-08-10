import { useEffect } from "react";
import type { RefObject } from "react";
import { GRID } from "@/data/structuralGrid";

/**
 * Ферма Уоррена на Canvas 2D под заголовком Hero — ПОЛНАЯ версия спеки
 * docs/SPEC-hero-truss.md.
 *
 * Что здесь происходит физически: курсор — это точечная нагрузка, разнесённая по
 * ближайшим узлам расчётной схемы. Дальше усилие идёт НЕ по расстоянию до курсора
 * (это был бы фонарик), а по стержням: max-plus в три развёртки с разным
 * затуханием для поясов и раскосов. Отсюда пятно, вытянутое вдоль конструкции
 * ~2.3:1 и провисающее вниз. Узлы под нагрузкой смещаются ВНИЗ и к опорам —
 * прогиб, а не отталкивание.
 *
 * ТРИ ЗАПРЕТА (иначе ферма за три «улучшения» превращается обратно в particle-фон):
 *   1. случайный джиттер узлов в покое;
 *   2. случайная фаза амбиента по узлам — мгновенно даёт мерцающее звёздное небо;
 *   3. радиальное отталкивание от курсора вместо прогиба вниз.
 *
 * Режимы: off → static → ambient → active.
 *   off     — канва не влезает (мобильный ландшафт) или контекст не дали.
 *   static  — prefers-reduced-motion ИЛИ touch ИЛИ watchdog заморозил.
 *             Один кадр, ни rAF, ни pointer-листенеров.
 *   ambient — только «дыхание», 10 fps.
 *   active  — нагрузка от курсора, 60 fps.
 *
 * Хук ничего не рендерит и ни разу не вызывает setState: состояние живёт
 * в замыкании и типизированных массивах.
 */

const Q_REDUCE = "(prefers-reduced-motion: reduce)";
/** Именно так, а не (pointer: coarse): планшет с мышью обязан получить интерактив. */
const Q_FINE = "(hover: hover) and (pointer: fine)";

const ROLE_WEB = 0;
const ROLE_CHORD = 1;
const ROLE_MAJOR = 2;
const ROLE_COUNT = 3;

const TIER_STYLES: ReadonlyArray<readonly [string, number]> = [
  ["rgba(244,244,240,0.10)", 1.1],
  ["rgba(244,244,240,0.18)", 1.25],
  ["rgba(244,244,240,0.30)", 1.4],
  ["rgba(255,79,0,0.42)", 1.6],
  ["rgba(255,79,0,0.60)", 1.9],
];

const IDLE_WIDTH = [1, 1.2, 1.5] as const;

/** Квантованный просмотр тира: ноль ветвлений на ребро в кадре. */
const TIER_LUT = (() => {
  const lut = new Uint8Array(64);
  for (let k = 0; k < 64; k++) {
    const s = k / 63;
    let n = 0;
    for (let j = 0; j < GRID.tierThresholds.length; j++) {
      if (s >= GRID.tierThresholds[j]) n = j + 1;
    }
    lut[k] = n;
  }
  return lut;
})();

const FAR = -1e5;
const TWO_PI = Math.PI * 2;

export interface GridStats {
  mode: string;
  /** Частота rAF-колбэков страницы, а не частота отрисовок фермы. */
  fps: number;
  /** Частота собственно draw(): в ambient она намеренно ниже fps. */
  drawFps: number;
  drawMs: number;
  maxTension: number;
  nodes: number;
  edges: number;
  dpr: number;
  canvasH: number;
  degradation: number;
}

export function useStructuralGrid(
  hostRef: RefObject<HTMLElement | null>,
  headlineRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
): void {
  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    // Всё тело инициализации — под try/catch. Брошенное из useEffect исключение
    // в React 18 разбирает всё дерево до корня: упавшая ферма унесла бы с собой
    // весь первый экран. Требование «текст hero виден всегда» держится здесь.
    try {
      return init(host, canvas, headlineRef);
    } catch {
      return;
    }
  }, [hostRef, headlineRef, canvasRef]);
}

function init(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  headlineRef: RefObject<HTMLElement | null>,
): (() => void) | undefined {
  // Контекста может не быть: исчерпание, падение GPU-процесса, блокировка
  // anti-fingerprint-расширением. Тогда просто ничего не рисуем — секция уже
  // имеет собственный bg-bg и выглядит законченной.
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext("2d");
  } catch {
    return;
  }
  if (!ctx) return;
  const c = ctx;

  const debug =
    typeof location !== "undefined" && location.search.includes("debugGrid");

  const abort = new AbortController();
  const { signal } = abort;
  const mqReduce = window.matchMedia(Q_REDUCE);
  const mqFine = window.matchMedia(Q_FINE);

  // ── геометрия (всё переживает кадр, пересоздаётся только на rebuild) ────────
  let baseX = new Float32Array(0);
  let baseY = new Float32Array(0);
  let curX = new Float32Array(0);
  let curY = new Float32Array(0);
  /** Закрепление у вертикальных краёв: прогиб выпучивается в пролёте, умирает на опорах. */
  let anchor = new Float32Array(0);
  /** Две изгибные формы, предвычислены на build: в кадре два sin() на всю сцену, не N. */
  let mode1 = new Float32Array(0);
  let mode2 = new Float32Array(0);
  let tension = new Float32Array(0);
  let nodeTier = new Uint8Array(0);
  let edgeA = new Uint16Array(0);
  let edgeB = new Uint16Array(0);
  let edgeRole = new Uint8Array(0);
  let nodeCount = 0;
  let edgeCount = 0;

  let cols = 0;
  let rows = 0;
  let spacing: number = GRID.spacing.lg;
  let rowY: number = spacing * GRID.rowRatio;
  let originX = 0;
  let originY = 0;

  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let yShift = 0;

  /** Затухание при передаче усилия: [web, chord, major] вниз/вправо и вверх/влево. */
  const attenFwd = new Float32Array(ROLE_COUNT);
  const attenBwd = new Float32Array(ROLE_COUNT);
  attenFwd[ROLE_WEB] = GRID.atten.web;
  attenFwd[ROLE_CHORD] = GRID.atten.chord;
  attenFwd[ROLE_MAJOR] = GRID.atten.chord;
  attenBwd[ROLE_WEB] = GRID.atten.web * GRID.webUpBias;
  attenBwd[ROLE_CHORD] = GRID.atten.chord;
  attenBwd[ROLE_MAJOR] = GRID.atten.chord;

  // Батчи переиспользуются между кадрами: length = 0 не освобождает ёмкость.
  const buckets: number[][] = Array.from(
    { length: ROLE_COUNT + TIER_STYLES.length },
    () => [],
  );

  // ── сборка решётки ─────────────────────────────────────────────────────────
  function build(width: number, height: number) {
    spacing =
      width < 768 ? GRID.spacing.sm : width < 1280 ? GRID.spacing.md : GRID.spacing.lg;

    // Один проход подгонки под потолок узлов — sqrt сходится сразу.
    const rough = (width / spacing + 2) * (height / (spacing * GRID.rowRatio) + 2);
    if (rough > GRID.maxNodes) spacing *= Math.sqrt(rough / GRID.maxNodes);

    rowY = spacing * GRID.rowRatio;
    cols = Math.ceil(width / spacing) + 2;
    rows = Math.ceil(height / rowY) + 2;
    // Начало сдвинуто на полшага: ферма уходит под обрез, а не упирается в рамку.
    originX = -spacing;
    originY = -rowY;

    nodeCount = cols * rows;
    baseX = new Float32Array(nodeCount);
    baseY = new Float32Array(nodeCount);
    curX = new Float32Array(nodeCount);
    curY = new Float32Array(nodeCount);
    anchor = new Float32Array(nodeCount);
    mode1 = new Float32Array(nodeCount);
    mode2 = new Float32Array(nodeCount);
    tension = new Float32Array(nodeCount);
    nodeTier = new Uint8Array(nodeCount);

    const span = GRID.anchorSpan * spacing;
    for (let r = 0; r < rows; r++) {
      const half = r & 1 ? spacing / 2 : 0;
      for (let col = 0; col < cols; col++) {
        const i = r * cols + col;
        const x = originX + col * spacing + half;
        baseX[i] = x;
        baseY[i] = originY + r * rowY;
        const edgeDist = Math.max(0, Math.min(x, width - x));
        anchor[i] = Math.min(1, edgeDist / span);
        const u = Math.min(1, Math.max(0, x / width));
        mode1[i] = Math.sin(Math.PI * u);
        mode2[i] = Math.sin(TWO_PI * u);
      }
    }

    // Рёбра по правилу «только вперёд» (правый сосед, нижний-левый, нижний-правый):
    // каждое ровно один раз, без дедупликации, индексы всегда a < b. Это и есть
    // условие корректности max-plus: forward/backward — каузальная и антикаузальная
    // половины chamfer distance transform.
    const a: number[] = [];
    const b: number[] = [];
    const role: number[] = [];
    for (let r = 0; r < rows; r++) {
      const chordRole = r % GRID.majorChordEvery === 0 ? ROLE_MAJOR : ROLE_CHORD;
      for (let col = 0; col < cols; col++) {
        const i = r * cols + col;
        if (col + 1 < cols) {
          a.push(i);
          b.push(i + 1);
          role.push(chordRole);
        }
        if (r + 1 < rows) {
          // Нечётные ряды сдвинуты вправо на полшага, поэтому соседи снизу разные.
          const left = r & 1 ? col : col - 1;
          const right = r & 1 ? col + 1 : col;
          for (const nc of [left, right]) {
            if (nc >= 0 && nc < cols) {
              a.push(i);
              b.push((r + 1) * cols + nc);
              role.push(ROLE_WEB);
            }
          }
        }
      }
    }
    edgeCount = a.length;
    edgeA = Uint16Array.from(a);
    edgeB = Uint16Array.from(b);
    edgeRole = Uint8Array.from(role);
  }

  // ── измерение полосы и стопов маски ────────────────────────────────────────
  let hostLeft = 0;
  let hostPageTop = 0;

  /** @returns false, если рисовать негде (нулевой бокс или слишком низкий hero). */
  function resize(): boolean {
    const rect = host.getBoundingClientRect();
    const w = Math.round(rect.width);
    const heroH = Math.round(rect.height);
    if (w === 0 || heroH === 0) return false;

    hostLeft = rect.left;
    hostPageTop = rect.top + window.scrollY;

    // Одно чтение бокса h1 на layout. Захардкоженный процент высоты сломался бы
    // сразу: h1 прижат mt-auto к низу, и его позиция уезжает от строки метрик.
    const h1 = headlineRef.current;
    let h1Top = -1;
    let h1Bottom = -1;
    if (h1) {
      const hr = h1.getBoundingClientRect();
      h1Top = hr.top - rect.top;
      h1Bottom = hr.bottom - rect.top;
    }

    const probeSpacing =
      w < 768 ? GRID.spacing.sm : w < 1280 ? GRID.spacing.md : GRID.spacing.lg;
    const minH = GRID.navRampPx + 3 * probeSpacing * GRID.rowRatio;
    if (heroH < minH * 0.6) return false;

    const wanted = h1Bottom > 0 ? h1Bottom + GRID.headroomPx : heroH;
    const h = Math.round(Math.max(Math.min(wanted, heroH), Math.min(minH, heroH)));

    cssW = w;
    cssH = h;

    // Кап по dpr плюс кап по площади буфера: RGBA 5120×2256 — это 46 МБ
    // плюс копия у композитора.
    const capByArea = Math.sqrt(GRID.maxBackingPx / (w * h));
    dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, dprCap, capByArea));
    yShift = dpr === 1 ? 0.5 : 0;

    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    // setTransform, а НЕ scale: scale накапливается при повторном прогоне
    // эффекта в StrictMode/HMR, и всё уезжает в масштаб 4x.
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.lineCap = "butt"; // резаная сталь, а не оплавленный торец

    // Стопы маски — из реального бокса h1, монотонность гарантируем клампами.
    const ramp = Math.min(GRID.navRampPx, h);
    const fadeStart =
      h1Top > 0 ? Math.max(ramp + 1, Math.min(h - 1, h1Top - GRID.ghostLeadPx)) : h * 0.45;
    const fadeEnd =
      h1Top > 0 ? Math.max(fadeStart + 1, Math.min(h, h1Top + GRID.ghostTailPx)) : h * 0.72;
    canvas.style.setProperty("--grid-ramp", `${ramp}px`);
    canvas.style.setProperty("--grid-fade-start", `${fadeStart}px`);
    canvas.style.setProperty("--grid-fade-end", `${fadeEnd}px`);

    build(w, h);
    return true;
  }

  // ── состояние указателя ────────────────────────────────────────────────────
  let targetX = FAR;
  let targetY = FAR;
  let px = FAR;
  let py = FAR;
  let scrollY = window.scrollY;
  let lastPointerAt = -1e9;

  // ── кадр ───────────────────────────────────────────────────────────────────
  let maxTension = 0;

  function draw(now: number, dt: number, live: boolean, loaded: boolean) {
    const boost = live ? 1 : GRID.staticAlphaBoost;

    if (live) {
      // 1. Курсор: экспоненциальный лерп. Нагрузку тащат по конструкции,
      //    а не телепортируют.
      const kp = 1 - Math.exp(-dt / GRID.tauPointerMs);
      px += (targetX - px) * kp;
      py += (targetY - py) * kp;

      // 2. Релаксация во времени.
      const kr = Math.exp(-dt / GRID.tauRelaxMs);
      for (let i = 0; i < nodeCount; i++) {
        const v = tension[i] * kr;
        tension[i] = v < GRID.tensionCutoff ? 0 : v;
      }

      // 3. Впрыск нагрузки. Узлы на регулярной сетке — spatial index не нужен,
      //    ячейка курсора берётся арифметикой. Ядро без единого sqrt.
      if (loaded && px > FAR * 0.5) {
        const R = GRID.loadRadius;
        const R2 = R * R;
        const invR2 = 1 / R2;
        const cr = Math.round((py - originY) / rowY);
        const ringsY = Math.ceil(R / rowY) + 1;
        const ringsX = Math.ceil(R / spacing) + 1;
        for (let r = Math.max(0, cr - ringsY); r <= Math.min(rows - 1, cr + ringsY); r++) {
          const half = r & 1 ? spacing / 2 : 0;
          const cc = Math.round((px - originX - half) / spacing);
          const rowBase = r * cols;
          for (
            let col = Math.max(0, cc - ringsX);
            col <= Math.min(cols - 1, cc + ringsX);
            col++
          ) {
            const i = rowBase + col;
            const dx = baseX[i] - px;
            const dy = baseY[i] - py;
            const d2 = dx * dx + dy * dy;
            if (d2 >= R2) continue;
            const q = 1 - d2 * invR2;
            const w = q * q; // C¹-гладко на границе: без кольца на краю радиуса
            if (w > tension[i]) tension[i] = w;
          }
        }
      }

      // 4. Передача усилия — max-plus по графу рёбер. Не диффузия: диффузия даёт
      //    бегущую волну, а волна читается как вода или ткань. Сталь передаёт
      //    усилие мгновенно, поэтому max — и профиль считается аналитически (A^k).
      for (let s = 0; s < GRID.sweeps; s++) {
        if (s & 1) {
          for (let e = edgeCount - 1; e >= 0; e--) {
            const v = tension[edgeB[e]] * attenBwd[edgeRole[e]];
            const ia = edgeA[e];
            if (v > tension[ia]) tension[ia] = v;
          }
        } else {
          for (let e = 0; e < edgeCount; e++) {
            const v = tension[edgeA[e]] * attenFwd[edgeRole[e]];
            const ib = edgeB[e];
            if (v > tension[ib]) tension[ib] = v;
          }
        }
      }
    }

    // 5. Геометрия кадра: амбиент + прогиб. Смещение вниз (гравитация) и чуть
    //    в стороны — к опорам. Радиальное разбегание от курсора — сигнатура
    //    магнитного particle-поля, его избегаем явно.
    const amb1 = live
      ? GRID.ambient.amp1 * Math.sin((TWO_PI * now) / GRID.ambient.period1)
      : 0;
    const amb2 = live
      ? GRID.ambient.amp2 * Math.sin((TWO_PI * now) / GRID.ambient.period2)
      : 0;

    maxTension = 0;
    for (let i = 0; i < nodeCount; i++) {
      const a = anchor[i];
      const x0 = baseX[i];
      let y = baseY[i] + (amb1 * mode1[i] + amb2 * mode2[i]) * a + yShift;
      let x = x0;
      const t = live ? tension[i] : 0;
      if (t > 0) {
        if (t > maxTension) maxTension = t;
        const sag = GRID.sagMax * t * a;
        y += sag;
        x += GRID.sagLateral * sag * (x0 < px ? -1 : 1);
        nodeTier[i] = t >= GRID.nodeAccentFrom ? 2 : t >= GRID.nodeWhiteFrom ? 1 : 0;
      } else {
        nodeTier[i] = 0;
      }
      curX[i] = x;
      curY[i] = y;
    }

    // 6. Классификация рёбер и раскладка по батчам.
    for (let k = 0; k < buckets.length; k++) buckets[k].length = 0;

    for (let e = 0; e < edgeCount; e++) {
      const ia = edgeA[e];
      const ib = edgeB[e];
      const s = 0.5 * (tension[ia] + tension[ib]);
      let tier = live ? TIER_LUT[(s * 63) | 0] - 1 : -1;
      // Не пускаем акцент в полосу шапки: mix-blend-difference превращает
      // оранжевую линию под белым «VE» в голубую вспышку.
      if (tier >= GRID.accentFromTier) {
        const midY = 0.5 * (curY[ia] + curY[ib]);
        if (midY < GRID.accentBanAboveY) tier = GRID.accentBanTierClamp;
      }
      buckets[tier < 0 ? edgeRole[e] : ROLE_COUNT + tier].push(e);
    }

    // 7. Растр. Растеризующих вызовов — 12: clearRect + 8 stroke + 3 fill.
    c.clearRect(0, 0, cssW, cssH);

    // Пульсация силовых поясов — самый дешёвый канал «жизни»: одно умножение
    // на один батч, ноль дополнительных stroke() и ноль движения геометрии.
    const breath = live
      ? 1 + GRID.majorBreathAmp * Math.sin((TWO_PI * now) / GRID.ambient.period1)
      : 1;

    for (let k = 0; k < buckets.length; k++) {
      const bucket = buckets[k];
      if (bucket.length === 0) continue;
      if (k < ROLE_COUNT) {
        const base =
          k === ROLE_WEB
            ? GRID.idleAlpha.web
            : k === ROLE_CHORD
              ? GRID.idleAlpha.chord
              : GRID.idleAlpha.major * breath;
        c.strokeStyle = `rgba(136,136,136,${base * boost})`;
        c.lineWidth = IDLE_WIDTH[k];
      } else {
        const [color, lw] = TIER_STYLES[k - ROLE_COUNT];
        c.strokeStyle = color;
        c.lineWidth = lw;
      }
      strokeBucket(bucket);
    }

    // Узлы — rect(), а не arc(): круг = частица/звезда, квадрат = фасонка.
    // Плюс нет флаттенинга кривой.
    fillNodes(0, 2, `rgba(136,136,136,${GRID.idleAlpha.node * boost})`);
    if (live && maxTension >= GRID.nodeWhiteFrom) fillNodes(1, 3, "rgba(244,244,240,0.55)");
    if (live && maxTension >= GRID.nodeAccentFrom) fillNodes(2, 4, "rgba(255,79,0,0.7)");
  }

  function strokeBucket(bucket: number[]) {
    // Path длиннее ~2000 сегментов роняет кэш путей Skia и ретесселируется
    // каждый кадр — режем на куски. На капе узлов это не наступает, но правило
    // должно быть в коде.
    const limit = GRID.maxPathSegments;
    for (let start = 0; start < bucket.length; start += limit) {
      const end = Math.min(bucket.length, start + limit);
      c.beginPath();
      for (let n = start; n < end; n++) {
        const e = bucket[n];
        const ia = edgeA[e];
        const ib = edgeB[e];
        c.moveTo(curX[ia], curY[ia]);
        c.lineTo(curX[ib], curY[ib]);
      }
      c.stroke();
    }
  }

  function fillNodes(tier: number, size: number, color: string) {
    const half = size / 2;
    let drawn = 0;
    c.fillStyle = color;
    c.beginPath();
    for (let i = 0; i < nodeCount; i++) {
      if (nodeTier[i] !== tier) continue;
      c.rect(curX[i] - half, curY[i] - half, size, size);
      drawn++;
    }
    if (drawn > 0) c.fill();
  }

  // ── режимы, цикл и watchdog ────────────────────────────────────────────────
  type Mode = "off" | "static" | "ambient" | "active";
  let mode: Mode = "off";
  let raf = 0;
  let lastTs = 0;
  let visible = true;
  let dprCap: number = GRID.dprCap;
  /** 0 — норма, 1 — dpr сброшен в 1, 2 — заморожено в static. Только вниз. */
  let degradation = 0;
  let frozen = false;

  /** Окно watchdog считается по rAF-колбэкам, а не по отрисовкам: в ambient
   *  отрисовок 10 в секунду, и окно по ним растянулось бы на три секунды. */
  let wdRafFrames = 0;
  let wdDrawFrames = 0;
  let wdDrawAcc = 0;
  let wdStart = 0;
  let wdBad = 0;
  let modeStartedAt = 0;

  const stats: GridStats = {
    mode: "off",
    fps: 0,
    drawFps: 0,
    drawMs: 0,
    maxTension: 0,
    nodes: 0,
    edges: 0,
    dpr: 1,
    canvasH: 0,
    degradation: 0,
  };

  const isStatic = () => frozen || mqReduce.matches || !mqFine.matches;

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (wdStart === 0) wdStart = now;
    wdRafFrames++;

    const wantLoad =
      now - lastPointerAt < GRID.idleMs &&
      scrollY <= GRID.scrollGatePx &&
      targetX > FAR * 0.5;
    // Пока напряжение не рассосалось, держим полную частоту: иначе спад пятна
    // после ухода курсора идёт рывками по 100 мс.
    const hot = wantLoad || maxTension > GRID.tensionCutoff;
    const targetFps = hot ? GRID.fpsActive : GRID.fpsAmbient;
    const step = 1000 / targetFps;

    if (lastTs === 0 || now - lastTs >= step - 1) {
      const dt = lastTs === 0 ? step : Math.min(now - lastTs, GRID.dtClampMs);
      lastTs = now;

      const nextMode: Mode = hot ? "active" : "ambient";
      if (nextMode !== mode) {
        mode = nextMode;
        modeStartedAt = now;
      }

      const t0 = performance.now();
      draw(now, dt, true, wantLoad);
      wdDrawAcc += performance.now() - t0;
      wdDrawFrames++;

      if (debug) {
        stats.mode = mode;
        stats.drawMs = Math.round((performance.now() - t0) * 1000) / 1000;
        stats.maxTension = Math.round(maxTension * 1000) / 1000;
        stats.nodes = nodeCount;
        stats.edges = edgeCount;
        stats.dpr = dpr;
        stats.canvasH = cssH;
        stats.degradation = degradation;
      }
    }

    if (wdRafFrames >= GRID.watchdog.windowFrames) watchdog(now);
  }

  /**
   * Никакого сниффинга hardwareConcurrency/deviceMemory — только измерение.
   * Деградация односторонняя: обратно не поднимаемся, иначе осцилляция.
   */
  function watchdog(now: number) {
    const elapsed = Math.max(1, now - wdStart);
    // Считаем частоту КАДРОВ СТРАНИЦЫ (rAF), а не собственных отрисовок:
    // в ambient мы намеренно рисуем 10 раз в секунду, и мерить по отрисовкам
    // значило бы объявить штатный режим отказом.
    const fps = (wdRafFrames * 1000) / elapsed;
    const avgDraw = wdDrawFrames > 0 ? wdDrawAcc / wdDrawFrames : 0;
    if (debug) {
      stats.fps = Math.round(fps * 10) / 10;
      stats.drawFps = Math.round(((wdDrawFrames * 1000) / elapsed) * 10) / 10;
    }
    wdRafFrames = 0;
    wdDrawFrames = 0;
    wdDrawAcc = 0;
    wdStart = now;

    // Пока идут reveal'ы заголовка и подтягиваются шрифты, мерить бессмысленно.
    if (now - modeStartedAt < GRID.watchdog.warmupMs) return;
    if (degradation > GRID.watchdog.dprLadder.length) return;

    const missedFps = fps < GRID.watchdog.minFps;
    const slowDraw = avgDraw > GRID.watchdog.maxDrawMs;
    if (!missedFps && !slowDraw) {
      wdBad = 0;
      return;
    }
    if (++wdBad < GRID.watchdog.badWindows) return;
    wdBad = 0;
    degradation++;

    const nextCap = GRID.watchdog.dprLadder[degradation - 1];
    if (nextCap !== undefined) {
      // Первый рычаг — заливка: она растёт как dpr², и это главная статья расхода.
      dprCap = nextCap;
      if (resize()) {
        modeStartedAt = now;
        lastTs = 0;
      }
      return;
    }
    // Последний шаг — заморозка. Страницу не фризим: цикл просто исчезает,
    // ферма остаётся видимой статичной композицией.
    frozen = true;
    apply();
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function startLoop() {
    if (raf || !visible) return;
    // Любая смена режима обязана сбрасывать lastTs, иначе первый кадр
    // получит dt = 100 мс и узлы дёрнутся.
    lastTs = 0;
    wdStart = 0;
    wdRafFrames = 0;
    wdDrawFrames = 0;
    wdDrawAcc = 0;
    modeStartedAt = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function apply() {
    stopLoop();
    if (cssW === 0 || cssH === 0) {
      mode = "off";
      return;
    }
    const staticMode = isStatic();
    if (staticMode) {
      mode = "static";
      px = FAR;
      py = FAR;
      targetX = FAR;
      targetY = FAR;
      tension.fill(0);
      maxTension = 0;
    } else {
      mode = "ambient";
    }
    // Первый кадр — синхронно, не дожидаясь rAF: иначе на старте (и везде, где
    // rAF придушен — фоновая вкладка, свёрнутое окно) секция стоит с пустым фоном.
    draw(performance.now(), 1000 / GRID.fpsAmbient, !staticMode, false);
    if (debug) {
      stats.mode = mode;
      stats.nodes = nodeCount;
      stats.edges = edgeCount;
      stats.dpr = dpr;
      stats.canvasH = cssH;
      stats.degradation = degradation;
    }
    if (!staticMode) startLoop();
  }

  // ── подписки (все под одним AbortController) ───────────────────────────────
  if (!resize()) return;

  // На window, а не на секции: pointermove над шапкой (она fixed поверх hero)
  // до секции не доходит. Ни одного layout-чтения в обработчике: rect кэширован
  // в resize(), scrollY пишет пассивный листенер.
  window.addEventListener(
    "pointermove",
    (e) => {
      // Тач-ввод нагрузку не создаёт никогда: на телефоне ферма статична,
      // а на гибридном устройстве палец не должен подменять курсор.
      if (e.pointerType === "touch" || isStatic()) return;
      targetX = e.clientX - hostLeft;
      targetY = e.clientY - (hostPageTop - scrollY);
      lastPointerAt = performance.now();
      if (px < FAR * 0.5) {
        px = targetX;
        py = targetY;
      }
    },
    { passive: true, signal },
  );

  window.addEventListener(
    "pointerout",
    (e) => {
      if (!e.relatedTarget) {
        targetX = FAR;
        targetY = FAR;
        lastPointerAt = -1e9;
      }
    },
    { passive: true, signal },
  );

  window.addEventListener("scroll", () => (scrollY = window.scrollY), {
    passive: true,
    signal,
  });

  document.addEventListener(
    "visibilitychange",
    () => {
      // На автотроттлинг rAF не полагаемся — гасим явно.
      if (document.hidden) stopLoop();
      else if (!isStatic()) startLoop();
    },
    { signal },
  );

  mqReduce.addEventListener("change", apply, { signal });
  mqFine.addEventListener("change", apply, { signal });

  let lastW = cssW;
  let lastHeroH = Math.round(host.getBoundingClientRect().height);
  let resizeTimer = 0;
  const ro = new ResizeObserver((entries) => {
    // Порог обязателен: мобильные браузеры шлют resize при показе/скрытии
    // URL-бара, без него ферма пересобиралась бы на каждую смену направления скролла.
    const box = entries[0]?.contentRect;
    if (box) {
      const dw = Math.abs(Math.round(box.width) - lastW);
      const dh = Math.abs(Math.round(box.height) - lastHeroH);
      if (dw < GRID.resizeMinDw && dh < GRID.resizeMinDh) return;
    }
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (resize()) {
        lastW = cssW;
        lastHeroH = Math.round(host.getBoundingClientRect().height);
        apply();
      }
    }, GRID.resizeDebounceMs);
  });
  ro.observe(host);

  // Страница ~7000 px, hero виден малую часть сессии — самая крупная экономия
  // батареи во всей схеме: ниже первого экрана фича стоит ровно ноль.
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) stopLoop();
      else if (!isStatic()) startLoop();
    },
    { threshold: 0 },
  );
  io.observe(host);

  apply();

  // Высота Hero меняется, когда доезжают веб-шрифты: h1 задан в vw и
  // перевёрстывается при подмене фоллбэка. Одного ResizeObserver мало —
  // неверный первый замер иначе застревает навсегда.
  document.fonts?.ready
    .then(() => {
      if (signal.aborted) return;
      if (resize()) {
        lastW = cssW;
        lastHeroH = Math.round(host.getBoundingClientRect().height);
        apply();
      }
    })
    .catch(() => {});

  if (debug) {
    (window as unknown as { __grid?: () => GridStats }).__grid = () => ({ ...stats });
  }

  return () => {
    abort.abort();
    ro.disconnect();
    io.disconnect();
    window.clearTimeout(resizeTimer);
    stopLoop();
    if (debug) delete (window as unknown as { __grid?: unknown }).__grid;
  };
}
