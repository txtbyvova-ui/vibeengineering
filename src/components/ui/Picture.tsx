import type { ResponsiveImage } from "@/types";

const BASE = "/media/";

interface PictureProps {
  image: ResponsiveImage;
  /** Значение атрибута sizes — без него srcSet вырождается в «100vw». */
  sizes: string;
  /** Классы на сам <img>: тут задаются aspect-ratio и object-fit. */
  className?: string;
  /**
   * Снимает ленивую загрузку. Ставить только тому, что гарантированно видно
   * сразу после доскролла до секции — первым карточкам ленты кейсов.
   */
  eager?: boolean;
}

/**
 * AVIF → WebP → JPEG. Ширина и высота всегда в атрибутах: без них браузер
 * не резервирует место и вёрстка прыгает при подгрузке (CLS).
 */
export default function Picture({
  image,
  sizes,
  className = "",
  eager = false,
}: PictureProps) {
  const srcSet = (ext: string) =>
    image.widths.map((w) => `${BASE}${image.base}-${w}.${ext} ${w}w`).join(", ");

  return (
    <picture>
      <source type="image/avif" srcSet={srcSet("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet("webp")} sizes={sizes} />
      <img
        src={`${BASE}${image.base}-fallback.jpg`}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={eager ? "eager" : "lazy"}
        // Ленту видно не сразу, поэтому её обложки не должны конкурировать
        // за канал с первым экраном: eager, но низким приоритетом.
        fetchPriority={eager ? "low" : undefined}
        decoding="async"
        className={`${className} ${image.position ?? ""}`}
      />
    </picture>
  );
}
