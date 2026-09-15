"use client";

import gsap from "gsap";
import { memo, useEffect, useState, type FormEvent } from "react";
import { FiArrowRight } from "react-icons/fi";
import { hasRealFootage, projects } from "@/lib/works";

// Only projects with their own real clip go in the carousel — everything else still
// shares one placeholder video, and showing those alongside would just repeat the same
// clip over and over next to the real ones.
const showcasedProjects = projects.filter(hasRealFootage);
import {
  BackgroundVideo,
  Clients,
  Contact,
  CONTACT,
  Cursor,
  CursorMode,
  Filmstrip,
  Scramble,
  SplitText,
  Stats,
  useCinematicScroll,
  useParallax,
  useTextReveal
} from "@/components/SiteChrome";

// Memoized: no props ever change, so without this it would re-render — and re-diff its
// whole subtree, canvas and all — every time setCursor fires from a hover anywhere else
// on the page, purely because it shares a parent with the cursor state. Same reasoning
// as the note on Portfolio below, just more expensive here given what Hero renders.
const Hero = memo(function Hero() {
  return (
    <section className="hero" id="topo">
      <BackgroundVideo
        block="hero"
        src="https://pub-3e9f9cb57ae84ac58d16106bb6690f67.r2.dev/melhores-takes-comprimido.mp4"
        parallax="25"
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
      </div>
      <span className="scroll-cue">Role</span>
    </section>
  );
});

// Memoized: setCursor is the stable function useState always returns, so its identity
// never changes — meaning without this, Portfolio (and the whole Filmstrip carousel
// inside it, six video panels included) would still re-render on every single hover-in
// and hover-out anywhere else on the page, since `cursor` itself lives one level up in
// Home. That's the kind of thing that compounds into visible jank exactly when pointer
// events are already coming in fast, like right as a featured clip hands the carousel
// back to autoplay.
const Portfolio = memo(function Portfolio({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  return (
    <section className="portfolio" id="portfolio">
      <div className="section-heading">
        <p className="kicker">Portfólio</p>
        <h2 className="reveal">
          <SplitText>Trabalhos em vídeo</SplitText>
        </h2>
      </div>
      <Filmstrip projects={showcasedProjects} setCursor={setCursor} />
    </section>
  );
});

const PROJECT_TYPE_LABELS: Record<string, string> = {
  foto: "Foto",
  video: "Vídeo",
  ambos: "Foto + vídeo"
};

// There's no backend to receive this form, so submitting it hands the whole briefing to
// WhatsApp instead — pre-filled and ready to send, in the same place every other contact
// link on the site already points to.
function buildBriefingMessage(form: HTMLFormElement) {
  const data = new FormData(form);
  const tipo = PROJECT_TYPE_LABELS[String(data.get("tipo_projeto") ?? "")] ?? "não informado";

  return [
    "Olá! Vim pelo site e gostaria de um orçamento.",
    "",
    `Nome: ${data.get("nome")}`,
    `E-mail: ${data.get("email")}`,
    `O que precisa: ${tipo}`,
    `Investimento: ${data.get("investimento")}`,
    `Prazo: ${data.get("prazo") || "não informado"}`,
    `Resumo do projeto: ${data.get("mensagem") || "não informado"}`
  ].join("\n");
}

function handleBriefingSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const message = buildBriefingMessage(event.currentTarget);
  const url = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

// Memoized: same reasoning as Portfolio above — setCursor's identity never changes, so
// nothing here needs to re-render just because a hover somewhere else on the page called it.
const Hire = memo(function Hire({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
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

      <form className="hire__form" aria-label="Formulário para contratar" onSubmit={handleBriefingSubmit}>
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
          <Scramble>Enviar briefing</Scramble>
          <FiArrowRight />
        </button>
      </form>
    </section>
  );
});

export default function Home() {
  const [cursor, setCursor] = useState<CursorMode>("default");

  useCinematicScroll();
  useTextReveal();
  useParallax();

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
      <Cursor mode={cursor} />
      <Hero />
      <Clients />
      <Stats />
      <Portfolio setCursor={setCursor} />
      <Hire setCursor={setCursor} />
      <Contact setCursor={setCursor} />
    </main>
  );
}
