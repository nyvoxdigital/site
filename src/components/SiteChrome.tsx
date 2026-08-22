"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref
} from "react";
import { FiArrowUpRight, FiMail, FiPlay, FiX } from "react-icons/fi";
import { posterSrc, videoSrc, type Project } from "@/lib/works";

gsap.registerPlugin(ScrollTrigger);

export type CursorMode = "default" | "play" | "link" | "preview";

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

export function Cursor({ mode, previewSrc }: { mode: CursorMode; previewSrc?: string | null }) {
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
      {mode === "preview" && previewSrc ? (
        <img className="cursor__preview" src={previewSrc} alt="" />
      ) : (
        <span>{label}</span>
      )}
    </div>
  );
}

// Wraps a single focusable element (link, button) and pulls it toward the
// pointer while hovered, snapping back on leave — the classic "magnetic
// button" hover effect, built with gsap.quickTo for a cheap, smooth tween.
export function Magnetic({ children, strength = 0.35 }: { children: ReactElement; strength?: number }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

    const move = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      xTo((event.clientX - (rect.left + rect.width / 2)) * strength);
      yTo((event.clientY - (rect.top + rect.height / 2)) * strength);
    };

    const reset = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", reset);

    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", reset);
    };
  }, [strength]);

  if (!isValidElement(children)) return children;

  return cloneElement(children as ReactElement<{ ref?: Ref<HTMLElement> }>, { ref });
}

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// On hover, briefly cycles each character through random glyphs before
// settling left-to-right into the real text. The scrambling copy is
// aria-hidden; a plain (visually hidden) span keeps the accessible name
// stable so screen readers never hear the garbled mid-animation text.
export function Scramble({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  const raf = useRef<number>(0);
  const text = children;

  const start = () => {
    cancelAnimationFrame(raf.current);
    frame.current = 0;
    const totalFrames = text.length * 3;

    const tick = () => {
      const el = ref.current;
      if (!el) return;
      const progress = frame.current / totalFrames;
      let output = "";

      for (let i = 0; i < text.length; i++) {
        if (text[i] === " ") {
          output += " ";
        } else if (progress > i / text.length + 0.3) {
          output += text[i];
        } else {
          output += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }

      el.textContent = output;
      frame.current += 1;

      if (progress < 1.3) {
        raf.current = requestAnimationFrame(tick);
      } else {
        el.textContent = text;
      }
    };

    raf.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    cancelAnimationFrame(raf.current);
    if (ref.current) ref.current.textContent = text;
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <>
      <span aria-hidden="true" ref={ref} onPointerEnter={start} onPointerLeave={reset}>
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </>
  );
}

// Fullscreen video lightbox, opened from a trigger button. Reuses whatever
// video src/poster it's given (the hero clip, by default) instead of
// requiring a separate edited showreel file.
export function ShowreelModal({
  video,
  poster,
  open,
  onClose
}: {
  video: string;
  poster?: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="showreel-modal" onClick={onClose}>
      <button className="showreel-modal__close" onClick={onClose} aria-label="Fechar showreel">
        <FiX />
      </button>
      <video
        className="showreel-modal__video"
        src={video}
        poster={poster}
        controls
        autoPlay
        playsInline
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

// Persistent black overlay that lives in the root layout (never unmounts
// between route changes) and wipes away on every pathname change, giving
// project/home navigation a cut transition instead of an instant swap.
export function PageTransition() {
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const el = overlayRef.current;
    if (!el) return;

    gsap.set(el, { scaleY: 1 });
    gsap.to(el, { scaleY: 0, duration: 0.6, ease: "power3.inOut" });
  }, [pathname]);

  return <div ref={overlayRef} className="page-transition" aria-hidden="true" />;
}

// Splits a line of text into words, each masked inside an overflow-hidden
// span so useTextReveal can slide it up into view. Call once per visual
// line (existing <br /> line breaks in headings stay put around it).
export function SplitText({ children }: { children: string }) {
  const words = children.trim().split(/\s+/);
  const nodes: ReactNode[] = [];

  words.forEach((word, index) => {
    nodes.push(
      <span className="split-text__mask" key={`word-${index}`}>
        <span className="split-text__word">{word}</span>
      </span>
    );
    // A plain space node (not masked) between words so the browser can
    // still wrap the line normally, same as if this were regular text.
    if (index < words.length - 1) nodes.push(" ");
  });

  return <>{nodes}</>;
}

// Reveals every heading marked with the "reveal" class: its SplitText words
// slide up from behind their mask, staggered, as the heading scrolls into
// view. One scroll trigger per heading, so multi-line titles wave in
// together instead of every word on the page firing at once.
export function useTextReveal() {
  useEffect(() => {
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((heading) => {
        const words = Array.from(heading.querySelectorAll<HTMLElement>(".split-text__word"));
        if (!words.length) return;

        // Set (and animate from) the hidden state in JS, not CSS — so if this
        // script ever fails to run, the words just render normally instead of
        // staying stuck invisible behind their mask.
        gsap.set(words, { yPercent: 110 });
        gsap.to(words, {
          yPercent: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.035,
          scrollTrigger: {
            trigger: heading,
            start: "top 95%",
            once: true
          }
        });
      });

      ScrollTrigger.refresh();
    });

    return () => context.revert();
  }, []);
}

export function SiteHeader({ setCursor, setPreview }: { setCursor: (mode: CursorMode) => void; setPreview?: (src: string | null) => void }) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${solid ? " site-header--solid" : ""}`}>
      <Magnetic>
        <Link
          href="/"
          className="site-header__brand"
          onMouseEnter={() => setCursor("link")}
          onMouseLeave={() => setCursor("default")}
        >
          <Scramble>Studio Motion</Scramble>
        </Link>
      </Magnetic>
      <nav aria-label="Navegacao principal">
        <Magnetic>
          <Link
            href="/#portfolio"
            onMouseEnter={() => {
              setCursor("preview");
              setPreview?.("/videos/alecgol-gillette-2-poster.jpg");
            }}
            onMouseLeave={() => {
              setCursor("default");
              setPreview?.(null);
            }}
          >
            <Scramble>Trabalhos</Scramble>
          </Link>
        </Magnetic>
        <Magnetic>
          <Link href="/#contrate" onMouseEnter={() => setCursor("link")} onMouseLeave={() => setCursor("default")}>
            <Scramble>Orçamento</Scramble>
          </Link>
        </Magnetic>
      </nav>
    </header>
  );
}

function FilmstripPanel({
  project,
  setCursor,
  onActivate,
  onDeactivate
}: {
  project: Project;
  setCursor: (mode: CursorMode) => void;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);

  const activate = () => {
    setActive(true);
    setCursor("play");
    onActivate();
    videoRef.current?.play().catch(() => {});
  };

  const deactivate = () => {
    setActive(false);
    setCursor("default");
    onDeactivate();
    videoRef.current?.pause();
  };

  return (
    <Link
      href={`/projetos/${project.slug}`}
      className={`filmstrip-panel${active ? " filmstrip-panel--active" : ""}`}
      onPointerEnter={activate}
      onPointerLeave={deactivate}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={videoSrc(project.video)}
        poster={posterSrc(project.video)}
        muted
        loop
        playsInline
        preload="none"
      />
    </Link>
  );
}

// Auto-scrolling filmstrip of every project. The whole strip pauses (CSS
// animation-play-state) the instant any single panel is hovered/touched, and
// that panel's video starts playing — resuming the scroll only once no panel
// is active anymore. The item list is rendered twice back-to-back so the
// CSS scroll animation can loop seamlessly at -50%.
export function Filmstrip({ projects, setCursor }: { projects: Project[]; setCursor: (mode: CursorMode) => void }) {
  const activeCount = useRef(0);
  const [paused, setPaused] = useState(false);

  const handleActivate = () => {
    activeCount.current += 1;
    setPaused(true);
  };

  const handleDeactivate = () => {
    activeCount.current = Math.max(0, activeCount.current - 1);
    if (activeCount.current === 0) setPaused(false);
  };

  const loopItems = [...projects, ...projects];

  return (
    <div className="filmstrip">
      <div className={`filmstrip__track${paused ? " filmstrip__track--paused" : ""}`}>
        {loopItems.map((project, index) => (
          <FilmstripPanel
            key={`${project.slug}-${index}`}
            project={project}
            setCursor={setCursor}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
          />
        ))}
      </div>
    </div>
  );
}

type Brand = { name: string; src: string };

const brands: Brand[] = [
  { name: "Red Bull", src: "/logos/red-bull.svg" },
  { name: "RAM", src: "/logos/ram.svg" },
  { name: "iFlight", src: "/logos/iflight.svg" },
  { name: "DJI", src: "/logos/dji.svg" },
  { name: "Chevrolet", src: "/logos/chevrolet.svg" },
  { name: "GM", src: "/logos/gm.svg" },
  { name: "Ford", src: "/logos/ford.svg" }
];

// Renders the real logo file once it exists in /public/logos; falls back to
// the brand name as text so the row still looks intentional before the
// asset is added.
function ClientLogo({ name, src }: Brand) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return <span className="clients__fallback">{name}</span>;
  }

  return <img src={src} alt={name} loading="lazy" onError={() => setBroken(true)} />;
}

// Looped twice so the CSS scroll animation can wrap seamlessly at -50%,
// same trick as Filmstrip — reads as an endless row even with few logos.
export function Clients() {
  const loopBrands = [...brands, ...brands];

  return (
    <section className="clients" aria-label="Marcas que ja confiaram no trabalho">
      <div className="clients__track">
        {loopBrands.map((brand, index) => (
          <ClientLogo key={`${brand.name}-${index}`} {...brand} />
        ))}
      </div>
    </section>
  );
}

export function Contact({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  return (
    <footer className="contact">
      <div>
        <p className="kicker">Contato direto</p>
        <h2 className="reveal">
          <SplitText>Vamos criar algo que fique.</SplitText>
        </h2>
      </div>
      <nav aria-label="Links de contato">
        {["contato@studiomotion.com.br", "Instagram", "Vimeo"].map((item) => (
          <Magnetic key={item}>
            <a
              href={item.includes("@") ? `mailto:${item}` : "#"}
              onMouseEnter={() => setCursor("link")}
              onMouseLeave={() => setCursor("default")}
            >
              <Scramble>{item}</Scramble>
              {item.includes("@") ? <FiMail /> : <FiArrowUpRight />}
            </a>
          </Magnetic>
        ))}
      </nav>
    </footer>
  );
}
