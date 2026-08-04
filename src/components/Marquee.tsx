import { clients } from "@/data/clients";

export default function Marquee() {
  // Duplicate the list so the -50% translate loops seamlessly.
  const loop = [...clients, ...clients];

  return (
    <section
      aria-label="Клиенты"
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
