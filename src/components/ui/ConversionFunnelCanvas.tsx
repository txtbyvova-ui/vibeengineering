import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FUNNEL, funnelRadius, funnelY, ringDepths } from "@/data/funnel";
import { useFunnelLoop } from "@/hooks/useFunnelLoop";

/**
 * Воронка конверсии — процедурная 3D-сцена, ноль внешних ассетов.
 *
 * Читаемость метафоры важнее красоты, поэтому силуэт собран как воронка
 * (чаша + носик), а не как конус, поток идёт строго сверху вниз и ускоряется
 * к носику, а внизу стоит узел накопления, который вспыхивает на каждую
 * прибывшую частицу. Лиды входят широко, выходят в кассу.
 *
 * Файл грузится ТОЛЬКО динамическим импортом (см. HeroScene) — здесь сидит
 * весь three.js, и в основной чанк он попадать не должен.
 */

/** Разделяемое состояние потока: частицы пишут, касса читает. Без ре-рендеров. */
interface FlowState {
  flash: number;
  arrivals: number;
}

interface PointerState {
  x: number;
  y: number;
}

// ── каркас ──────────────────────────────────────────────────────────────────

/** Кольца и меридианы, слитые в две геометрии: два draw call на весь каркас. */
function useFrameGeometry() {
  return useMemo(() => {
    const thin: number[] = [];
    const major: number[] = [];
    const seg = FUNNEL.ringSegments;

    ringDepths().forEach((t, i) => {
      const target = i % FUNNEL.majorRingEvery === 0 ? major : thin;
      const r = funnelRadius(t);
      const y = funnelY(t);
      for (let s = 0; s < seg; s++) {
        const a0 = (s / seg) * Math.PI * 2;
        const a1 = ((s + 1) / seg) * Math.PI * 2;
        target.push(Math.cos(a0) * r, y, Math.sin(a0) * r);
        target.push(Math.cos(a1) * r, y, Math.sin(a1) * r);
      }
    });

    // Меридианы — они же направляющие: по ним читается «вниз».
    const STEPS = 44;
    for (let m = 0; m < FUNNEL.meridians; m++) {
      const a = (m / FUNNEL.meridians) * Math.PI * 2;
      const target = m % FUNNEL.majorMeridianEvery === 0 ? major : thin;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      let pr = funnelRadius(0);
      let py = funnelY(0);
      for (let s = 1; s <= STEPS; s++) {
        const t = s / STEPS;
        const r = funnelRadius(t);
        const y = funnelY(t);
        target.push(cos * pr, py, sin * pr);
        target.push(cos * r, y, sin * r);
        pr = r;
        py = y;
      }
    }

    return { thin: new Float32Array(thin), major: new Float32Array(major) };
  }, []);
}

function FunnelFrame() {
  const { thin, major } = useFrameGeometry();
  return (
    <group>
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[thin, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={FUNNEL.color.frame}
          transparent
          opacity={FUNNEL.color.frameOpacity}
          depthWrite={false}
        />
      </lineSegments>
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[major, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={FUNNEL.color.frameMajor}
          transparent
          opacity={FUNNEL.color.frameMajorOpacity}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

// ── поток ───────────────────────────────────────────────────────────────────

const FLOW_VERT = /* glsl */ `
  attribute float aAlpha;
  attribute float aSize;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / max(0.001, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

/** Круглая мягкая точка считается из gl_PointCoord — спрайт-текстура не нужна. */
const FLOW_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 d = gl_PointCoord - vec2(0.5);
    float r2 = dot(d, d) * 4.0;
    if (r2 > 1.0) discard;
    float a = pow(1.0 - r2, 1.7) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

function FlowParticles({ flow }: { flow: MutableRefObject<FlowState> }) {
  const N = FUNNEL.particles;
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  // Состояние частиц — в типизированных массивах, вне React.
  const state = useMemo(() => {
    const depth = new Float32Array(N);
    const angle = new Float32Array(N);
    const speed = new Float32Array(N);
    const wall = new Float32Array(N);
    const positions = new Float32Array(N * 3);
    const alphas = new Float32Array(N);
    const sizes = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      depth[i] = FUNNEL.spawnAt + Math.random() * (1 - FUNNEL.spawnAt);
      angle[i] = Math.random() * Math.PI * 2;
      speed[i] = FUNNEL.speed * (1 + (Math.random() - 0.5) * FUNNEL.speedJitter);
      wall[i] = (Math.random() * 2 - 1) * FUNNEL.wallJitter;
      sizes[i] = FUNNEL.pointSize * (1 + (Math.random() - 0.5) * FUNNEL.pointSizeJitter);
    }
    return { depth, angle, speed, wall, positions, alphas, sizes };
  }, [N]);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(FUNNEL.color.flow) },
      uScale: { value: 600 },
    }),
    [],
  );

  // Размер точки в пикселях = мировой размер · H / (2·tan(fov/2)) / расстояние.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const h = gl.getDrawingBufferSize(new THREE.Vector2()).y;
    uniforms.uScale.value = h / (2 * Math.tan((cam.fov * Math.PI) / 360));
  }, [size, gl, camera, uniforms]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1);
    const { depth, angle, speed, wall, positions, alphas } = state;
    let arrived = 0;

    for (let i = 0; i < N; i++) {
      let t = depth[i];
      const tc = t > 0 ? t : 0;
      t += speed[i] * (1 + FUNNEL.accel * tc * tc) * dt;

      if (t >= 1) {
        arrived++;
        // Перезапуск сверху: новый угол, иначе поток свернётся в спицы.
        t = FUNNEL.spawnAt * Math.random();
        angle[i] = Math.random() * Math.PI * 2;
        speed[i] = FUNNEL.speed * (1 + (Math.random() - 0.5) * FUNNEL.speedJitter);
      }
      depth[i] = t;

      const r = funnelRadius(t) * (1 + wall[i]);
      // Момент импульса: чем уже сечение, тем быстрее закрутка — вихрь у носика
      // получается сам, без отдельной анимации.
      angle[i] += (FUNNEL.swirl / Math.max(0.22, r)) * dt;

      const j = i * 3;
      positions[j] = Math.cos(angle[i]) * r;
      positions[j + 1] = funnelY(t);
      positions[j + 2] = Math.sin(angle[i]) * r;

      // Наверху поток разрежен и тускл, книзу разгорается — именно перепад
      // яркости, а не число точек, читается как концентрация лидов.
      const fadeIn = t < FUNNEL.spawnAt + 0.12 ? Math.max(0, (t - FUNNEL.spawnAt) / 0.12) : 1;
      alphas[i] = fadeIn * (0.3 + 0.66 * tc);
    }

    if (arrived > 0) {
      flow.current.arrivals += arrived;
      flow.current.flash = Math.min(
        FUNNEL.flashMax,
        flow.current.flash + arrived * FUNNEL.flashPerArrival,
      );
    }

    const geo = pointsRef.current?.geometry;
    if (geo) {
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[state.positions, 3]} />
        <bufferAttribute attach="attributes-aAlpha" args={[state.alphas, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[state.sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={FLOW_VERT}
        fragmentShader={FLOW_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── касса ───────────────────────────────────────────────────────────────────

/** Кольцо в плоскости XZ — «горловина» узла накопления. */
function ringPositions(radius: number, segments = 64) {
  const arr = new Float32Array(segments * 6);
  for (let s = 0; s < segments; s++) {
    const a0 = (s / segments) * Math.PI * 2;
    const a1 = ((s + 1) / segments) * Math.PI * 2;
    arr[s * 6] = Math.cos(a0) * radius;
    arr[s * 6 + 2] = Math.sin(a0) * radius;
    arr[s * 6 + 3] = Math.cos(a1) * radius;
    arr[s * 6 + 5] = Math.sin(a1) * radius;
  }
  return arr;
}

function Register({ flow }: { flow: MutableRefObject<FlowState> }) {
  const y = funnelY(1) - FUNNEL.registerDrop;
  const coreRef = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshBasicMaterial>(null);
  const ringMat = useRef<THREE.LineBasicMaterial>(null);
  const outerMat = useRef<THREE.LineBasicMaterial>(null);

  const inner = useMemo(() => ringPositions(FUNNEL.registerRadius), []);
  const outer = useMemo(() => ringPositions(FUNNEL.registerRadius * 1.85), []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1);
    const s = flow.current;
    s.flash *= Math.exp(-dt / FUNNEL.flashTauS);
    if (s.flash < 0.002) s.flash = 0;

    const f = s.flash;
    if (coreMat.current) coreMat.current.opacity = 0.35 + 0.65 * f;
    if (coreRef.current) {
      const k = 1 + 0.5 * f;
      coreRef.current.scale.set(k, k, k);
    }
    if (ringMat.current) ringMat.current.opacity = 0.4 + 0.6 * f;
    if (outerMat.current) outerMat.current.opacity = 0.12 + 0.45 * f;
  });

  return (
    <group position={[0, y, 0]}>
      {/* Ядро — то, во что превращается лид. Единственный «плотный» объект сцены. */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.085, 20, 16]} />
        <meshBasicMaterial
          ref={coreMat}
          color={FUNNEL.color.register}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[inner, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={ringMat}
          color={FUNNEL.color.register}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </lineSegments>
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[outer, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={outerMat}
          color={FUNNEL.color.register}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

// ── камера ──────────────────────────────────────────────────────────────────

function CameraRig({ pointer }: { pointer: MutableRefObject<PointerState> }) {
  const target = useMemo(
    () => new THREE.Vector3(FUNNEL.camera.lookAt[0], FUNNEL.camera.lookAt[1], FUNNEL.camera.lookAt[2]),
    [],
  );

  useFrame(({ camera }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1);
    // Тяжёлое демпфирование: камера отстаёт от курсора, движение «весит».
    const k = 1 - Math.exp(-(dt * 1000) / FUNNEL.camera.tauMs);
    const [ax, ay] = FUNNEL.camera.parallax;
    const wantX = FUNNEL.camera.position[0] + pointer.current.x * ax;
    const wantY = FUNNEL.camera.position[1] + pointer.current.y * ay;
    camera.position.x += (wantX - camera.position.x) * k;
    camera.position.y += (wantY - camera.position.y) * k;
    camera.lookAt(target);
  });

  return null;
}

// ── телеметрия ──────────────────────────────────────────────────────────────

/**
 * Под `?debugFunnel` выставляет `window.__funnel()` — позиция камеры, счётчики
 * рендерера, приход в кассу. Нужна для замеров: снаружи камеру R3F не достать,
 * а draw calls иначе приходится угадывать.
 */
function Telemetry({
  flow,
  statsRef,
}: {
  flow: MutableRefObject<FlowState>;
  statsRef: MutableRefObject<{ fps: number; dprCap: number } | null>;
}) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const w = window as unknown as { __funnel?: () => unknown };
    w.__funnel = () => ({
      camera: [
        Math.round(camera.position.x * 1000) / 1000,
        Math.round(camera.position.y * 1000) / 1000,
        Math.round(camera.position.z * 1000) / 1000,
      ],
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      points: gl.info.render.points,
      lines: gl.info.render.lines,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
      arrivals: flow.current.arrivals,
      flash: Math.round(flow.current.flash * 100) / 100,
      fps: statsRef.current?.fps ?? 0,
      dprCap: statsRef.current?.dprCap ?? 0,
      pixelRatio: gl.getPixelRatio(),
    });
    return () => {
      delete w.__funnel;
    };
  }, [gl, camera, flow, statsRef]);

  return null;
}

// ── корень ──────────────────────────────────────────────────────────────────

interface Props {
  /** Секция-хозяин: цель IntersectionObserver, чтобы вне вьюпорта не рендерить. */
  hostRef: RefObject<HTMLElement | null>;
}

/**
 * Только сама сцена. Рамкой, маской и позиционированием заведует HeroScene —
 * иначе 3D и SVG-фолбэк неминуемо разъедутся по геометрии.
 */
export default function ConversionFunnelCanvas({ hostRef }: Props) {
  const flow = useRef<FlowState>({ flash: 0, arrivals: 0 });
  const pointer = useRef<PointerState>({ x: 0, y: 0 });
  const { dprCap, statsRef } = useFunnelLoop(hostRef);
  const debug =
    typeof location !== "undefined" && location.search.includes("debugFunnel");

  useEffect(() => {
    const abort = new AbortController();
    window.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType === "touch") return;
        // Нормируем в -1..1. Ни одного чтения layout: только размеры окна.
        pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
      },
      { passive: true, signal: abort.signal },
    );
    return () => abort.abort();
  }, []);

  return (
    <Canvas
      // R3F собственный rAF не заводит — кадры выдаёт useFunnelLoop.
      frameloop="never"
      dpr={[1, dprCap]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{
        position: [...FUNNEL.camera.position] as [number, number, number],
        fov: FUNNEL.camera.fov,
      }}
    >
      <FunnelFrame />
      <FlowParticles flow={flow} />
      <Register flow={flow} />
      <CameraRig pointer={pointer} />
      {debug ? <Telemetry flow={flow} statsRef={statsRef} /> : null}
    </Canvas>
  );
}
