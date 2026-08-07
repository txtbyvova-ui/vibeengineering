import { useMemo } from "react";
import { FUNNEL, funnelRadius, funnelY, ringDepths } from "@/data/funnel";

/**
 * Статичный SVG-чертёж воронки — то, что видят вместо 3D при
 * prefers-reduced-motion и на тач-устройствах.
 *
 * Это НЕ заглушка «чтобы что-то было»: геометрия считается тем же профилем
 * `funnelRadius`, что и 3D-сцена, просто в изометрической проекции. Метафора
 * та же — лиды сверху, воронка, касса внизу, — а весит вектор около килобайта
 * и не тянет three.js вовсе.
 *
 * Всё детерминировано (ни одного Math.random): разметка стабильна между
 * рендерами, CLS не даёт, скриншот-тесты воспроизводимы.
 */

/** Сжатие по вертикали для изометрии: кольцо в перспективе — эллипс. */
const TILT = 0.26;
const VB_W = 400;
const VB_H = 460;
/** Юниты сцены → координаты viewBox. */
const SCALE = 108;
const CX = VB_W / 2;
const CY = VB_H / 2 + 12;

const toX = (u: number) => CX + u * SCALE;
const toY = (u: number) => CY - u * SCALE;

export default function FunnelBlueprint({ className = "" }: { className?: string }) {
  const { rings, meridians, dots } = useMemo(() => {
    const rings = ringDepths().map((t, i) => ({
      cx: CX,
      cy: toY(funnelY(t)),
      rx: funnelRadius(t) * SCALE,
      ry: funnelRadius(t) * SCALE * TILT,
      major: i % FUNNEL.majorRingEvery === 0,
    }));

    // Меридианы: та же кривая профиля, спроецированная на две стороны.
    const STEPS = 30;
    const meridians: string[] = [];
    for (const side of [-1, 1]) {
      let d = "";
      for (let s = 0; s <= STEPS; s++) {
        const t = s / STEPS;
        const x = toX(side * funnelRadius(t));
        const y = toY(funnelY(t));
        d += `${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      meridians.push(d);
    }

    // Поток: детерминированная россыпь по золотому углу, чтобы точки
    // не выстроились в спираль-«расчёску».
    const GOLDEN = 2.399963;
    const dots: { x: number; y: number; r: number; o: number }[] = [];
    for (let i = 0; i < 54; i++) {
      const t = FUNNEL.spawnAt + (i / 53) * (1 - FUNNEL.spawnAt);
      const a = i * GOLDEN;
      const rad = funnelRadius(t) * (1 + Math.cos(a * 1.7) * FUNNEL.wallJitter);
      dots.push({
        // Изометрия: кольцо — эллипс, поэтому глубина по кольцу даёт сдвиг по Y.
        x: toX(Math.cos(a) * rad),
        y: toY(funnelY(t)) + Math.sin(a) * rad * SCALE * TILT,
        r: 1.5 + 1.4 * Math.max(0, t),
        o: 0.35 + 0.55 * Math.max(0, t),
      });
    }
    return { rings, meridians, dots };
  }, []);

  const registerY = toY(funnelY(1) - FUNNEL.registerDrop);

  return (
    <svg
      aria-hidden
      className={className}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Каркас */}
      <g stroke={FUNNEL.color.frame}>
        {rings
          .filter((r) => !r.major)
          .map((r, i) => (
            <ellipse
              key={`t${i}`}
              cx={r.cx}
              cy={r.cy}
              rx={r.rx}
              ry={r.ry}
              strokeWidth={1}
              opacity={FUNNEL.color.frameOpacity}
            />
          ))}
        {meridians.map((d, i) => (
          <path key={`m${i}`} d={d} strokeWidth={1} opacity={FUNNEL.color.frameOpacity} />
        ))}
      </g>
      <g stroke={FUNNEL.color.frameMajor}>
        {rings
          .filter((r) => r.major)
          .map((r, i) => (
            <ellipse
              key={`M${i}`}
              cx={r.cx}
              cy={r.cy}
              rx={r.rx}
              ry={r.ry}
              strokeWidth={1.4}
              opacity={FUNNEL.color.frameMajorOpacity}
            />
          ))}
      </g>

      {/* Поток лидов */}
      <g fill={FUNNEL.color.flow}>
        {dots.map((d, i) => (
          <circle key={`d${i}`} cx={d.x} cy={d.y} r={d.r} opacity={d.o} />
        ))}
      </g>

      {/* Касса */}
      <g>
        <ellipse
          cx={CX}
          cy={registerY}
          rx={FUNNEL.registerRadius * 1.85 * SCALE}
          ry={FUNNEL.registerRadius * 1.85 * SCALE * TILT}
          stroke={FUNNEL.color.register}
          strokeWidth={1}
          opacity={0.32}
        />
        <ellipse
          cx={CX}
          cy={registerY}
          rx={FUNNEL.registerRadius * SCALE}
          ry={FUNNEL.registerRadius * SCALE * TILT}
          stroke={FUNNEL.color.register}
          strokeWidth={1.4}
          opacity={0.6}
        />
        <circle cx={CX} cy={registerY} r={7} fill={FUNNEL.color.register} opacity={0.85} />
      </g>
    </svg>
  );
}
