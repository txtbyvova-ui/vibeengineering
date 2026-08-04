import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
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
        <USP />
        <Cases />
        <Process />
        <Team />
        <Contact />
      </main>
    </>
  );
}
