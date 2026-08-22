"use client";

import gsap from "gsap";
import { useEffect, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { posterFor, projects } from "@/lib/works";
import {
  autoplayVideoRef,
  Clients,
  Contact,
  Cursor,
  CursorMode,
  Filmstrip,
  Magnetic,
  Scramble,
  ShowreelModal,
  SiteHeader,
  SplitText,
  useCinematicScroll,
  useTextReveal
} from "@/components/SiteChrome";
import { FiPlay } from "react-icons/fi";

const HERO_VIDEO = "https://pub-3e9f9cb57ae84ac58d16106bb6690f67.r2.dev/lagoinha-praia-grande-hero-web.mp4";

function Hero({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  const [showreelOpen, setShowreelOpen] = useState(false);

  return (
    <section className="hero" id="topo">
      <video
        className="hero__video"
        src={HERO_VIDEO}
        poster={posterFor("/videos/lagoinha-praia-grande-hero-web.mp4")}
        ref={autoplayVideoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className="grain" />
      <div className="hero__copy">
        <p className="kicker">Filmes / campanhas / conteúdo</p>
        <h1 className="reveal">
          <SplitText>VÍDEO</SplitText>
          <br />
          <SplitText>QUE FAZ</SplitText>
          <br />
          <SplitText>MARCA</SplitText>
        </h1>
        <Magnetic>
          <button
            className="hero__showreel"
            type="button"
            onClick={() => setShowreelOpen(true)}
            onMouseEnter={() => setCursor("link")}
            onMouseLeave={() => setCursor("default")}
          >
            <FiPlay />
            <Scramble>Assistir showreel</Scramble>
          </button>
        </Magnetic>
      </div>
      <span className="scroll-cue">Role</span>
      <ShowreelModal
        video={HERO_VIDEO}
        poster={posterFor("/videos/lagoinha-praia-grande-hero-web.mp4")}
        open={showreelOpen}
        onClose={() => setShowreelOpen(false)}
      />
    </section>
  );
}

function Portfolio({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  return (
    <section className="portfolio" id="portfolio">
      <div className="section-heading">
        <p className="kicker">Portfólio</p>
        <h2 className="reveal">
          <SplitText>Trabalhos em vídeo</SplitText>
        </h2>
      </div>
      <Filmstrip projects={projects} setCursor={setCursor} />
    </section>
  );
}

function Hire({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  return (
    <section className="hire" id="contrate">
      <div className="hire__copy">
        <p className="kicker">Briefing inicial</p>
        <h2 className="reveal">
          <SplitText>Sua campanha</SplitText>
          <br />
          <SplitText>começa aqui.</SplitText>
        </h2>
        <p>
          Me conte o básico do projeto e eu retorno com o melhor formato para gravação, edição e entrega.
        </p>
      </div>

      <form className="hire__form" aria-label="Formulário para contratar">
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

        <Magnetic>
          <button
            className="hire__submit"
            type="submit"
            onMouseEnter={() => setCursor("link")}
            onMouseLeave={() => setCursor("default")}
          >
            <Scramble>Enviar briefing</Scramble>
            <FiArrowRight />
          </button>
        </Magnetic>
      </form>
    </section>
  );
}

export default function Home() {
  const [cursor, setCursor] = useState<CursorMode>("default");
  const [preview, setPreview] = useState<string | null>(null);

  useCinematicScroll();
  useTextReveal();

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(
        ".filmstrip, .hire__copy, .hire__form, .contact",
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
      <Cursor mode={cursor} previewSrc={preview} />
      <SiteHeader setCursor={setCursor} setPreview={setPreview} />
      <Hero setCursor={setCursor} />
      <Clients />
      <Portfolio setCursor={setCursor} />
      <Hire setCursor={setCursor} />
      <Contact setCursor={setCursor} />
    </main>
  );
}
