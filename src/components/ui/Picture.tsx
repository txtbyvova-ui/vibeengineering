import type { ResponsiveImage } from "@/types";

const BASE = "/media/";

interface PictureProps {
  image: ResponsiveImage;
  /** Значение атрибута sizes — без него srcSet вырождается в «100vw». */
  sizes: string;
  /** Классы на сам <img>: тут задаются aspect-ratio и object-fit. */
  className?: string;
}

/**
 * AVIF → WebP → JPEG. Ширина и высота всегда в атрибутах: без них браузер
 * не резервирует место и первый экран прыгает при подгрузке (CLS).
 * Медиа на странице нет выше сгиба, поэтому loading="lazy" здесь безусловный.
 */
export default function Picture({ image, sizes, className = "" }: PictureProps) {
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
        loading="lazy"
        decoding="async"
        className={`${className} ${image.position ?? ""}`}
      />
    </picture>
  );
}
