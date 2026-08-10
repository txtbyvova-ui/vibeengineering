import { useEffect, useMemo } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  IcosahedronGeometry,
  SphereGeometry,
  TorusKnotGeometry,
} from "three";
import { WIRE, type WireGeometryKind } from "@/data/heroWireframe";

/**
 * Геометрия под стилизованный wireframe: барицентрические координаты на вершину.
 *
 * Приём из mattdesl/webgl-wireframes (MIT), `lib/geom.js`. Смысл: чтобы во
 * фрагментном шейдере знать расстояние до ребра, каждая вершина треугольника
 * должна получить свой единичный вектор — (1,0,0), (0,1,0), (0,0,1). Значит
 * вершины нельзя переиспользовать между треугольниками, и геометрию
 * обязательно разындексировать.
 *
 * `removeEdge` подменяет у третьей вершины 0 на 1 по чередованию треугольников,
 * и общая диагональ пары гасится. Для сетки из квадов (сфера, torus knot) это
 * превращает «триангулированную» проволоку в честные квады. Для икосаэдра
 * гасить нечего — там настоящие треугольники, и флаг обязан быть выключен,
 * иначе у каждой грани пропадёт одно ребро.
 *
 * Оригинал вызывает `bufferGeometry.addAttribute` — метод удалён из three
 * начиная с r125; здесь `setAttribute`, а разындексирование делает штатный
 * `toNonIndexed()` вместо ручного копирования атрибутов.
 */

function createBase(kind: WireGeometryKind): BufferGeometry {
  const s = WIRE.segments[kind];
  switch (kind) {
    case "torusKnot":
      return new TorusKnotGeometry(0.62, 0.24, s[0], s[1]);
    case "sphere":
      return new SphereGeometry(0.92, s[0], s[1]);
    case "icosahedron":
      return new IcosahedronGeometry(1, s[0]);
  }
}

/** Квадовые сетки гасят диагональ, триангулированные — нет. */
const REMOVE_EDGE: Record<WireGeometryKind, boolean> = {
  torusKnot: true,
  sphere: true,
  icosahedron: false,
};

export function addBarycentricCoordinates(geometry: BufferGeometry, removeEdge: boolean) {
  const position = geometry.getAttribute("position");
  const triangles = position.count / 3;
  const barycentric = new Float32Array(position.count * 3);

  for (let i = 0; i < triangles; i++) {
    const even = i % 2 === 0;
    const q = removeEdge ? 1 : 0;
    const o = i * 9;
    if (even) {
      barycentric.set([0, 0, 1, 0, 1, 0, 1, 0, q], o);
    } else {
      barycentric.set([0, 1, 0, 0, 0, 1, 1, 0, q], o);
    }
  }

  geometry.setAttribute("barycentric", new BufferAttribute(barycentric, 3));
}

/** Разындексированная геометрия с барицентрикой. Пересобирается при смене фигуры. */
export function useWireframeGeometry(kind: WireGeometryKind): BufferGeometry {
  const geometry = useMemo(() => {
    const base = createBase(kind);
    // Барицентрика требует уникальных вершин, поэтому индекс снимаем всегда.
    const flat = base.toNonIndexed();
    base.dispose();
    addBarycentricCoordinates(flat, REMOVE_EDGE[kind]);
    return flat;
  }, [kind]);

  // Смена фигуры порождает новую геометрию — старую отдаём GPU обратно сами,
  // R3F про неё не знает: она создана в useMemo, а не в JSX.
  useEffect(() => () => geometry.dispose(), [geometry]);

  return geometry;
}
