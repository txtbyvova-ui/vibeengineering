import { useEffect, useMemo, useRef } from "react";
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

  // Размер и сдвиг считаются от ВИДИМОЙ ширины кадра в мировых единицах:
  // в пикселях это разъехалось бы на другом соотношении сторон, а на узком
  // экране фигура вылезла бы за кадр.
  const [scale, offsetX] = useMemo(() => {
    const [lo, hi] = WIRE.scaleClamp;
    const s = Math.min(hi, Math.max(lo, viewport.width * WIRE.scaleRatio));
    // На мобиле сдвигать некуда — там фигура лежит за текстом по центру.
    const x = mode === "quiet" ? 0 : viewport.width * WIRE.offsetXRatio;
    return [s, x];
  }, [viewport.width, mode]);

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
      position={[offsetX, 0, 0]}
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
 * Маска канвы гасит ПРАВЫЙ край — там висит панель параметров, и проволока
 * не должна лезть под ползунки. Раньше гасился левый, потому что фигура стояла
 * справа; знак сдвига (`WIRE.offsetXRatio`) и сторона маски связаны жёстко.
 */
const SCENE_MASK =
  "linear-gradient(to left, transparent 0%, rgba(0,0,0,0.12) 16%, rgba(0,0,0,0.6) 30%, #000 44%)";

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

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        // Левый край гасим: там оффер, и он обязан выигрывать у фона.
        // На мобиле фигура лежит за всем текстом, поэтому там гасим целиком слабее.
        style={{
          maskImage: SCENE_MASK,
          WebkitMaskImage: SCENE_MASK,
          // Фигура стоит слева-в-центре, то есть прямо под заголовком.
          // Приглушение — то, чем оффер выигрывает у фона: без него
          // проволока спорит с h1 за внимание.
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
        <div className="pointer-events-auto absolute right-5 top-28 z-20 w-[228px] md:right-10 md:top-32">
          <div className="mb-1.5 flex items-baseline justify-between border-b border-accent/25 pb-1.5">
            <span lang="en" className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
              {heroWireframe.panelTitle}
            </span>
          </div>
          <Leva fill titleBar={false} theme={LEVA_THEME} />
          <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-textMuted">
            {heroWireframe.panelNote}
          </p>
        </div>
      ) : (
        // Панель у leva самомонтируется в body, если её не отрендерить явно —
        // на мобиле она перекрыла бы текст, поэтому гасим сознательно.
        <Leva hidden />
      )}
    </>
  );
}
