export type Metric = readonly [value: string, label: string];

/** Внешняя или якорная ссылка с подписью. */
export interface Link {
  label: string;
  href: string;
}

export interface CaseStudy {
  /** Латинский идентификатор: ключ React и префикс путей к медиа. */
  slug: string;
  title: string;
  tags: string[];
  problem: string;
  solution: string;
  result: string;
  metrics: Metric[];
  /** Строка клиентов под метриками — есть не у каждого кейса. */
  clients?: string;
  /** «Открыть сайт →» для кейсов с живым продуктом. */
  link?: Link;
}

/**
 * Растровый ассет из `public/media`. Файлы называются `{base}-{width}.{avif|webp}`
 * плюс один `{base}-fallback.jpg`; `width`/`height` — интринсики самого крупного
 * варианта, они и уходят в атрибуты <img> против CLS.
 */
export interface ResponsiveImage {
  base: string;
  widths: number[];
  width: number;
  height: number;
  alt: string;
  /** Утилита object-position, если центр кадра — не то, что надо показать. */
  position?: string;
  /** Утилита aspect-*, если пропорция кадра отличается от дефолта слота. */
  aspect?: string;
}

/** Видео кейса: `{base}.mp4` + `{base}.poster.jpg`. */
export interface MediaVideo {
  base: string;
  width: number;
  height: number;
  /** Читается скринридером и подписью, если автоплей запрещён. */
  alt: string;
}

export interface CaseMedia {
  main: ResponsiveImage;
  video?: MediaVideo;
  thumbs?: ResponsiveImage[];
}

export interface TeamMember {
  slug: string;
  name: string;
  role: string;
  stats: Metric[];
  quote: string;
  skills: string;
}

export interface ProcessStep {
  num: string;
  title: string;
  duration: string;
  description: string;
}

export interface Client {
  name: string;
}

/** Метрика Hero. Существующий Metric — кортеж строк, для count-up нужен number. */
export interface HeroMetric {
  value: number;
  /** Статичный хвост: «+», «M+». Не участвует в счёте. */
  suffix: string;
  label: string;
}

export interface ContactLink {
  label: string;
  handle: string;
  href: string;
}

/** Шапка секции: ◆-надстрочник, заголовок и необязательный подзаголовок. */
export interface SectionHeading {
  eyebrow: string;
  title: string;
  subtitle?: string;
}
