"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";
import { FiArrowRight, FiArrowUpRight, FiMail } from "react-icons/fi";
import { projects } from "@/lib/works";

gsap.registerPlugin(ScrollTrigger);

type CursorMode = "default" | "play" | "link";

function useCinematicScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1,
      lerp: 0.12,
      smoothWheel: true,
      wheelMultiplier: 0.9
    });

    const update = (time: number) => lenis.raf(time * 1000);

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);
}

function Cursor({ mode }: { mode: CursorMode }) {
  const dot = useRef<HTMLDivElement>(null);
  const label = mode === "play" ? "PLAY" : "";

  useEffect(() => {
    const cursor = dot.current;
    if (!cursor) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let frame = 0;

    const move = (event: PointerEvent) => {
      tx = event.clientX;
      ty = event.clientY;
    };

    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", move);
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={dot} className={`cursor cursor--${mode}`} aria-hidden="true">
      <span>{label}</span>
    </div>
  );
}

function SiteHeader({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${solid ? " site-header--solid" : ""}`}>
      <a
        href="#topo"
        className="site-header__brand"
        onMouseEnter={() => setCursor("link")}
        onMouseLeave={() => setCursor("default")}
      >
        Studio Motion
      </a>
      <nav aria-label="Navegacao principal">
        <a href="#portfolio" onMouseEnter={() => setCursor("link")} onMouseLeave={() => setCursor("default")}>
          Trabalhos
        </a>
        <a href="#contrate" onMouseEnter={() => setCursor("link")} onMouseLeave={() => setCursor("default")}>
          Orçamento
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    video.current?.play().catch(() => {});
  }, []);

  return (
    <section className="hero" id="topo">
      <video
        ref={video}
        className="hero__video"
        src="/videos/lagoinha-praia-grande-hero-web.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className="grain" />
      <div className="hero__copy">
        <p className="kicker">Filmes / campanhas / conteúdo</p>
        <h1>
          VIDEO
          <br />
          QUE FAZ
          <br />
          MARCA
        </h1>
      </div>
      <span className="scroll-cue">Role</span>
    </section>
  );
}

function Portfolio({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  return (
    <section className="portfolio" id="portfolio">
      <div className="section-heading">
        <p className="kicker">Portfolio</p>
        <h2>Trabalhos em vídeo</h2>
      </div>

      <div className="work-grid">
        {projects.map((project) => (
          <article
            className="work-card"
            key={project.title}
            onMouseEnter={(event) => {
              setCursor("play");
              event.currentTarget.querySelector("video")?.play();
            }}
            onMouseLeave={(event) => {
              setCursor("default");
              event.currentTarget.querySelector("video")?.play();
            }}
          >
            <video src={project.video} autoPlay muted loop playsInline preload="metadata" />
            <div className="work-card__meta">
              <span>{project.category}</span>
              <span>{project.year}</span>
            </div>
            <h3>{project.title}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}

function Hire({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  return (
    <section className="hire" id="contrate">
      <div className="hire__copy">
        <p className="kicker">Briefing inicial</p>
        <h2>
          Vamos desenhar
          <br />
          sua próxima
          <br />
          campanha.
        </h2>
        <p>
          Me conte o básico do projeto e eu retorno com o melhor formato para gravação, edição e entrega.
        </p>
      </div>

      <form className="hire__form" aria-label="Formulario para contratar">
        <div className="form-row">
          <label className="field">
            <span>Nome</span>
            <input name="nome" type="text" autoComplete="name" placeholder="Seu nome" required />
          </label>

          <label className="field">
            <span>E-mail</span>
            <input name="email" type="email" autoComplete="email" placeholder="voce@email.com" required />
          </label>
        </div>

        <fieldset className="choice-field">
          <legend>O que você precisa?</legend>
          <div className="choice-grid">
            {[
              ["foto", "Foto"],
              ["video", "Vídeo"],
              ["ambos", "Foto + vídeo"]
            ].map(([value, label]) => (
              <label className="choice" key={value}>
                <input name="tipo_projeto" type="radio" value={value} required />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-row">
          <label className="field">
            <span>Investimento</span>
            <input name="investimento" type="text" inputMode="decimal" placeholder="Ex: R$ 3.000" required />
          </label>

          <label className="field">
            <span>Prazo</span>
            <input name="prazo" type="text" placeholder="Ex: este mês" />
          </label>
        </div>

        <label className="field field--textarea">
          <span>Resumo do projeto</span>
          <textarea name="mensagem" placeholder="Marca, ideia, cidade, referência ou objetivo da campanha." />
        </label>

        <button
          className="hire__submit"
          type="submit"
          onMouseEnter={() => setCursor("link")}
          onMouseLeave={() => setCursor("default")}
        >
          Enviar briefing
          <FiArrowRight />
        </button>
      </form>
    </section>
  );
}

function Contact({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  return (
    <footer className="contact">
      <div>
        <p className="kicker">Contato direto</p>
        <h2>Vamos criar algo que fique.</h2>
      </div>
      <nav aria-label="Links de contato">
        {["contato@studiomotion.com.br", "Instagram", "Vimeo"].map((item) => (
          <a
            href={item.includes("@") ? `mailto:${item}` : "#"}
            key={item}
            onMouseEnter={() => setCursor("link")}
            onMouseLeave={() => setCursor("default")}
          >
            {item}
            {item.includes("@") ? <FiMail /> : <FiArrowUpRight />}
          </a>
        ))}
      </nav>
    </footer>
  );
}

export default function Home() {
  const [cursor, setCursor] = useState<CursorMode>("default");

  useCinematicScroll();

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(
        ".work-card, .hire__copy, .hire__form, .contact",
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: ".portfolio",
            start: "top 75%"
          }
        }
      );
    });

    return () => context.revert();
  }, []);

  return (
    <main>
      <Cursor mode={cursor} />
      <SiteHeader setCursor={setCursor} />
      <Hero />
      <Portfolio setCursor={setCursor} />
      <Hire setCursor={setCursor} />
      <Contact setCursor={setCursor} />
    </main>
  );
}
