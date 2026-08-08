import { CLIENTS_REPEATS, clients, clientsLabel } from "@/data/clients";

export default function Marquee() {
  // Повтор списка ради бесшовной петли: половина трека обязана быть шире
  // вьюпорта, иначе в конце цикла справа зияет пустая полоса — см. clients.ts.
  const loop = Array.from({ length: CLIENTS_REPEATS }, () => clients).flat();

  return (
    <section
      aria-label={clientsLabel}
      className="group overflow-hidden border-y border-hairline py-6 md:py-8"
    >
      <div className="flex w-max animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
        {loop.map((client, i) => (
          <span
            key={`${client.name}-${i}`}
            className="flex items-center"
          >
            <span className="text-hollow-white px-8 font-display text-4xl font-semibold tracking-tightest md:text-6xl">
              {client.name}
            </span>
            <span className="text-accent" aria-hidden>
              ◆
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
