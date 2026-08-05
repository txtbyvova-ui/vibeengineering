import type { SectionHeading } from "@/types";

export interface UspPoint {
  label: string;
  title: string;
  body: string;
}

export const uspHeading: SectionHeading = {
  eyebrow: "◆ Почему мы",
  title: "Инженер × Продюсер",
  subtitle: "Два подхода, которые обычно не встречаются в одной студии",
};

export const uspPoints: UspPoint[] = [
  {
    label: "01",
    title: "Расчёт",
    body:
      "Проектируем как конструкцию: сначала нагрузка, схема, узлы — потом код. " +
      "Поэтому сайт не разваливается на первой рекламной волне.",
  },
  {
    label: "02",
    title: "Заявки",
    body:
      "Да, мы умеем делать красиво. Но главное — мы собирали кампании с охватом 30M+ " +
      "и знаем, что заставляет человека нажать кнопку.",
  },
  {
    label: "03",
    title: "Скорость",
    body:
      "Первый рабочий прототип — 48 часов. Полноценный продукт — 2–4 недели. " +
      "В разработку на полгода не уходим.",
  },
];
