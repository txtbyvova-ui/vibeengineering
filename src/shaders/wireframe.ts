/**
 * Стилизованный wireframe на барицентрических координатах.
 *
 * Источник техники и шейдеров — mattdesl/webgl-wireframes, MIT:
 *   https://github.com/mattdesl/webgl-wireframes  (lib/wire.vert, lib/wire.frag)
 *   Copyright (c) 2019 Matt DesLauriers — MIT License
 * Разбор техники: https://mattdesl.svbtle.com/drawing-lines-is-hard
 *
 * Что изменено против оригинала и почему:
 *
 * 1. **Убран glslify.** В оригинале две `#pragma glslify: require` — 4D simplex
 *    noise и константа PI. Vite их не понимает, а тянуть плагин ради одной
 *    константы и одного неиспользуемого эффекта неоправданно. PI объявлена
 *    константой, uniform'ы `noiseA`/`noiseB` и сам шум сняты: они не входят
 *    в постановку. Отсюда же сборка не может упасть на glslify — его нет.
 * 2. **Добавлен uniform `strokeBack`.** В оригинале в режиме `seeThrough`
 *    задняя стенка красится в `fill`, то есть цвет заливки и цвет backface —
 *    одна переменная. Палитра требует раздельно: заливка чёрная/прозрачная,
 *    backface — тёмно-красный. Один дополнительный uniform, логика та же.
 * 3. **Сняты `attribute float even` и varying `vEven`/`vUv`** — объявлены
 *    в оригинале, но во фрагментном шейдере не используются ни разу.
 *
 * Всё остальное — толщина, антиалиасинг через `fwidth`, пунктир, dual stroke,
 * squeeze — оставлено как в оригинале, включая порядок вычислений.
 *
 * `fwidth` здесь работает без объявления расширения: three ≥ r163 только
 * WebGL2, а там производные входят в ядро языка.
 */

export const WIREFRAME_VERT = /* glsl */ `
  attribute vec3 barycentric;

  varying vec3 vBarycentric;
  varying vec3 vPosition;

  void main () {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
    vBarycentric = barycentric;
    vPosition = position.xyz;
  }
`;

export const WIREFRAME_FRAG = /* glsl */ `
  varying vec3 vBarycentric;
  varying vec3 vPosition;

  uniform float time;
  uniform float thickness;
  uniform float secondThickness;

  uniform float dashRepeats;
  uniform float dashLength;
  uniform bool dashOverlap;
  uniform bool dashEnabled;
  uniform bool dashAnimate;

  uniform bool seeThrough;
  uniform bool insideAltColor;
  uniform bool dualStroke;

  uniform bool squeeze;
  uniform float squeezeMin;
  uniform float squeezeMax;

  uniform vec3 stroke;
  uniform vec3 strokeBack;
  uniform vec3 fill;

  const float PI = 3.141592653589793;

  // Антиалиасинг края: ширина перехода берётся из производной самой величины,
  // поэтому линия остаётся ровной при любом наклоне и удалении грани.
  float aastep (float threshold, float dist) {
    float afwidth = fwidth(dist) * 0.5;
    return smoothstep(threshold - afwidth, threshold + afwidth, dist);
  }

  vec4 getStyledWireframe (vec3 barycentric) {
    // расстояние до ближайшего ребра треугольника
    float d = min(min(barycentric.x, barycentric.y), barycentric.z);

    // 0..1 вдоль ребра — по нему рисуется пунктир и считается squeeze
    float positionAlong = max(barycentric.x, barycentric.y);
    if (barycentric.y < barycentric.x && barycentric.y < barycentric.z) {
      positionAlong = 1.0 - positionAlong;
    }

    float computedThickness = thickness;

    // сжатие штриха к середине ребра
    if (squeeze) {
      computedThickness *= mix(squeezeMin, squeezeMax, (1.0 - sin(positionAlong * PI)));
    }

    if (dashEnabled) {
      float offset = 1.0 / dashRepeats * dashLength / 2.0;
      if (!dashOverlap) {
        offset += 1.0 / dashRepeats / 2.0;
      }
      if (dashAnimate) {
        offset += time * 0.22;
      }
      float pattern = fract((positionAlong + offset) * dashRepeats);
      computedThickness *= 1.0 - aastep(dashLength, pattern);
    }

    float edge = 1.0 - aastep(computedThickness, d);

    vec4 outColor = vec4(0.0);
    if (seeThrough) {
      outColor = vec4(stroke, edge);
      // Backface coloring: изнутри фигура читается другим цветом, и объём
      // становится понятен без заливки и без света.
      if (insideAltColor && !gl_FrontFacing) {
        outColor.rgb = strokeBack;
      }
    } else {
      vec3 mainStroke = mix(fill, stroke, edge);
      outColor.a = 1.0;
      if (dualStroke) {
        float inner = 1.0 - aastep(secondThickness, d);
        outColor.rgb = mix(fill, stroke, abs(inner - edge));
      } else {
        outColor.rgb = mainStroke;
      }
    }

    return outColor;
  }

  void main () {
    gl_FragColor = getStyledWireframe(vBarycentric);
  }
`;
