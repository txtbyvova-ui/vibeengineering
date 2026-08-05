import { useEffect } from "react";
import type { RefObject } from "react";
import { GRID } from "@/data/structuralGrid";

/**
 * Ферма Уоррена на Canvas 2D под заголовком Hero.
 *
 * MVP: геометрия — регулярная треугольная решётка с ролями стержней (пояса,
 * силовые пояса, раскосы). Реакция на курсор — radial distance: чем ближе
 * курсор, тем ярче линия, у самого курсора добавляется акцент. Никакой передачи
 * усилий, прогиба и опор — это выброшено осознанно, см. docs/SPEC-hero-truss.md.
 *
 * Режимы:
 *   static — prefers-reduced-motion ИЛИ touch. Один кадр, без rAF и без
 *            pointer-листенеров. ResizeObserver остаётся: иначе после поворота
 *            экрана канва останется растянутой.
 *   live   — rAF с троттлом до GRID.fps, «дыхание» + фонарик.
 *
 * Хук ничего не рендерит и ни разу не вызывает setState: состояние живёт
 * в замыкании и типизированных массивах.
 */

const Q_REDUCE = "(prefers-reduced-motion: reduce)";
const Q_FINE = "(hover: hover) and (pointer: fine)";

const ROLE_WEB = 0;
const ROLE_CHORD = 1;
const ROLE_MAJOR = 2;

/** Стили батчей: [цвет, ширина линии в CSS px]. Индексы 0..2 — покой, дальше тиры нагрузки. */
const IDLE_STYLES: ReadonlyArray<readonly [string, number]> = [
  [`rgba(136,136,136,${GRID.idleAlpha.web})`, 1],
  [`rgba(136,136,136,${GRID.idleAlpha.chord})`, 1.2],
  [`rgba(136,136,136,${GRID.idleAlpha.major})`, 1.5],
];

const TIER_STYLES: ReadonlyArray<readonly [string, number]> = [
  ["rgba(244,244,240,0.10)", 1.1],
  ["rgba(244,244,240,0.18)", 1.25],
  ["rgba(244,244,240,0.30)", 1.4],
  ["rgba(255,79,0,0.42)", 1.6],
  ["rgba(255,79,0,0.60)", 1.9],
];

export function useStructuralGrid(
  hostRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
): void {
  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    // Канва может быть недоступна: исчерпание контекстов, падение GPU-процесса,
    // блокировка anti-fingerprint-расширением. Тогда просто ничего не рисуем —
    // Hero выглядит законченным и без фона.
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      return;
    }
    if (!ctx) return;
    const c = ctx;

    const abort = new AbortController();
    const { signal } = abort;
    const mqReduce = window.matchMedia(Q_REDUCE);
    const mqFine = window.matchMedia(Q_FINE);

    // ── геометрия ────────────────────────────────────────────────────────────
    let baseX = new Float32Array(0);
    let baseY = new Float32Array(0);
    let mode = new Float32Array(0); // предвычисленная форма «дыхания»
    let curY = new Float32Array(0);
    let tension = new Float32Array(0);
    let edgeA = new Uint16Array(0);
    let edgeB = new Uint16Array(0);
    let edgeRole = new Uint8Array(0);
    let nodeCount = 0;
    let edgeCount = 0;

    let cssW = 0;
    let cssH = 0;
    let dpr = 1;

    // Батчи переиспользуются между кадрами: length = 0 не освобождает ёмкость.
    const buckets: number[][] = Array.from(
      { length: IDLE_STYLES.length + TIER_STYLES.length },
      () => [],
    );

    function build(width: number, height: number) {
      let spacing =
        width < 768 ? GRID.spacing.sm : width < 1280 ? GRID.spacing.md : GRID.spacing.lg;

      // Один проход подгонки под потолок узлов — sqrt сходится сразу.
      const rough = (width / spacing + 2) * (height / (spacing * 0.866) + 2);
      if (rough > GRID.maxNodes) spacing *= Math.sqrt(rough / GRID.maxNodes);

      const rowY = spacing * 0.866;
      const cols = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / rowY) + 2;
      // Смещаем начало на полшага, чтобы ферма уходила под обрез, а не упиралась в рамку.
      const originX = -spacing;
      const originY = -rowY;

      nodeCount = cols * rows;
      baseX = new Float32Array(nodeCount);
      baseY = new Float32Array(nodeCount);
      mode = new Float32Array(nodeCount);
      curY = new Float32Array(nodeCount);
      tension = new Float32Array(nodeCount);

      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const i = r * cols + col;
          const x = originX + col * spacing + (r & 1 ? spacing / 2 : 0);
          baseX[i] = x;
          baseY[i] = originY + r * rowY;
          // Первая изгибная форма пролёта: закреплена по краям, максимум в центре.
          mode[i] = Math.sin(Math.PI * Math.min(1, Math.max(0, x / width)));
        }
      }

      // Рёбра по правилу «только вперёд»: каждое ровно один раз, без дедупликации.
      const a: number[] = [];
      const b: number[] = [];
      const role: number[] = [];
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const i = r * cols + col;
          if (col + 1 < cols) {
            a.push(i);
            b.push(i + 1);
            role.push(r % GRID.majorChordEvery === 0 ? ROLE_MAJOR : ROLE_CHORD);
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

    function resize() {
      const rect = host!.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w === 0 || h === 0) return false;

      cssW = w;
      cssH = h;
      dpr = Math.min(window.devicePixelRatio || 1, GRID.dprCap);
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      // setTransform, а НЕ scale: scale накапливается при повторном прогоне
      // эффекта в StrictMode/HMR, и всё уезжает в масштаб 4x.
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      build(w, h);
      return true;
    }

    // ── состояние указателя ──────────────────────────────────────────────────
    const FAR = -1e5;
    let targetX = FAR;
    let targetY = FAR;
    let px = FAR;
    let py = FAR;
    let scrollY = window.scrollY;

    function draw(timeMs: number, animated: boolean) {
      const R = GRID.loadRadius;
      const invR2 = 1 / (R * R);

      const ambient = animated
        ? GRID.ambientAmplitude * Math.sin((2 * Math.PI * timeMs) / GRID.ambientPeriodMs)
        : 0;

      // Курсор игнорируется, если страница прокручена: шапка fixed, а канва едет
      // вместе с секцией, и верхний рамп маски её больше не прикрывает.
      const active = animated && scrollY <= GRID.scrollGatePx;
      const cx = active ? px : FAR;
      const cy = active ? py : FAR;

      for (let i = 0; i < nodeCount; i++) {
        const y = baseY[i] + ambient * mode[i];
        const dx = baseX[i] - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        let t = 0;
        if (d2 < R * R) {
          const q = 1 - d2 * invR2;
          t = q * q; // C¹-гладко на границе: без кольца на краю радиуса
        }
        tension[i] = t;
        curY[i] = GRID.nudge !== 0 ? y + GRID.nudge * t : y;
      }

      for (const bucket of buckets) bucket.length = 0;

      const thresholds = GRID.tierThresholds;
      for (let e = 0; e < edgeCount; e++) {
        const ia = edgeA[e];
        const ib = edgeB[e];
        const s = 0.5 * (tension[ia] + tension[ib]);

        let tier = -1;
        for (let k = thresholds.length - 1; k >= 0; k--) {
          if (s >= thresholds[k]) {
            tier = k;
            break;
          }
        }
        // Не пускаем акцент в полосу шапки: mix-blend-difference превращает
        // оранжевую линию под белым «VE» в голубую вспышку.
        if (tier >= GRID.accentFromTier) {
          const midY = 0.5 * (curY[ia] + curY[ib]);
          if (midY < GRID.accentBanAboveY) tier = GRID.accentFromTier - 1;
        }

        buckets[tier < 0 ? edgeRole[e] : IDLE_STYLES.length + tier].push(e);
      }

      c.clearRect(0, 0, cssW, cssH);

      for (let k = 0; k < buckets.length; k++) {
        const bucket = buckets[k];
        if (bucket.length === 0) continue;
        const [color, lw] =
          k < IDLE_STYLES.length ? IDLE_STYLES[k] : TIER_STYLES[k - IDLE_STYLES.length];
        c.strokeStyle = color;
        c.lineWidth = lw;
        c.beginPath();
        for (const e of bucket) {
          const ia = edgeA[e];
          const ib = edgeB[e];
          c.moveTo(baseX[ia], curY[ia]);
          c.lineTo(baseX[ib], curY[ib]);
        }
        c.stroke();
      }

      // Узлы — квадраты, а не круги: фасонка, а не частица. Плюс нет флаттенинга кривой.
      c.fillStyle = `rgba(136,136,136,${GRID.idleAlpha.node})`;
      c.beginPath();
      for (let i = 0; i < nodeCount; i++) c.rect(baseX[i] - 1, curY[i] - 1, 2, 2);
      c.fill();
    }

    // ── режимы ───────────────────────────────────────────────────────────────
    let raf = 0;
    let lastDraw = 0;
    let visible = true;
    const frameMs = 1000 / GRID.fps;

    const isStatic = () => mqReduce.matches || !mqFine.matches;

    function loop(now: number) {
      raf = requestAnimationFrame(loop);
      if (now - lastDraw < frameMs - 1) return;
      lastDraw = now;

      // Экспоненциальный лерп: нагрузку тащат по конструкции, а не телепортируют.
      const k = 1 - Math.exp(-frameMs / GRID.tauPointerMs);
      px += (targetX - px) * k;
      py += (targetY - py) * k;

      draw(now, true);
    }

    function stopLoop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function startLoop() {
      if (raf || !visible) return;
      lastDraw = 0;
      raf = requestAnimationFrame(loop);
    }

    function apply() {
      stopLoop();
      const staticMode = isStatic();
      if (staticMode) {
        px = FAR;
        py = FAR;
      }
      // Первый кадр рисуем синхронно, не дожидаясь rAF: иначе на старте
      // (и везде, где rAF придушен — фоновая вкладка, свёрнутое окно) секция
      // какое-то время стоит с пустым фоном.
      draw(performance.now(), !staticMode);
      if (!staticMode) startLoop();
    }

    // ── подписки (все под одним AbortController) ─────────────────────────────
    if (!resize()) return;

    window.addEventListener(
      "pointermove",
      (e) => {
        // В статическом режиме курсора нет вовсе: draw() всё равно рисует с
        // px = FAR. Без этой проверки каждое движение пальца по экрану платит
        // за getBoundingClientRect, результат которого гарантированно выбросят.
        if (isStatic()) return;
        const rect = host.getBoundingClientRect();
        targetX = e.clientX - rect.left;
        targetY = e.clientY - rect.top;
        if (px === FAR) {
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
        if (document.hidden) stopLoop();
        else if (!isStatic()) startLoop();
      },
      { signal },
    );

    mqReduce.addEventListener("change", apply, { signal });
    mqFine.addEventListener("change", apply, { signal });

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (resize()) apply();
      }, GRID.resizeDebounceMs);
    });
    ro.observe(host);

    // Hero занимает первый экран страницы высотой ~7000 px: ниже него цикл
    // просто не существует. Самая крупная экономия батареи во всей схеме.
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
    // перевёрстывается при подмене фоллбэка. Полагаться только на ResizeObserver
    // здесь нельзя — один неверный первый замер иначе застревает навсегда.
    document.fonts?.ready
      .then(() => {
        if (signal.aborted) return;
        if (resize()) apply();
      })
      .catch(() => {});

    return () => {
      abort.abort();
      ro.disconnect();
      io.disconnect();
      window.clearTimeout(resizeTimer);
      stopLoop();
    };
  }, [hostRef, canvasRef]);
}
