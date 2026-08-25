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
import { FiArrowUpRight, FiMail } from "react-icons/fi";
import { videoSrc, type Project } from "@/lib/works";

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

// The native OS cursor stays visible everywhere — this only renders the
// floating image thumbnail for "preview" mode (see the "Trabalhos" nav
// link). Every other mode is invisible; setCursor("play"/"link") calls
// elsewhere in the app are harmless no-ops as far as this component goes.
export function Cursor({ mode, previewSrc }: { mode: CursorMode; previewSrc?: string | null }) {
  const dot = useRef<HTMLDivElement>(null);

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

  if (mode !== "preview" || !previewSrc) {
    return <div ref={dot} className="cursor" aria-hidden="true" />;
  }

  return (
    <div ref={dot} className="cursor cursor--preview" aria-hidden="true">
      <img className="cursor__preview" src={previewSrc} alt="" />
    </div>
  );
}

const SCRIBBLE_LENGTH = 60;
const SCRIBBLE_SPAWN_INTERVAL_MS = 22;
const SCRIBBLE_JITTER = 5;

// Draws a loose, hand-drawn-looking line that trails behind the pointer and
// fades away — like the cursor is scribbling on the page — instead of
// replacing the native cursor. Each segment connects the last sampled point
// to the current one (with a little random jitter for the wobble), using a
// fixed pool of recycled DOM nodes so a fast sweep across the page stays
// cheap.
export function CursorTrail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nextIndex = useRef(0);
  const lastSpawn = useRef(0);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const segments = Array.from(container.children) as HTMLElement[];

    const spawn = (x1: number, y1: number, x2: number, y2: number) => {
      const segment = segments[nextIndex.current];
      nextIndex.current = (nextIndex.current + 1) % segments.length;
      if (!segment) return;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      segment.style.width = `${length}px`;
      segment.style.transform = `translate3d(${x1}px, ${y1}px, 0) rotate(${angle}deg)`;

      segment.classList.remove("cursor-trail__segment--active");
      void segment.offsetWidth; // restart the CSS animation from scratch
      segment.classList.add("cursor-trail__segment--active");
    };

    const onMove = (event: PointerEvent) => {
      const now = performance.now();
      if (now - lastSpawn.current < SCRIBBLE_SPAWN_INTERVAL_MS) return;
      lastSpawn.current = now;

      const jitterX = (Math.random() - 0.5) * SCRIBBLE_JITTER;
      const jitterY = (Math.random() - 0.5) * SCRIBBLE_JITTER;
      const point = { x: event.clientX + jitterX, y: event.clientY + jitterY };

      if (lastPoint.current) {
        spawn(lastPoint.current.x, lastPoint.current.y, point.x, point.y);
      }
      lastPoint.current = point;
    };

    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={containerRef} className="cursor-trail" aria-hidden="true">
      {Array.from({ length: SCRIBBLE_LENGTH }).map((_, i) => (
        <span className="cursor-trail__segment" key={i} />
      ))}
    </div>
  );
}

// Wraps a single focusable element (link, button) and pulls it toward the
// pointer while hovered, snapping back on leave — the classic "magnetic
// button" hover effect, built with gsap.quickTo for a cheap, smooth tween.
export function Magnetic({ children, strength = 0.55 }: { children: ReactElement; strength?: number }) {
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

// Ties any element with a `data-parallax="<percent>"` attribute to scroll
// position: it scrubs a vertical shift as its own containing section moves
// through the viewport. Each target is pre-scaled up by the same percent
// (via gsap.set) so the extra room it reveals while parallaxing never shows
// a gap at the edges.
export function useParallax() {
  useEffect(() => {
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const amount = Number(el.dataset.parallax) || 15;
        const section = el.closest("section");

        gsap.set(el, { scale: 1 + amount / 100 });
        gsap.to(el, {
          yPercent: amount,
          ease: "none",
          scrollTrigger: {
            trigger: section ?? el,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6
          }
        });
      });
    });

    return () => context.revert();
  }, []);
}

type Stat = { value: number; suffix?: string; label: string };

// Placeholder numbers — swap these for the studio's real figures.
const stats: Stat[] = [
  { value: 150, suffix: "+", label: "Projetos entregues" },
  { value: 40, suffix: "+", label: "Marcas atendidas" },
  { value: 8, label: "Anos de estrada" }
];

function StatCounter({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const counter = { value: 0 };
    const context = gsap.context(() => {
      gsap.to(counter, {
        value: stat.value,
        duration: 1.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          once: true
        },
        onUpdate: () => {
          el.textContent = `${Math.round(counter.value)}${stat.suffix ?? ""}`;
        }
      });
    });

    return () => context.revert();
  }, [stat]);

  return (
    <span className="stats__number" ref={ref}>
      0{stat.suffix ?? ""}
    </span>
  );
}

export function Stats() {
  return (
    <section className="stats" aria-label="Números do estúdio">
      {stats.map((stat) => (
        <div className="stats__item" key={stat.label}>
          <StatCounter stat={stat} />
          <span className="stats__label">{stat.label}</span>
        </div>
      ))}
    </section>
  );
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
  const linkRef = useRef<HTMLAnchorElement>(null);
  const tiltX = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const tiltY = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = linkRef.current;
    if (!el) return;
    gsap.set(el, { transformPerspective: 800 });
    tiltX.current = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3.out" });
    tiltY.current = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3.out" });
  }, []);

  const activate = () => {
    setActive(true);
    setCursor("play");
    onActivate();
    videoRef.current?.play().catch(() => {});
  };

  // 3D tilt: rotates the card toward the pointer's position within it,
  // like it's tipping in your hand — reset back to flat on leave below.
  const tilt = (event: React.PointerEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;
    tiltY.current?.(relX * 16);
    tiltX.current?.(relY * -16);
  };

  const deactivate = () => {
    setActive(false);
    setCursor("default");
    onDeactivate();
    videoRef.current?.pause();
    tiltX.current?.(0);
    tiltY.current?.(0);
  };

  return (
    <Link
      ref={linkRef}
      href={`/projetos/${project.slug}`}
      className={`filmstrip-panel${active ? " filmstrip-panel--active" : ""}`}
      onPointerEnter={activate}
      onPointerMove={tilt}
      onPointerLeave={deactivate}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={videoSrc(project.video)}
        muted
        loop
        playsInline
        preload="none"
      />
    </Link>
  );
}

// The whole section pins in place while the track scrolls sideways as the
// user scrolls down — a horizontal-scroll section instead of stacking
// downward, on every screen size (touch scroll drives it the same way a
// mouse wheel does).
export function Filmstrip({ projects, setCursor }: { projects: Project[]; setCursor: (mode: CursorMode) => void }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeCount = useRef(0);

  const handleActivate = () => {
    activeCount.current += 1;
  };

  const handleDeactivate = () => {
    activeCount.current = Math.max(0, activeCount.current - 1);
  };

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const context = gsap.context(() => {
      const distance = track.scrollWidth - window.innerWidth;
      if (distance <= 0) return;

      gsap.to(track, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance}`,
          scrub: 0.6,
          pin: true,
          invalidateOnRefresh: true
        }
      });
    });

    return () => context.revert();
  }, [projects]);

  return (
    <div className="filmstrip" ref={sectionRef}>
      <div className="filmstrip__track" ref={trackRef}>
        {projects.map((project) => (
          <FilmstripPanel
            key={project.slug}
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
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // A missing file often 404s before React attaches the onError handler
    // below, so the browser's own broken-image icon shows up instead of the
    // text fallback. Catch that already-failed state on mount too.
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setBroken(true);
    }
  }, []);

  if (broken) {
    return <span className="clients__fallback">{name}</span>;
  }

  return <img ref={imgRef} src={src} alt={name} loading="lazy" onError={() => setBroken(true)} />;
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
