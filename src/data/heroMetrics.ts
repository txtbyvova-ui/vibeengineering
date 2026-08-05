import type { HeroMetric } from "@/types";

/**
 * Метрики первого экрана. Число считается вверх, суффикс статичен —
 * поэтому «30M+» разложено на value 30 и suffix "M+".
 */
export const HERO_METRICS: readonly HeroMetric[] = [
  { value: 120, suffix: "", label: "часов до запуска" },
  { value: 400, suffix: "+", label: "проектов" },
  { value: 30, suffix: "M+", label: "охватов" },
];

/** Цели count-up отдельной константой: стабильная ссылка для зависимостей хука. */
export const HERO_METRIC_TARGETS: readonly number[] = HERO_METRICS.map((m) => m.value);
