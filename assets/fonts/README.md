# Шрифты в репозитории

Здесь лежат только те шрифты, **редистрибуцию которых прямо разрешает лицензия**.
Каталог не отдаётся с сайта: он вне `public/`, читает его один
[scripts/generate-og.mjs](../../scripts/generate-og.mjs) на этапе сборки.

Проверено 2026-08-07. Репозиторий `github.com/txtbyvova-ui/vibeengineering`
**публичный** (`visibility: public` по GitHub API) — это ключевой факт разбора
ниже: всё, что сюда закоммичено, публично скачивается кем угодно.

---

## JetBrains Mono NL Medium — можно, лежит здесь

| | |
|---|---|
| Файл | `JetBrainsMonoNL-Medium.ttf`, 208 276 байт |
| Лицензия | **SIL Open Font License 1.1** (`OFL.txt`, `AUTHORS.txt` рядом) |
| Источник | официальный релиз `JetBrains/JetBrainsMono` **v2.304**, ассет `JetBrainsMono-2.304.zip`, путь в архиве `fonts/ttf/JetBrainsMonoNL-Medium.ttf` |
| sha256 | `44099e1efefba556…` |

OFL 1.1 разрешает редистрибуцию прямо: *«The Font Software may be sold as part
of a larger software package but not any other way»* и *«Copies … may be
redistributed and/or sold»* — при условии, что копия сопровождается текстом
лицензии и уведомлением об авторских правах. Поэтому рядом лежат `OFL.txt`
и `AUTHORS.txt` из того же релиза, **неизменёнными**.

Файл не модифицирован и не сабсетнут: любая правка задействовала бы правило
Reserved Font Name (нельзя оставлять имя «JetBrains Mono» у изменённого шрифта),
а выигрыш в весе того не стоит.

Взят вариант **NL** (no ligatures): в прозе лигатуры кода не нужны, а весит он
на 65 кБ меньше обычного. Покрытие проверено разбором `cmap`: **122 кодпоинта**
в U+0400–U+04FF, плюс `◆` (U+25C6), `—` (U+2014), `№` (U+2116). Все символы,
которые печатает OG-карточка, покрыты — проверено посимвольно.

## Clash Display — НЕЛЬЗЯ, здесь его нет и не должно быть

Clash Display распространяется по **ITF Free Font License** (Fontshare EULA;
полный текст — в файле `License/FFL.txt` внутри загрузочного кита Fontshare).
Раздел «02. Limitations of usage» говорит буквально:

> The Fonts may not — beyond the permitted copies and the uses defined herein —
> be distributed, duplicated, loaned, resold or licensed in any way … This
> includes the distribution of the Fonts by e-mail, on USB sticks, CD-ROMs, or
> other media, **uploading them in a public server** or making the fonts
> available on peer-to-peer networks.

Публичный git-репозиторий — это ровно «uploading them in a public server».
**Коммит TTF Clash Display запрещён лицензией**, независимо от того, насколько
это удобно для сборки.

Тот же раздел отдельно запрещает без письменного согласия ITF *«transmit the
Font Software over the Internet in font serving or for font replacement»* —
то есть и селф-хостинг веб-шрифта тоже закрыт.

**Что при этом разрешено и чем мы пользуемся:**

- §01 — скачивать и использовать шрифт для личных и коммерческих проектов,
  бесплатно, бессрочно, и делать «reasonable number of back-up copies suitable
  to your permitted use». Локальный кэш сборки в `.cache/og-fonts` (вне git) —
  это такая копия.
- §01 — *«use the Font Software to create logos and other graphic elements,
  images on any surface … and static images»*. OG-карточка — статическая
  картинка, её публикация разрешена.
- Преамбула EULA прямо описывает штатный путь доставки на сайт: Fontshare API,
  когда шрифт едет с серверов ITF на сайт лицензиата. Именно так его грузит
  `index.html`.

Итог: **сайт и OG-карточка лицензии соответствуют**, а вот убрать зависимость
сборки от Fontshare коммитом файла — нельзя. Поэтому в `generate-og.mjs`
Clash Display необязателен: если CDN недоступен, латинский заголовок набирается
JetBrains Mono, карточка всё равно собирается, сборка не падает.
Разбор — [docs/REPORT-multi-review-2026-08-06.md](../../docs/REPORT-multi-review-2026-08-06.md) §4.6.

## Space Grotesk — не нужен

В OG-карточке не используется: кириллицы у него нет (см. BACKLOG §0), а латиницу
на карточке несёт Clash Display. Лицензия у него OFL 1.1, то есть при
необходимости закоммитить его будет можно.

---

## Если добавляете сюда шрифт

1. Найдите текст лицензии — не пересказ на сайте, а файл из дистрибутива.
2. Убедитесь, что редистрибуция разрешена **явно**. «Free for commercial use»
   этого не означает: у ITF FFL ровно такая формулировка в рекламе и запрет
   на публичный сервер в тексте.
3. Положите рядом файл лицензии и допишите сюда провенанс: источник, версию,
   размер, sha256.
