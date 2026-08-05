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

export interface TeamMember {
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
