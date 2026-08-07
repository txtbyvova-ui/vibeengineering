import { useEffect, useState } from "react";
import { navBrand, navCta, navLinks } from "@/data/nav";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
      <nav
        className={`flex items-center justify-between px-5 md:px-10 transition-all duration-500 ease-premium ${
          scrolled ? "py-4" : "py-6"
        }`}
      >
        <a
          href={navBrand.href}
          className="font-display text-2xl font-semibold leading-none tracking-tightest text-textMain"
          aria-label={navBrand.ariaLabel}
        >
          {navBrand.mark}
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-xs uppercase tracking-[0.16em] text-textMain transition-opacity duration-300 hover:opacity-50"
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href={navCta.href}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-textMain px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-textMain transition-colors duration-300 hover:bg-textMain hover:text-bg"
        >
          {navCta.label}
        </a>
      </nav>
    </header>
  );
}
