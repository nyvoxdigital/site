"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiMail } from "react-icons/fi";

gsap.registerPlugin(ScrollTrigger);

export type CursorMode = "default" | "play" | "link";

export function autoplayVideoRef(video: HTMLVideoElement | null) {
  if (!video) return;
  video.muted = true;
  video.play().catch(() => {});
}

export function useCinematicScroll() {
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

export function Cursor({ mode }: { mode: CursorMode }) {
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

export function SiteHeader({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${solid ? " site-header--solid" : ""}`}>
      <Link
        href="/"
        className="site-header__brand"
        onMouseEnter={() => setCursor("link")}
        onMouseLeave={() => setCursor("default")}
      >
        Studio Motion
      </Link>
      <nav aria-label="Navegacao principal">
        <Link href="/#portfolio" onMouseEnter={() => setCursor("link")} onMouseLeave={() => setCursor("default")}>
          Trabalhos
        </Link>
        <Link href="/#contrate" onMouseEnter={() => setCursor("link")} onMouseLeave={() => setCursor("default")}>
          Orçamento
        </Link>
      </nav>
    </header>
  );
}

export function Contact({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
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
