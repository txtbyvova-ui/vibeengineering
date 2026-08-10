import Nav from "@/components/Nav";
// Прототип Redline: Hero заменён на wireframe-сцену. Предыдущий Hero с воронкой
// остался в дереве — возврат это одна строка здесь. См. docs/REPORT-hero-wireframe.md.
import Hero from "@/components/HeroWireframe";
import Marquee from "@/components/Marquee";
import Services from "@/components/Services";
import USP from "@/components/USP";
import Cases from "@/components/Cases";
import Process from "@/components/Process";
import Team from "@/components/Team";
import Contact from "@/components/Contact";

export default function App() {
  return (
    <>
      <div className="bg-grid" aria-hidden />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Services />
        <USP />
        <Cases />
        <Process />
        <Team />
        <Contact />
      </main>
    </>
  );
}
