import { TBD, cases, casesListName } from "@/data/cases";

const ORIGIN = "https://vibeengineering.ru";

/**
 * Кейсы структурированными данными.
 *
 * Полный текст кейса (решение и результат) живёт в модалке, то есть появляется
 * в DOM только после клика — краулеру он не виден. `ItemList` из `CreativeWork`
 * возвращает содержимое в машинно-читаемом виде, не пряча текст от людей
 * и не дублируя его невидимой разметкой.
 *
 * Блок в index.html этим не затрагивается: несколько ld+json на странице —
 * штатная ситуация, они складываются, а не конфликтуют.
 */
export default function CasesJsonLd() {
  const payload = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: casesListName,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: cases.length,
    itemListElement: cases.map((study, i) => {
      // Плейсхолдер незаполненного факта — подпись для человека, а не технология.
      // В машинно-читаемых данных «уточняется» превратилось бы в настоящий
      // keyword у трёх кейсов из четырёх.
      const stack = study.stack.filter((item) => item !== TBD);
      // Кейс рассказан либо тройкой, либо одним абзацем (CaseNarrative).
      // Для второго варианта abstract и description совпадают: другого текста
      // у кейса нет, а выкидывать одно из полей ради непохожести — хуже,
      // чем повторить. Пустых строк в разметке не остаётся ни в одном случае.
      const abstract = study.problem ?? study.summary;
      const description = study.summary ?? `${study.solution} ${study.result}`;
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "CreativeWork",
          "@id": `${ORIGIN}/#case-${study.slug}`,
          name: study.title,
          genre: study.tag,
          abstract,
          description,
          ...(stack.length > 0 && { keywords: stack.join(", ") }),
          ...(study.year !== null && { datePublished: String(study.year) }),
          creator: { "@id": `${ORIGIN}/#organization` },
          about: { "@type": "Organization", name: study.client },
          ...(study.link && { url: study.link.href }),
        },
      };
    }),
  };

  return (
    <script
      type="application/ld+json"
      // Данные свои, из src/data — не пользовательский ввод.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
