import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Leva, useControls } from "leva";
import { Color, DoubleSide, Mesh, ShaderMaterial } from "three";
import { WIRE, WIRE_COLOR, heroWireframe, type WireGeometryKind } from "@/data/heroWireframe";
import { PALETTE } from "@/data/palette";
import { useSceneLoop } from "@/hooks/useSceneLoop";
import { useWireframeGeometry } from "@/hooks/useWireframeGeometry";
import { WIREFRAME_FRAG, WIREFRAME_VERT } from "@/shaders/wireframe";

/**
 * Wireframe-сцена первого экрана на барицентрических координатах.
 * Техника и шейдеры — mattdesl/webgl-wireframes (MIT), см. шапку
 * [shaders/wireframe.ts](@/shaders/wireframe).
 *
 * Файл грузится ТОЛЬКО динамическим импортом: здесь three и leva, и в основной
 * чанк они попадать не должны.
 */

/** Режим сцены. Решение принимает HeroWireframe, сцена только исполняет. */
export type WireMode = "full" | "quiet" | "frozen";

/**
 * Камера. Вынесена в константы, потому что теперь по ним считается не только
 * рендер, но и вписывание фигуры в свободную полосу первого экрана —
 * два места должны видеть одни и те же числа. Задаются ниже в `<Canvas camera>`.
 */
const CAMERA_Z = 2.75;
const CAMERA_FOV = 45;

/**
 * Корневой кегль в пикселях. Все рубежи первого экрана заданы в `rem`
 * (колонка текста, стопы маски), а меш живёт в пикселях кадра — здесь курс
 * обмена. Читается один раз: у страницы нет ни одного места, где он менялся бы
 * в рантайме, а вот у посетителя он может быть не 16, и тогда вместе с колонкой
 * обязан поехать и рубеж посадки фигуры.
 */
function useRootFontPx(): number {
  return useMemo(() => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16, []);
}

interface Props {
  hostRef: RefObject<HTMLElement | null>;
  /**
   * `full` — панель, бегущий пунктир, вращение (десктоп).
   * `quiet` — без панели и без анимации пунктира, медленное вращение (мобила).
   * `frozen` — ровно один кадр, ничего не двигается (prefers-reduced-motion).
   */
  mode: WireMode;
  /**
   * Показывать панель. Отдельный флаг, а не производное от режима: планшету
   * анимация не мешает, а ползунки наезжают на заголовок — пороги развязаны.
   */
  showPanel: boolean;
}

interface WireParams {
  geometry: WireGeometryKind;
  thickness: number;
  dashAnimate: boolean;
  dashRepeats: number;
  dualStroke: boolean;
  squeeze: boolean;
}

// ── меш ─────────────────────────────────────────────────────────────────────

function WireMesh({ params, mode }: { params: WireParams; mode: WireMode }) {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<ShaderMaterial>(null);
  const geometryKind = params.geometry;
  const geometry = useWireframeGeometry(geometryKind);
  const invalidate = useThree((s) => s.invalidate);
  const viewport = useThree((s) => s.viewport);

  /**
   * Размер и положение фигуры.
   *
   * По горизонтали — доля от видимой ШИРИНЫ кадра в мировых единицах:
   * в пикселях это разъехалось бы на другом соотношении сторон.
   *
   * По вертикали — иначе, и в этом вся суть правки 2026-08-13. Панель
   * параметров занимает фиксированную полосу в ПИКСЕЛЯХ от верха
   * (`WIRE.panelReservedPx`), а фигура живёт в мировых единицах. Любой
   * фиксированный `offsetYRatio` поэтому промахивался: доля от высоты даёт
   * на коротком экране меньше пикселей, чем на высоком, а панель короче
   * не становится. Замерено на прежнем `-0.09`: на 1280×720 фигура заезжала
   * под панель на 20 px, на 1024×600 — на 38.
   *
   * Теперь считаем честно: переводим пиксельную полосу в мировые единицы
   * курсом кадра, вписываем фигуру в остаток и центрируем её там. Гарантия
   * «не перекрывает панель» становится арифметической, а не подобранной.
   */
  const size = useThree((s) => s.size);
  const rootFontPx = useRootFontPx();

  const [scale, offsetX, offsetY] = useMemo(() => {
    const [lo, hi] = WIRE.scaleClamp;

    // На мобиле разводить не с чем: панели нет, фигура лежит за текстом по центру.
    if (mode === "quiet") {
      return [Math.min(hi, Math.max(lo, viewport.width * WIRE.scaleRatio)), 0, 0];
    }

    const worldPerPx = viewport.height / size.height;
    const freePx = size.height - WIRE.panelReservedPx - WIRE.figureGapPx * 2;
    const radius = WIRE.boundingRadius[geometryKind];
    /**
     * Потолок по высоте — жёсткий: он и есть обещание «фигура не под панелью».
     *
     * Считаем через угловой радиус, а не пропорцией: камера перспективная,
     * ближняя к ней сторона фигуры проецируется крупнее дальней. Линейная
     * прикидка ошибалась на 1.5 % и роняла низ фигуры на 3 px за край экрана.
     * Силуэт сферы радиуса R с расстояния d виден под углом asin(R/d), отсюда
     * обратный ход: из доли кадра → тангенс → синус → радиус.
     */
    const tanHalfFov = Math.tan((CAMERA_FOV / 2) * (Math.PI / 180));
    /** Мировой радиус, вписанный в полосу высотой `freePx`. Фигура там по центру,
     *  то есть по вертикали она на оси кадра и перекос перспективы ей не грозит. */
    const byHeight = CAMERA_Z * Math.sin(Math.atan((freePx / size.height) * tanHalfFov));

    /**
     * ⚠️ **Горизонталь считается ТАК ЖЕ, как вертикаль: от пикселей, а не долей.**
     *
     * Свободная пустота справа зажата между двумя пиксельными величинами:
     * правой границей текста (`textSafeRem` — тот самый рубеж, где маска
     * гасит канву в ноль) и краем экрана. Фигура садится ровно в середину
     * этой полосы и в неё же вписывается по размеру, то есть не липнет
     * ни к тексту, ни к правому краю по построению.
     *
     * Прежний `offsetXRatio` был долей ширины и этого не знал: на 1280 левый
     * край фигуры уходил на 796 px при рубеже 880 — 84 px фигуры лежали
     * в нулевой альфе и просто не рисовались, а остальное тонуло в рампе.
     * Выглядело это как «сфера прижата к правому краю», хотя центр стоял на 75 %:
     * видна была только правая, яркая её часть.
     */
    const safePx = WIRE.textSafeRem * rootFontPx;
    const bandLeft = safePx + WIRE.sideGapPx;
    const bandRight = size.width - WIRE.sideGapPx;
    const halfWidthWorld = tanHalfFov * (size.width / size.height) * CAMERA_Z;
    const toNdc = (px: number) => (px - size.width / 2) / (size.width / 2);
    const targetCenter = toNdc((bandLeft + bandRight) / 2);
    const targetHalf = ((bandRight - bandLeft) / 2) / (size.width / 2);

    /**
     * ⚠️ **Силуэт off-axis сферы НЕ центрирован на проекции её центра.**
     *
     * Камера перспективная: ближний к ней край фигуры проецируется крупнее,
     * и силуэт уезжает наружу от оси кадра. Первый заход этой правки считал
     * положение по проекции центра — фигуру вынесло на 17 px вправо, до правого
     * края осталось 9 px. Поэтому берём честные касательные: с расстояния
     * `dist` шар радиуса `R` виден под углом `asin(R/dist)`, а сам центр стоит
     * под углом `atan(cx/z)`. Границы силуэта — тангенсы суммы и разности.
     */
    const silhouette = (r: number, cx: number) => {
      const dist = Math.hypot(cx, CAMERA_Z);
      const a = Math.atan2(cx, CAMERA_Z);
      const b = Math.asin(Math.min(0.999, r / dist));
      const k = tanHalfFov * (size.width / size.height);
      return [Math.tan(a - b) / k, Math.tan(a + b) / k] as const;
    };

    // Простая неподвижная точка: ужать под полосу → доцентровать → повторить.
    // Отображение монотонное и гладкое, четырёх шагов хватает с запасом.
    let r = Math.min(hi * radius, byHeight, targetHalf * halfWidthWorld);
    let cx = targetCenter * halfWidthWorld;
    for (let i = 0; i < 4; i++) {
      const [l0, r0] = silhouette(r, cx);
      r = Math.min(r * Math.min(1, targetHalf / ((r0 - l0) / 2)), byHeight, hi * radius);
      const [l1, r1] = silhouette(r, cx);
      cx += (targetCenter - (l1 + r1) / 2) * halfWidthWorld;
    }

    const centerYPx = WIRE.panelReservedPx + WIRE.figureGapPx + freePx / 2;
    return [
      r / radius,
      cx,
      // Мировая ось Y смотрит вверх, экранная — вниз, отсюда знак.
      (size.height / 2 - centerYPx) * worldPerPx,
    ];
  }, [viewport.height, size.width, size.height, mode, geometryKind, rootFontPx]);

  // Объект uniform'ов создаётся один раз; дальше мутируем `.value`, иначе
  // ShaderMaterial перекомпилируется на каждое движение ползунка.
  const uniforms = useMemo(
    () => ({
      // Типы расширяем явно: WIRE объявлен `as const`, и без этого поля
      // получают литеральные типы и перестают быть изменяемыми.
      time: { value: 0 as number },
      thickness: { value: WIRE.thickness as number },
      secondThickness: { value: WIRE.secondThickness as number },
      dashRepeats: { value: WIRE.dashRepeats as number },
      dashLength: { value: WIRE.dashLength as number },
      dashOverlap: { value: WIRE.dashOverlap as boolean },
      dashEnabled: { value: WIRE.dashEnabled as boolean },
      dashAnimate: { value: WIRE.dashAnimate as boolean },
      seeThrough: { value: WIRE.seeThrough as boolean },
      insideAltColor: { value: WIRE.insideAltColor as boolean },
      dualStroke: { value: WIRE.dualStroke as boolean },
      squeeze: { value: WIRE.squeeze as boolean },
      squeezeMin: { value: WIRE.squeezeMin as number },
      squeezeMax: { value: WIRE.squeezeMax as number },
      stroke: { value: new Color(WIRE_COLOR.stroke) },
      strokeBack: { value: new Color(WIRE_COLOR.strokeBack) },
      fill: { value: new Color(WIRE_COLOR.fill) },
    }),
    [],
  );

  // Синхронизация ползунков с uniform'ами. В режиме `frozen` кадры выдаёт
  // R3F по требованию, поэтому явно просим перерисовать.
  useEffect(() => {
    uniforms.thickness.value = params.thickness;
    uniforms.dashRepeats.value = params.dashRepeats;
    uniforms.dualStroke.value = params.dualStroke;
    uniforms.squeeze.value = params.squeeze;
    // Бегущий пунктир — единственная анимация, которую гасит режим.
    uniforms.dashAnimate.value = mode === "full" && params.dashAnimate;
    // Внутренний штрих обязан быть тоньше основного, иначе dual stroke
    // выглядит как просто утолщение линии.
    uniforms.secondThickness.value = Math.min(WIRE.secondThickness, params.thickness * 0.4);
    invalidate();
  }, [params, mode, uniforms, invalidate]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1);
    if (mode === "frozen") return;
    if (uniforms.dashAnimate.value) uniforms.time.value += dt;
    const mesh = meshRef.current;
    if (mesh) {
      mesh.rotation.x += WIRE.spin.x * dt;
      mesh.rotation.y += WIRE.spin.y * dt;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[offsetX, offsetY, 0]}
      scale={scale}
      frustumCulled={false}
    >
      <shaderMaterial
        ref={matRef}
        vertexShader={WIREFRAME_VERT}
        fragmentShader={WIREFRAME_FRAG}
        uniforms={uniforms}
        transparent
        // DoubleSide обязателен: без задних граней gl_FrontFacing всегда true
        // и backface coloring не существует.
        side={DoubleSide}
        // Без этого передние грани перекрывают задние по глубине, и сквозной
        // режим перестаёт быть сквозным.
        depthWrite={false}
      />
    </mesh>
  );
}

// ── панель ──────────────────────────────────────────────────────────────────

/** Тёмная тема панели под палитру Redline и моно-шрифт проекта. */
const LEVA_THEME = {
  colors: {
    elevation1: PALETTE.bg,
    elevation2: "rgba(17,17,19,0.88)",
    elevation3: PALETTE.surface,
    accent1: PALETTE.accent,
    accent2: PALETTE.accent,
    accent3: PALETTE.accentMuted,
    highlight1: "#77777f",
    highlight2: "#b9b9c2",
    highlight3: PALETTE.textMain,
    vivid1: PALETTE.accent,
  },
  fonts: { mono: "'JetBrains Mono', ui-monospace, monospace", sans: "'JetBrains Mono', monospace" },
  // Компактнее стока: панель делит первый экран с фигурой, и каждый её пиксель
  // по высоте — пиксель, отобранный у фигуры (см. PANEL_RESERVED_PX).
  // Замер после сжатия: развёрнутая панель 215 → 176 px по высоте, 236 → 204 по ширине.
  fontSizes: { root: "9px" },
  sizes: { rootWidth: "100%", controlWidth: "88px", rowHeight: "18px", scrubberWidth: "7px" },
  radii: { xs: "0px", sm: "0px", lg: "0px" },
  space: { sm: "5px", md: "6px", rowGap: "3px", colGap: "5px" },
  borderWidths: { root: "1px", input: "1px", focus: "1px" },
};

/**
 * Маска канвы гасит ЛЕВЫЙ край — там стоит оффер, и он обязан выигрывать у фона.
 *
 * ⚠️ **Стопы заданы в `rem` и собираются из `WIRE.textSafeRem`, а не пишутся
 * числами.** Текст Hero ограничен колонкой `max-w-[52rem]` плюс `px-10`, то есть
 * его правый край не уходит дальше 54.5 rem ни на какой ширине окна — строка
 * не бывает шире колонки. Тот же рубеж читает математика посадки фигуры, так что
 * маска и меш физически не могут разъехаться.
 *
 * Процентные пороги здесь пробовались и не годятся: на 1024 px колонка занимает
 * 81 % экрана, и процент, достаточный для 1920, пускал проволоку под заголовок.
 * Замерено 2026-08-12: при пороге 68 % правый край h1 на 1024 приходился
 * на альфу маски 0.50 — проволока читалась сквозь текст.
 *
 * ⚠️ **Рампа короткая — ровно `sideGapPx`.** Раньше она тянулась от 55 до 67 rem,
 * и фигура на 1280 почти целиком лежала внутри неё: яркой была только правая
 * кромка, отчего сфера и читалась «прижатой к правому краю», хотя её центр стоял
 * на 75 % ширины. Теперь фигура садится ровно там, где рампа кончается: гаснуть
 * у неё нечему, а текст по-прежнему в зоне нулевой альфы и недосягаем.
 * Резкость края никого не смущает — гасить левее фигуры попросту нечего,
 * канва там прозрачная.
 *
 * Проверять после любой правки колонки Hero: замер — правый край самой длинной
 * строки против первого непрозрачного стопа.
 */
const SCENE_MASK = `linear-gradient(to right, transparent 0, transparent ${WIRE.textSafeRem}rem, #000 ${
  WIRE.textSafeRem + WIRE.sideGapPx / 16
}rem)`;

/**
 * То же для мобилы: там текстовой колонки нет, текст идёт во всю ширину,
 * и абсолютные стопы погасили бы канву целиком — 52 rem шире любого телефона.
 * Поэтому здесь проценты, а фигура и так приглушена до 0.42.
 */
const SCENE_MASK_QUIET =
  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.45) 34%, #000 64%)";

const GEOMETRY_OPTIONS: Record<string, WireGeometryKind> = {
  TorusKnot: "torusKnot",
  Sphere: "sphere",
  Icosahedron: "icosahedron",
};

// ── корень ──────────────────────────────────────────────────────────────────

export default function WireframeHeroCanvas({ hostRef, mode, showPanel }: Props) {
  const params = useControls({
    geometry: { value: WIRE.geometry, options: GEOMETRY_OPTIONS, label: "geometry" },
    thickness: {
      value: WIRE.thickness,
      min: WIRE.thicknessRange[0],
      max: WIRE.thicknessRange[1],
      step: 0.005,
    },
    dashAnimate: { value: WIRE.dashAnimate, label: "dash animate" },
    dashRepeats: {
      value: WIRE.dashRepeats,
      min: WIRE.dashRepeatsRange[0],
      max: WIRE.dashRepeatsRange[1],
      step: 1,
      label: "dash repeats",
    },
    dualStroke: { value: WIRE.dualStroke, label: "dual stroke" },
    squeeze: { value: WIRE.squeeze },
  }) as WireParams;

  const { dprCap } = useSceneLoop(hostRef, {
    fpsCap: 60,
    minFps: 24,
    dprCap: WIRE.dprCap,
    // В frozen кадр выдаёт R3F по требованию — свой цикл не нужен вовсе.
    enabled: mode !== "frozen",
  });

  const mask = mode === "quiet" ? SCENE_MASK_QUIET : SCENE_MASK;
  // Свёрнута по умолчанию: развёрнутая панель стоит поверх фигуры, разбор — ниже.
  const [panelOpen, setPanelOpen] = useState(false);
  const panelId = useId();

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          // Гасим ЛЕВЫЙ край — там оффер. На мобиле текстовой колонки нет,
          // поэтому маска своя, процентная: разбор у обеих констант выше.
          maskImage: mask,
          WebkitMaskImage: mask,
          // Фигура стоит справа-в-центре и на текст больше не заходит, но
          // приглушение оставлено: фон первого экрана не должен тянуть взгляд
          // с оффера, даже стоя от него в стороне.
          opacity: mode === "quiet" ? 0.42 : 0.58,
        }}
      >
        <Canvas
          frameloop={mode === "frozen" ? "demand" : "never"}
          dpr={[1, dprCap]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
        >
          <WireMesh params={params} mode={mode} />
        </Canvas>
      </div>

      {showPanel ? (
        /**
         * Панель СВЁРНУТА по умолчанию, и это не украшательство.
         *
         * Развёрнутая она занимает 236×242 и стоит в правом верхнем углу —
         * ровно там, где проходит фигура. Замер 2026-08-12: закрывала 19 %
         * её видимой площади на 1280×800. Развести их геометрией нельзя:
         * фигура вдвое выше панели, а первый экран не резиновый — считали
         * и сдвиг вниз, и уменьшение, всё упирается в высоту экрана.
         *
         * Свёрнутая — полоска 236×32 в самом верху: фигура на всех проверенных
         * ширинах начинается ниже (запас от 9 px на коротком 1024×600
         * до 141 px на 1920×1080), поэтому по умолчанию её не заслоняет ничто.
         * Развернуть — осознанное действие посетителя, и вот тогда плашка
         * ложится поверх фигуры; подложка `bg-bg/95` там для того, чтобы
         * проволока не лезла под ползунки (исходный дефект задачи 11.08).
         */
        // `top-24`, а не прежние `top-32`: свёрнутая полоска обязана уместиться
        // НАД фигурой, а её верх зависит от высоты окна. Замер по сетке — на
        // коротком 1024×600 запас был 1 px, после подъёма стал 33; на 1280×720
        // 33 → 65. Ниже шапки при этом остаётся 24 px даже в непрокрученном
        // состоянии (`py-6` у nav).
        <div className="pointer-events-auto absolute right-5 top-20 z-20 w-[204px] md:right-10 md:top-24">
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            aria-expanded={panelOpen}
            aria-controls={panelId}
            className="flex w-full items-center justify-between gap-3 border border-hairline bg-bg/95 px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-accent transition-colors duration-300 hover:border-accent/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span lang="en">{heroWireframe.panelTitle}</span>
            <span aria-hidden className="text-textMuted">
              {panelOpen ? "–" : "+"}
            </span>
          </button>

          {panelOpen ? (
            <div id={panelId} className="mt-1.5 border border-hairline bg-bg/95 p-2">
              <Leva fill titleBar={false} theme={LEVA_THEME} />
              <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-textMuted">
                {heroWireframe.panelNote}
              </p>
            </div>
          ) : (
            // Пока свёрнута, leva всё равно должна получить явный рендер,
            // иначе она смонтирует собственную панель в body — см. ветку ниже.
            <Leva hidden />
          )}
        </div>
      ) : (
        // Панель у leva самомонтируется в body, если её не отрендерить явно —
        // на мобиле она перекрыла бы текст, поэтому гасим сознательно.
        <Leva hidden />
      )}
    </>
  );
}
