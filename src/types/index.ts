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

export interface ContactLink {
  label: string;
  handle: string;
  href: string;
}
