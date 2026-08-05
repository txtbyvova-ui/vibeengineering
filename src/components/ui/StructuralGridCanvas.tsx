import { useRef } from "react";
import type { RefObject } from "react";
import { GRID_MASK } from "@/data/structuralGrid";
import { useStructuralGrid } from "@/hooks/useStructuralGrid";

interface StructuralGridCanvasProps {
  /** Секция-хозяин: из неё берутся размеры и координаты курсора. */
  hostRef: RefObject<HTMLElement | null>;
  /** Только позиционирование и z-index; остальное зафиксировано внутри. */
  className?: string;
}

/**
 * Фон Hero. Вся логика — в useStructuralGrid; компонент существует только чтобы
 * Hero.tsx остался читаемым списком блоков.
 *
 * pointer-events-none обязателен: иначе канва перехватывает выделение текста.
 * will-change не ставим — канва и так получает собственный композитный слой,
 * will-change только съест GPU-память.
 */
export default function StructuralGridCanvas({
  hostRef,
  className = "",
}: StructuralGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useStructuralGrid(hostRef, canvasRef);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ maskImage: GRID_MASK, WebkitMaskImage: GRID_MASK }}
    />
  );
}
