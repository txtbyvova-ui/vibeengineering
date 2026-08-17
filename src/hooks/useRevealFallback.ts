import { useEffect, useState } from "react";

/**
 * Жив ли `IntersectionObserver` на этой странице.
 *
 * ⚠️ **Зачем это вообще нужно.** `RevealText` прячет текст трансформом
 * `y: 110%` под `overflow: hidden` и снимает его по `whileInView`, то есть
 * по колбэку `IntersectionObserver`. Если колбэк не приходит, текст остаётся
 * спрятанным **навсегда** — не «без анимации», а невидимым.
 *
 * Это не теория: 2026-08-13 на проде так пропали ВСЕ заголовки секций —
 * «Услуги», «Кейсы», «Процесс», «Команда», «Есть задача — есть расчёт» и обе
 * половины заголовка УТП. От заголовка УТП оставался виден один акцентный союз
 * «и» — единственный кусок, не обёрнутый в reveal. Владелец так и сообщил:
 * «посреди экрана висит гигантская оторванная красная буква». Замер показал
 * восемь обёрток из восьми со зависшим `translateY`.
 *
 * Поэтому reveal обязан **отказывать в видимую сторону**: не сработал — текст
 * просто стоит на месте без анимации. Проверяем не предположением, а пробником:
 * вешаем наблюдателя на заведомо видимый элемент и ждём колбэк.
 *
 * Проба одна на страницу: результат кэшируется в модуле, а `RevealText`
 * на странице десяток.
 */

type Verdict = "unknown" | "alive" | "dead";

/** Сколько ждать колбэк, прежде чем счесть наблюдателя мёртвым. */
const PROBE_MS = 500;

let verdict: Verdict = "unknown";
let started = false;
const listeners = new Set<() => void>();

function settle(next: Exclude<Verdict, "unknown">) {
  if (verdict !== "unknown") return;
  verdict = next;
  for (const notify of listeners) notify();
  listeners.clear();
}

function startProbe() {
  if (started) return;
  started = true;

  if (typeof IntersectionObserver === "undefined") {
    settle("dead");
    return;
  }
  // Нулевой вьюпорт: корня у наблюдателя нет, пересечение не случится никогда.
  // Именно так ведут себя встроенные webview со свёрнутой панелью.
  if (!window.innerWidth || !window.innerHeight) {
    settle("dead");
    return;
  }

  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:8px;height:8px;pointer-events:none;opacity:0";
  document.body.appendChild(probe);

  let timer = 0;
  const cleanup = () => {
    window.clearTimeout(timer);
    io.disconnect();
    probe.remove();
  };
  const io = new IntersectionObserver(() => {
    cleanup();
    settle("alive");
  });
  timer = window.setTimeout(() => {
    cleanup();
    settle("dead");
  }, PROBE_MS);
  io.observe(probe);
}

/**
 * `true` — наблюдатель не отвечает, reveal'ы должны показать текст как есть.
 * Пока проба не завершилась, возвращает `false`: у здорового браузера анимация
 * должна остаться, а полсекунды ожидания невидимы на фоне самой анимации.
 */
export default function useRevealFallback(): boolean {
  const [dead, setDead] = useState(verdict === "dead");

  useEffect(() => {
    if (verdict !== "unknown") {
      setDead(verdict === "dead");
      return;
    }
    const notify = () => setDead(verdict === "dead");
    listeners.add(notify);
    startProbe();
    return () => {
      listeners.delete(notify);
    };
  }, []);

  return dead;
}
