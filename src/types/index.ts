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
 *
 * Составные варианты («Бот + виральная кампания») заведены копирайтом 2026-08-11:
 * проект честно состоит из двух работ сразу, и одиночный тег это скрывал.
 * ⚠️ Тег печатается на карточке строкой «тег · год» в 10 px — держать его
 * в пределах ~26 знаков, иначе строка переносится и ломает нижний край карточки.
 */
export type CaseTag =
  | "Сайт"
  | "Бот"
  | "Бот + виральная кампания"
  | "Веб-приложение"
  | "AI"
  | "Инсталляция"
  | "Инсталляция + бот"
  | "Концепция";

/**
 * Единая схема кейса. Все поля обязательны, кроме помеченных `?` —
 * «у этого кейса есть метрика, у того нет» здесь невозможно по типу.
 *
 * Незаполненные факты держим как `null`, а не выдумываем: разметка такое поле
 * просто не рендерит, а список пробелов лежит в `caseDataGaps`.
 *
 * ⚠️ **Два формата рассказа, и это решение владельца (копирайт 2026-08-11).**
 * Либо тройка `problem` / `solution` / `result` с подписями блоков, либо один
 * абзац `summary` — см. `CaseNarrative`. Смешать их тип не даст: поля второго
 * варианта помечены `never` в первом и наоборот, так что «половина тройки плюс
 * абзац» не соберётся.
 */
interface CaseStudyBase {
  id: number;
  /** Латинский идентификатор: ключ React, префикс путей к медиа, якорь модалки. */
  slug: string;
  client: string;
  /**
   * Крючок карточки: результат или цифра, а не «Сайт для X». Больше на карточке
   * ничего нет, поэтому заголовок обязан продавать клик сам.
   *
   * ⚠️ **До 50 знаков.** На карточке стоит `line-clamp-2`, и обрезка молчаливая:
   * `scrollWidth` при `-webkit-box` равен `clientWidth`, а `getBoundingClientRect`
   * у Range упирается в ширину бокса — ни то, ни другое обрезку не показывает.
   * Ловить её надо числом строчных фрагментов (`range.getClientRects().length`).
   * Бюджет замерен на самом узком вьюпорте: 320 px → карточка 85vw → бокс 222 px
   * при 17 px шрифта ≈ 8 px на знак, то есть ~26 знаков в строке и ~50 в две.
   *
   * История лимита: «до 60 символов» (все четыре заголовка резались на первой
   * строке, до 871 px текста в боксе 366 px) → «до 25» под `line-clamp-1`
   * → «до 50» под `line-clamp-2`, когда копирайт 2026-08-11 принёс заголовки
   * в 32 и 37 знаков. Меняете `line-clamp` — пересчитайте и это число.
   */
  title: string;
  tag: CaseTag;
  /** `null` — год не подтверждён владельцем. */
  year: number | null;
  /** 2–3 метрики. Пустым быть не может — берём фактические: срок, объём, вес. */
  metrics: CaseMetric[];
  /** 3–6 тегов: технологии или материалы. Короче трёх — значит, есть пробел. */
  stack: string[];
  /**
   * Кто уже пользуется. Только для кейсов-продуктов: у разовой работы заказчик
   * один и он же стоит в `client`, дублировать его строкой незачем.
   */
  clientsNote?: string;
  /** «Открыть сайт →» для кейсов с живым продуктом. */
  link?: Link;
}

/**
 * Рассказ кейса — ровно в одном из двух форматов, третьего нет.
 *
 * `never` здесь не украшение: без него в объект пролезала бы «половина тройки
 * плюс абзац», и модалка молча съедала бы один из текстов.
 */
export type CaseNarrative =
  | {
      /** 1–2 предложения. Начинается с задачи, а не с «мы». */
      problem: string;
      /** 2–3 предложения. */
      solution: string;
      /** 1–2 предложения. */
      result: string;
      summary?: never;
    }
  | {
      /** 2–3 предложения одним абзацем, без подписей блоков. */
      summary: string;
      problem?: never;
      solution?: never;
      result?: never;
    };

export type CaseStudy = CaseStudyBase & CaseNarrative;

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
