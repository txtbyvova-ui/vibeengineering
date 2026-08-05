export type Metric = readonly [value: string, label: string];

export interface CaseStudy {
  title: string;
  tags: string[];
  metrics: Metric[];
  description: string;
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
