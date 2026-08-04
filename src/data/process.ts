import type { ProcessStep } from "@/types";

export const process: ProcessStep[] = [
  {
    num: "01",
    title: "Разведка",
    duration: "3–5 дней",
    description:
      "Аудит, бизнес-цели, архитектурный замысел (наш аналог ПКД в стройке).",
  },
  {
    num: "02",
    title: "Фундамент",
    duration: "1–2 недели",
    description:
      "Информационная архитектура, wireframes, backend-скелет, копирайт. Кликабельный прототип.",
  },
  {
    num: "03",
    title: "Конструкция",
    duration: "1–2 недели",
    description:
      "Frontend, backend-интеграции, AI, адаптив, анимации. Staging.",
  },
  {
    num: "04",
    title: "Запуск",
    duration: "1 неделя",
    description:
      "QA, нагрузочные тесты, deploy, мониторинг 7 дней, полная документация. 30 дней гарантия.",
  },
];
