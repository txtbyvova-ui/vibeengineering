export type Metric = readonly [value: string, label: string];

/** Внешняя или якорная ссылка с подписью. */
export interface Link {
  label: string;
  href: string;
}

/** Метрика кейса. У Team и Hero свои форматы — этот не смешивать с `Metric`. */
export interface CaseMetric {
  value: string;
  label: string;
}

/**
 * Категория кейса. Список закрытый: по нему строится фильтр смысла — читатель
 * должен за секунду понять, что за работа. `Концепция` добавлена сверх исходной
 * пятёрки под Альфа-Банк, см. docs/BACKLOG.md §51.
 */
export type CaseTag =
  | "Сайт"
  | "Бот"
  | "Веб-приложение"
  | "AI"
  | "Инсталляция"
  | "Концепция";

/**
 * Единая схема кейса. Все поля обязательны, кроме помеченных `?` —
 * «у этого кейса есть метрика, у того нет» здесь невозможно по типу.
 *
 * Незаполненные факты держим как `null`, а не выдумываем: разметка такое поле
 * просто не рендерит, а список пробелов лежит в `caseDataGaps`.
 */
export interface CaseStudy {
  id: number;
  /** Латинский идентификатор: ключ React, префикс путей к медиа, якорь модалки. */
  slug: string;
  client: string;
  /**
   * Крючок карточки: результат или цифра, а не «Сайт для X». Больше на карточке
   * ничего нет, поэтому заголовок обязан продавать клик сам.
   *
   * ⚠️ **До 25 знаков.** На карточке стоит `line-clamp-1`, и обрезка молчаливая:
   * `scrollWidth` при `-webkit-box` равен `clientWidth`, а `getBoundingClientRect`
   * у Range упирается в ширину бокса — ни то, ни другое обрезку не показывает.
   * Ловить её надо числом строчных фрагментов (`range.getClientRects().length`).
   * Бюджет замерен на самом узком вьюпорте: 320 px → карточка 85vw → бокс 222 px
   * при 18 px шрифта ≈ 8.4 px на знак.
   *
   * До 2026-08-07 здесь стояло «до 60 символов». По этому лимиту были написаны
   * все четыре заголовка — и все четыре резались на первой же строке, вплоть
   * до 871 px текста в боксе 366 px.
   */
  title: string;
  tag: CaseTag;
  /** `null` — год не подтверждён владельцем. */
  year: number | null;
  /** 1–2 предложения. Начинается с задачи, а не с «мы». */
  problem: string;
  /** 2–3 предложения. */
  solution: string;
  /** 1–2 предложения. */
  result: string;
  /** 2–3 метрики. Пустым быть не может — берём фактические: срок, объём, вес. */
  metrics: CaseMetric[];
  /** 3–6 тегов: технологии или материалы. Короче трёх — значит, есть пробел. */
  stack: string[];
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
}

/** Видео кейса: `{base}.mp4` + `{base}.poster.jpg`. */
export interface MediaVideo {
  base: string;
  width: number;
  height: number;
  /** Читается скринридером и подписью, если автоплей запрещён. */
  alt: string;
}

/**
 * Медиа кейса. `cover` есть у каждого и рендерится в фиксированной пропорции —
 * карточки ленты обязаны быть одного размера. `gallery` и `video` опциональны
 * и живут только в модалке.
 */
export interface CaseMedia {
  cover: ResponsiveImage;
  gallery?: ResponsiveImage[];
  video?: MediaVideo;
}

export interface TeamMember {
  slug: string;
  name: string;
  role: string;
  stats: Metric[];
  quote: string;
  skills: string;
}

/**
 * Направление услуг. Ровно четыре, и это тот же список, что в `hasOfferCatalog`
 * структурированных данных `index.html` — расходиться им нельзя.
 */
export interface ServiceItem {
  num: string;
  title: string;
  /** Одно предложение, ~65–70 знаков. Без воды и без технологий. */
  body: string;
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
