"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiMail } from "react-icons/fi";

gsap.registerPlugin(ScrollTrigger);

export type CursorMode = "default" | "play" | "link";

// Videos that should be playing right now (either always-visible hero videos, or lazy
// cards currently scrolled into view). Only these get retried on the first user gesture —
// videos that are off-screen and intentionally paused must stay paused.
const videosThatShouldPlay = new Set<HTMLVideoElement>();
let unlockListenerAttached = false;

function resumeVideosThatShouldPlay() {
  videosThatShouldPlay.forEach((video) => {
    if (video.paused) {
      video.muted = true;
      video.play().catch(() => {});
    }
  });
}

// Some mobile browsers (notably iOS Safari in Low Power Mode) silently refuse the very
// first autoplay attempt and only allow playback after a genuine user gesture on the
// page. This retries every currently-visible video on the first touch/scroll/key press
// so playback starts as soon as possible without needing the user to tap the video itself.
function ensureUnlockListener() {
  if (unlockListenerAttached || typeof window === "undefined") return;
  unlockListenerAttached = true;

  const events: (keyof WindowEventMap)[] = ["touchstart", "pointerdown", "scroll", "keydown"];
  const handler = () => {
    resumeVideosThatShouldPlay();
    events.forEach((event) => window.removeEventListener(event, handler));
  };

  events.forEach((event) => window.addEventListener(event, handler, { passive: true }));
}

export function autoplayVideoRef(video: HTMLVideoElement | null) {
  if (!video) return;
  video.muted = true;
  videosThatShouldPlay.add(video);
  ensureUnlockListener();

  const tryPlay = () => video.play().catch(() => {});
  tryPlay();
  video.addEventListener("loadedmetadata", tryPlay, { once: true });
  video.addEventListener("canplay", tryPlay, { once: true });
}

let lazyObserver: IntersectionObserver | null = null;

function getLazyObserver() {
  if (lazyObserver || typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
    return lazyObserver;
  }
  lazyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          videosThatShouldPlay.add(video);
          video.muted = true;
          video.play().catch(() => {});
        } else {
          videosThatShouldPlay.delete(video);
          video.pause();
        }
      });
    },
    { rootMargin: "200px 0px" }
  );
  return lazyObserver;
}

// For videos further down the page (portfolio cards, project video sections): don't fetch
// or play anything until the card is about to scroll into view, and pause again once it
// scrolls back out. Cuts the amount of video data downloaded on page load from "every
// video on the page" down to just what's actually visible.
export function lazyAutoplayVideoRef(video: HTMLVideoElement | null) {
  if (!video) return;
  video.muted = true;
  ensureUnlockListener();
  getLazyObserver()?.observe(video);
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
