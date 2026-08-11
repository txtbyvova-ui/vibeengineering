/**
 * Hero: копирайт первого экрана и ручки wireframe-сцены.
 *
 * Палитра больше НЕ своя. С 2026-08-11 действует единая «Leica Racing»
 * из [palette.ts](./palette.ts) — она же глобальные токены Tailwind, она же
 * `:root` в `index.css`. Собственных цветов у Hero не осталось: прежний форк
 * (`#070709` / `#FF2E2E`) создавал шов на стыке Hero → Marquee, это был
 * открытый пункт бэклога §69 и он закрыт.
 */
import { PALETTE } from "@/data/palette";

export type WireGeometryKind = "torusKnot" | "sphere" | "icosahedron";

/**
 * Цвета для GLSL-uniform'ов: шейдер принимает `vec3`, а не CSS-класс, поэтому
 * hex нужен значением. Берётся из общей палитры — форка здесь быть не должно.
 */
export const WIRE_COLOR = {
  /** Основная обводка. */
  stroke: PALETTE.accent,
  /** Задняя стенка (backface) и внутренний штрих dual stroke. */
  strokeBack: PALETTE.accentMuted,
  /** Заливка внутри штриха; в режиме seeThrough не участвует. */
  fill: "#000000",
} as const;

export const WIRE = {
  /** Стартовая фигура панели. */
  geometry: "torusKnot" as WireGeometryKind,

  /**
   * Разбиение по фигурам. Барицентрика требует разындексированной геометрии,
   * то есть вершин втрое больше числа треугольников — плотность здесь стоит
   * втрое дороже обычного. Числа подобраны так, чтобы проволока читалась,
   * а вершин осталось в пределах десятков тысяч.
   */
  segments: {
    torusKnot: [104, 14],
    sphere: [26, 18],
    icosahedron: [3],
  } as Record<WireGeometryKind, number[]>,

  /**
   * Фигура смещена ВЛЕВО от центра: справа сверху висит панель параметров,
   * и при положительном сдвиге фигура заезжала под неё.
   *
   * ⚠️ Знак связан с маской канвы в `WireframeHeroCanvas`: гаснуть должен тот
   * край, где фигуры НЕТ. Поменяете знак — переверните и маску, иначе фигура
   * окажется в погашенной зоне и просто исчезнет.
   *
   * Доля от видимой ширины кадра, а не пиксели — иначе поедет на другом аспекте.
   */
  offsetXRatio: -0.16,
  scaleRatio: 0.21,
  scaleClamp: [0.4, 0.78] as const,

  /** Толщина штриха в единицах барицентрики: 0.5 — заливка целиком. */
  thickness: 0.045,
  thicknessRange: [0.01, 0.5] as const,
  /** Внутренний штрих режима dual stroke. Обязан быть меньше thickness. */
  secondThickness: 0.015,

  dashEnabled: true,
  dashAnimate: true,
  dashRepeats: 8,
  dashRepeatsRange: [1, 20] as const,
  dashLength: 0.55,
  dashOverlap: false,

  dualStroke: false,
  squeeze: true,
  squeezeMin: 0.1,
  squeezeMax: 1,

  /** Сквозной режим: без заливки, видно заднюю стенку. На нём держится backface. */
  seeThrough: true,
  insideAltColor: true,

  /** Вращение фигуры, рад/с. Медленное: фон не должен тянуть взгляд с оффера. */
  spin: { x: 0.055, y: 0.085 },
  /** Кап devicePixelRatio: заливка растёт как dpr². */
  dprCap: 2,
  /** Ниже этой ширины — режим `quiet`: без пунктирной анимации, фигура по центру. */
  mobileMaxWidth: 768,
  /**
   * Панель показывается только от этой ширины — отдельный порог, не тот же,
   * что у анимации. Замерено на 768x1024: панель шириной 228 px наезжала
   * на заголовок и прятала слово целиком. Планшету анимация не мешает,
   * а ползунки мешают, поэтому пороги развязаны.
   */
  panelMinWidth: 1024,
} as const;

/** Копирайт первого экрана. В компонентах пользовательских строк быть не должно. */
export const heroWireframe = {
  /** Строка логов над заголовком. Латиница — отсюда `lang="en"` в разметке. */
  logLine: ["[ SYSTEM: REDLINE_TECH ]", "[ SHADER: BARYCENTRIC_GLSL ]"] as const,

  headline: "Код, который не падает. Идеи, которые не забываются.",

  lead: "Строим digital-инфраструктуру с прочностью башенного крана и виральностью Тиндера.",

  /** ASCII-метрики: тег, стрелка, значение. Тег латиницей — тоже `lang="en"`. */
  metrics: [
    { tag: "ENG", value: "48 часов до запуска" },
    { tag: "VIRAL", value: "30M+ охватов в кампаниях" },
    { tag: "ENG", value: "0% даунтайма" },
  ] as const,

  cta: { label: "Обсудить проект", href: "https://t.me/vibeengineering" },

  /** Подпись под панелью — объясняет, что это не декор, а живые параметры шейдера. */
  panelTitle: "SHADER PARAMS",
  panelNote: "Живые параметры GLSL. Крутите.",
} as const;
