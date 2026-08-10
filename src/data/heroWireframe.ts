/**
 * Hero «Redline Tech»: копирайт первого экрана и ручки wireframe-сцены.
 *
 * Палитра здесь СВОЯ и намеренно расходится с брендовой (`#0D0D0D` / `#FF4F00`):
 * это прототип отдельного визуального направления. Цвета применяются только
 * к секции Hero, глобальные токены в `tailwind.config.js` не трогаются —
 * иначе правка растекается на всю страницу.
 */

export type WireGeometryKind = "torusKnot" | "sphere" | "icosahedron";

export const REDLINE = {
  /** Фон секции. Глубже брендового #0D0D0D. */
  bg: "#070709",
  /** Основная обводка — неоновый красный. */
  stroke: "#FF2E2E",
  /** Задняя стенка и второй штрих. */
  strokeBack: "#B00020",
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
   * Фигура смещена вправо и уменьшена: слева живёт оффер, и приоритет за ним.
   * Доля от видимой ширины кадра, а не пиксели — иначе поедет на другом аспекте.
   */
  offsetXRatio: 0.2,
  scaleRatio: 0.23,
  scaleClamp: [0.42, 0.85] as const,

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
  /** Ниже этой ширины — мобильный режим: без пунктирной анимации и без панели. */
  mobileMaxWidth: 768,
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
