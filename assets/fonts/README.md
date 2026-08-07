# Шрифты в репозитории

Здесь лежит шрифт **для OG-карточки**, читает его один
[scripts/generate-og.mjs](../../scripts/generate-og.mjs) на этапе сборки.
Каталог не отдаётся с сайта: он вне `public/`.

⚠️ **Шрифты самого сайта живут не здесь, а в [`public/fonts`](../../public/fonts)** —
туда они переехали 2026-08-08 вместе с отказом от сторонних CDN. Это M PLUS
Rounded 1c, IBM Plex Sans и JetBrains Mono, все три по SIL OFL 1.1, лицензии
лежат рядом с файлами (`OFL-*.txt`). Подключение — `@font-face` в
[src/index.css](../../src/index.css).

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

## M PLUS Rounded 1c — заголовочный, в git его нет намеренно

| | |
|---|---|
| Лицензия | **SIL Open Font License 1.1** (`nameID 14` самого файла → `scripts.sil.org/OFL`; Google Fonts в метаданных семейства тоже указывает `"license": "ofl"`) |
| Копирайт | `Copyright 2016 The Rounded M+ Project Authors.` (`nameID 0`) |
| Веб-версия | сабсеты latin+cyrillic, woff2, лежат в `public/fonts` **и в git есть** — 57 kB на два начертания |
| Версия для OG | TTF-сабсет latin+cyrillic (~103 kB) с Google Fonts, в `.cache/og-fonts` вне git |

Лицензия редистрибуцию разрешает, и веб-файлы поэтому закоммичены. А вот полный
TTF семейства в git не едет по другой причине — **размеру**: M PLUS Rounded 1c
японский, статическое начертание весит порядка мегабайтов на иероглифах, которые
карточке не нужны. Сабсет качается на сборке и кэшируется.

⚠️ **Формат ответа Google Fonts зависит от User-Agent, и это не мелочь**
(проверено 2026-08-08): современному Chrome отдаётся woff2 — satori его не
понимает; UA от IE получает eot; **truetype отдаётся только старому Android-UA**.
Константа `UA_TTF` в скрипте — про это.

Отказ CDN сборку не валит: заголовок карточки в этом случае набирается
JetBrains Mono, в лог уходит предупреждение.

## Присланные M PLUS 1 и Assistant — не подошли, в репозитории их нет

Владелец прислал киты этих двух семейств (лежат в `fonts/`, закрыты `.gitignore`).
Использовать их нельзя, и причина не в лицензии, а в покрытии — замерено
разбором `cmap` и подтверждено у первоисточника:

| | Покрытие | Кириллица |
|---|---|---|
| M PLUS 1 | латиница + 5 287 иероглифов, хирагана, катакана; 1.7 МБ на начертание | **0 из 256** |
| Assistant | латиница + иврит, 431 кодпоинт | **0 из 256**, плюс нет `₽`, `№`, `→`, `◆` |

На Google Fonts у M PLUS 1 сабсеты latin/latin-ext/vietnamese, у Assistant —
hebrew/latin/latin-ext. Кириллического сабсета нет ни у одного. Сайт русский,
поэтому взяты M PLUS Rounded 1c (та же семья M PLUS, кириллица есть)
и IBM Plex Sans.

## Clash Display — здесь его нет и уже не понадобится

Использовался до 2026-08-08 как заголовочный. Снят не из-за лицензии, а потому
что в нём **0 кодпоинтов кириллицы** — весь русский текст сайта рендерился
системным шрифтом. Разбор — [BACKLOG §0](../../docs/BACKLOG.md).

Историческая справка про лицензию сохраняется: коммитить его было **нельзя**.



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
