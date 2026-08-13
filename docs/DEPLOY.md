# Деплой

Прод — статика на nginx, без Node на сервере: собирается локально, заливается
готовый `dist/`. Первый деплой — 2026-08-13, релиз `2026-08-13-77f325a`.

## Куда

| | |
|---|---|
| Сервер | `83.147.255.80`, Ubuntu 26.04 LTS, 2 CPU / 3.8 ГБ / 59 ГБ |
| Доступ | `root` по **ключу** (`claude-deploy@vibeengineering` в `/root/.ssh/authorized_keys`) |
| Веб-сервер | nginx 1.28.3, конфиг `/etc/nginx/sites-available/vibeengineering` |
| Корень | `/var/www/vibeengineering/current` → симлинк на релиз |
| Релизы | `/var/www/vibeengineering/releases/<дата>-<коммит>`, хранятся три последних |
| Адрес | **http://83.147.255.80** — по IP, без TLS. Почему — ниже |

## Как выкатить новую версию

```bash
npm run build && tar -czf dist.tar.gz -C dist .
```

Дальше залить архив и переключить симлинк — четыре команды на сервере:

```bash
R=$(date +%F)-$(git rev-parse --short HEAD); install -d -m 755 /var/www/vibeengineering/releases/$R && tar -xzf /tmp/dist.tar.gz -C /var/www/vibeengineering/releases/$R && chown -R www-data:www-data /var/www/vibeengineering/releases/$R && ln -sfn /var/www/vibeengineering/releases/$R /var/www/vibeengineering/current && systemctl reload nginx
```

Переключение — атомарная замена симлинка, поэтому **откат это одна команда**,
а не повторная заливка:

```bash
ln -sfn /var/www/vibeengineering/releases/<предыдущий> /var/www/vibeengineering/current && systemctl reload nginx
```

⚠️ `dist.tar.gz` в `.gitignore` не значится — удалять после заливки, иначе
3.5 МБ уедут в коммит.

## Что настроено в nginx

- `try_files $uri $uri/ /index.html` — одностраничник, любой неизвестный путь
  отдаётся самой страницей;
- `/assets/*` (хеш в имени) — `max-age=31536000, immutable`; медиа и шрифты — 30 дней;
- `index.html` — `no-cache`: это точка входа со ссылками на хешированные ассеты;
- gzip для html/css/js/svg/xml; замер: главная 7348 → **2189 B** по проводу;
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.

⚠️ **`add_header` в nginx не дополняет родительские заголовки, а ОТМЕНЯЕТ их.**
Из-за этого заголовки безопасности с уровня `server` не доезжали до location'ов,
где стоит свой `Cache-Control` (проверено запросом: приходили `None`). Поэтому они
вынесены в `/etc/nginx/snippets/ve-security.conf` и подключаются `include` в каждый
такой location отдельно. Добавляете location с `add_header` — добавляйте и `include`.

## Открытое: домен и TLS

**`vibeengineering.ru` указывает на `95.163.244.135`, а не на этот сервер.**
Пока A-запись не переведена, здесь возможен только доступ по IP и только по HTTP:
Let's Encrypt проверяет владение доменом запросом на него же, и для чужого IP
проверка не пройдёт.

Порядок, когда домен решат переносить:

1. A-запись `vibeengineering.ru` и `www` → `83.147.255.80`, дождаться распространения;
2. `apt-get install -y certbot python3-certbot-nginx`;
3. `certbot --nginx -d vibeengineering.ru -d www.vibeengineering.ru` — он же
   пропишет редирект с 80 на 443 и заведёт таймер обновления;
4. заменить `server_name _;` на реальный домен.

До этого шага `canonical`, `og:url` и `sitemap.xml` в разметке указывают
на `https://vibeengineering.ru` — то есть на адрес, который отдаёт другой сервер.
Для боевого запуска это чинится переносом домена, а не правкой разметки.

## Прочее состояние сервера

- `ufw` **выключен** — как было при выдаче сервера, специально не трогали.
  Если включать: сначала `ufw allow 22,80,443/tcp`, только потом `ufw enable`,
  иначе доступ по SSH закроется вместе со всем остальным.
- Node на сервере нет и не нужен: собирается локально.
- Пароль root, с которым сервер выдали, при первом же заходе заменён на вход
  по ключу. **Пароль засветился в переписке — сменить.** Вход по паролю
  в `sshd_config` не запрещали: после смены пароля имеет смысл поставить
  `PasswordAuthentication no`.
