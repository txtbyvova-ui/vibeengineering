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
  const geometry = useWireframeGeometry(params.geometry);
  const invalidate = useThree((s) => s.invalidate);
  const viewport = useThree((s) => s.viewport);

  // Размер и сдвиг считаются от ВИДИМЫХ размеров кадра в мировых единицах:
  // в пикселях это разъехалось бы на другом соотношении сторон, а на узком
  // экране фигура вылезла бы за кадр. По вертикали — от высоты, не от ширины:
  // панель, из-под которой мы уводим фигуру, стоит в пикселях от верха.
  const [scale, offsetX, offsetY] = useMemo(() => {
    const [lo, hi] = WIRE.scaleClamp;
    const s = Math.min(hi, Math.max(lo, viewport.width * WIRE.scaleRatio));
    // На мобиле сдвигать некуда — там фигура лежит за текстом по центру,
    // и панели, от которой надо уворачиваться, тоже нет.
    const x = mode === "quiet" ? 0 : viewport.width * WIRE.offsetXRatio;
    const y = mode === "quiet" ? 0 : viewport.height * WIRE.offsetYRatio;
    return [s, x, y];
  }, [viewport.width, viewport.height, mode]);

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
  fontSizes: { root: "10px" },
  sizes: { rootWidth: "100%", controlWidth: "104px", rowHeight: "22px", scrubberWidth: "8px" },
  radii: { xs: "0px", sm: "0px", lg: "0px" },
  space: { sm: "6px", md: "8px", rowGap: "5px", colGap: "6px" },
  borderWidths: { root: "1px", input: "1px", focus: "1px" },
};

/**
 * Маска канвы гасит ЛЕВЫЙ край — там стоит оффер, и он обязан выигрывать у фона.
 * Сторона маски и знак `WIRE.offsetXRatio` связаны жёстко: гаснет тот край,
 * где фигуры нет. За смену стороны 2026-08-12 перевёрнуты оба.
 *
 * ⚠️ **Стопы заданы в `rem`, а не в процентах, и это принципиально.** Текст
 * Hero ограничен колонкой `max-w-[52rem]` плюс `px-10`, то есть его правый край
 * не может уйти дальше 54.5 rem ни на какой ширине окна — строка не бывает шире
 * колонки. Порог 55 rem привязан ровно к этой границе и потому держит текст
 * в тени везде.
 *
 * Процентные пороги здесь пробовались и не годятся: на 1024 px колонка занимает
 * 81 % экрана, и процент, достаточный для 1920, пускал проволоку под заголовок.
 * Замерено 2026-08-12: при пороге 68 % правый край h1 на 1024 приходился
 * на альфу маски 0.50 — проволока читалась сквозь текст.
 *
 * Цена абсолютных порогов — узкий десктоп: на 1024 фигуре остаётся 144 px
 * справа, и полной яркости она там не набирает. Это осознанный размен в пользу
 * читаемости оффера; на 1280 и выше фигура открыта нормально.
 *
 * Проверять после любой правки колонки Hero: замер — правый край самой длинной
 * строки против первого непрозрачного стопа.
 */
const SCENE_MASK =
  "linear-gradient(to right, transparent 0, transparent 55rem, rgba(0,0,0,0.35) 60rem, #000 67rem)";

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
          camera={{ position: [0, 0, 2.75], fov: 45 }}
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
        <div className="pointer-events-auto absolute right-5 top-20 z-20 w-[236px] md:right-10 md:top-24">
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
            <div id={panelId} className="mt-1.5 border border-hairline bg-bg/95 p-2.5">
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
