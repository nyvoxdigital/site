"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  cloneElement,
  isValidElement,
  memo,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref
} from "react";
import { FiArrowUpRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { posterSrc, videoSrc, type Project } from "@/lib/works";

gsap.registerPlugin(ScrollTrigger);

export type CursorMode = "default" | "play" | "link" | "preview";

// Videos that should be playing right now (either always-visible hero videos, or lazy
// cards currently scrolled into view). Only these get retried — videos that are
// off-screen and intentionally paused must stay paused.
const videosThatShouldPlay = new Set<HTMLVideoElement>();
let unlockListenerAttached = false;
let retryTimer: ReturnType<typeof setInterval> | null = null;

// A background video is decorative: it is always muted, never shows controls and never
// takes a tap. Setting the attributes (not just the properties) matters on iOS, where the
// native "start playback" button appears on any video the browser thinks is user-driven.
function prepareBackgroundVideo(video: HTMLVideoElement) {
  video.muted = true;
  video.defaultMuted = true;
  video.controls = false;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.disableRemotePlayback = true;
}

function playNow(video: HTMLVideoElement) {
  video.muted = true;
  // A browser that refused to preload (iOS Low Data Mode does exactly this) leaves the
  // element with nothing buffered, and play() on an empty element just fails again.
  // Kicking off load() first gives it something to actually play.
  if (video.readyState === 0 && video.networkState !== 2) video.load();

  video.play().catch(() => {});
}

function resumeVideosThatShouldPlay() {
  videosThatShouldPlay.forEach((video) => {
    if (video.paused) playNow(video);
  });
}

// Mobile browsers refuse the first autoplay attempt in several situations (iOS Low Power
// Mode, data saver, a page restored in a background tab). Instead of giving up after one
// rejected play(), keep nudging every video that should be running until it actually is.
// The timer stops as soon as nothing is left paused, so it costs nothing in the normal
// case where autoplay works immediately.
const RETRY_INTERVAL_MS = 400;
const MAX_RETRIES = 30;

function stopRetries() {
  if (retryTimer === null) return;
  clearInterval(retryTimer);
  retryTimer = null;
}

function scheduleRetries() {
  if (retryTimer !== null || typeof window === "undefined") return;
  let attempts = 0;

  retryTimer = setInterval(() => {
    if (document.visibilityState !== "visible") return;

    let stillPaused = false;
    videosThatShouldPlay.forEach((video) => {
      if (video.paused) {
        stillPaused = true;
        playNow(video);
      }
    });

    // Give up after ~12s: at that point autoplay is not merely slow, it is blocked
    // (iOS Low Power Mode is the usual reason), and only a user gesture will lift it.
    // The gesture and visibility listeners below take over from here.
    attempts += 1;
    if (!stillPaused || attempts >= MAX_RETRIES) stopRetries();
  }, RETRY_INTERVAL_MS);
}

// Belt and braces on top of the timer: retry on the first real user gesture and whenever
// the tab comes back to the foreground, which is when a blocked autoplay is most likely
// to be allowed through.
function ensureUnlockListener() {
  if (typeof window === "undefined") return;
  scheduleRetries();
  if (unlockListenerAttached) return;
  unlockListenerAttached = true;

  const events: (keyof WindowEventMap)[] = ["touchstart", "touchend", "pointerdown", "click", "scroll", "keydown"];
  events.forEach((event) => window.addEventListener(event, resumeVideosThatShouldPlay, { passive: true }));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      resumeVideosThatShouldPlay();
      scheduleRetries();
    }
  });
}

// Events after which a video that is supposed to loop forever might be sitting paused:
// the source becoming playable, a stall on a flaky mobile connection, or the browser
// pausing it on us.
const RESUME_EVENTS = ["loadedmetadata", "loadeddata", "canplay", "stalled", "suspend", "pause", "ended"];

export function autoplayVideoRef(video: HTMLVideoElement | null) {
  if (!video) return;
  prepareBackgroundVideo(video);
  videosThatShouldPlay.add(video);
  ensureUnlockListener();

  const tryPlay = () => playNow(video);
  tryPlay();
  RESUME_EVENTS.forEach((event) => video.addEventListener(event, tryPlay));
}

// On a client-side navigation the old hero unmounts, and a detached video can never
// start playing — leaving it in the set would keep the retry loop chasing it.
export function releaseAutoplayVideo(video: HTMLVideoElement | null) {
  if (video) videosThatShouldPlay.delete(video);
}

// iOS paints a "start playback" button over any video it will not autoplay, and the CSS
// escape hatch for it (::-webkit-media-controls-start-playback-button) no longer reaches
// the modern media controls, which live in a closed shadow root. So the visible layer is
// a <canvas> fed from the video instead: a canvas has no native controls to draw.
//
// The <video> itself stays laid out at full size underneath — WebKit refuses to play a
// video it considers invisible, so hiding it would trade the button for no playback at
// all. The canvas simply covers it, and only once a frame has actually been painted, so
// a browser that cannot draw the video falls back to showing the video as before.
export function BackgroundVideo({
  block,
  src,
  poster,
  parallax
}: {
  block: string;
  src: string;
  poster?: string;
  parallax?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    let disposed = false;

    // The backing store follows the element's box but is capped: this is a dimmed,
    // full-bleed background, so a phone's full 3x pixel ratio would cost real battery
    // for detail nobody can see.
    const MAX_BACKING_PX = 1280;

    const resizeBacking = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth * ratio;
      const height = canvas.clientHeight * ratio;
      if (width === 0 || height === 0) return false;

      const fit = Math.min(1, MAX_BACKING_PX / Math.max(width, height));
      const nextWidth = Math.round(width * fit);
      const nextHeight = Math.round(height * fit);
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
      return true;
    };

    // Reproduces object-fit: cover, which the canvas does not get for free.
    const paint = () => {
      if (disposed || video.readyState < 2) return;
      if (!video.videoWidth || !video.videoHeight || !resizeBacking()) return;

      const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
      const drawWidth = video.videoWidth * scale;
      const drawHeight = video.videoHeight * scale;
      context.drawImage(
        video,
        (canvas.width - drawWidth) / 2,
        (canvas.height - drawHeight) / 2,
        drawWidth,
        drawHeight
      );

    };

    // The canvas exists to deny iOS a video to draw its play button on, and iOS only
    // draws that button on a video it is refusing to play. A video that IS playing needs
    // no cover — so it is shown directly and the canvas steps aside, which is what keeps
    // this from costing a full-screen repaint per frame on every browser that never had
    // the problem. The canvas starts covering, because that is the state before the first
    // play() attempt has been answered.
    let covering = true;

    const cover = (shouldCover: boolean) => {
      if (shouldCover === covering) return;
      covering = shouldCover;
      // Painted before being revealed, so it never appears holding a stale frame.
      if (shouldCover) paint();
      canvas.dataset.idle = shouldCover ? "false" : "true";
    };

    // A paused video still has a frame to show; these are the moments it becomes
    // available, or the canvas box changes and the old frame no longer fits.
    const repaintEvents = ["loadeddata", "canplay", "seeked"];
    const repaint = () => {
      if (covering) paint();
    };
    repaintEvents.forEach((event) => video.addEventListener(event, repaint));
    window.addEventListener("resize", repaint);
    window.addEventListener("orientationchange", repaint);
    // A cached video may already have fired loadeddata before this effect ran, in which
    // case no event is coming and the canvas would sit on its background colour.
    repaint();

    // ---- Fallback for platforms that refuse play() outright ----
    // iOS in Low Power Mode rejects play() with NotAllowedError even for a muted inline
    // video that is already fully buffered. Seeking, however, is not gated by that policy:
    // assigning currentTime on a paused video decodes and presents that frame. So when
    // playback is refused we advance the video by hand and paint each frame, which gives
    // real motion from the same file with no second asset to ship.
    // Seeking is far slower than decoding a playing stream, and how slow varies by device.
    // So the step is taken from the wall clock rather than a fixed frame count: the clip
    // then runs at its true speed everywhere, and a slow device loses frames instead of
    // drifting into slow motion. The cap keeps a fast device from seeking flat out.
    // 10fps rather than something smoother: every frame here costs a decode, and on a
    // phone that work competes directly with scrolling. A dimmed background reads fine
    // at this rate, and a janky page does not.
    const MIN_FRAME_MS = 1000 / 10;
    const MAX_STEP_SECONDS = 0.5;
    let seeking = false;
    let seekTimer = 0;
    let onScreen = true;
    let lastStepAt = 0;

    const stopSeekFallback = () => {
      seeking = false;
      clearTimeout(seekTimer);
    };

    const stepFrame = () => {
      if (disposed || !seeking) return;
      // Real playback took over (or the hero scrolled away) — hand the frames back.
      if (!video.paused || !onScreen || document.visibilityState !== "visible") {
        stopSeekFallback();
        return;
      }

      const startedAt = performance.now();
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        if (disposed || !seeking) return;
        paint();
        const spent = performance.now() - startedAt;
        seekTimer = window.setTimeout(stepFrame, Math.max(0, MIN_FRAME_MS - spent));
      };

      video.addEventListener("seeked", onSeeked);
      // How much of the clip to skip past: the time the previous frame actually took,
      // clamped so a stall does not jump half the video at once.
      const elapsed = lastStepAt === 0 ? MIN_FRAME_MS : startedAt - lastStepAt;
      lastStepAt = startedAt;
      const step = Math.min(Math.max(elapsed / 1000, MIN_FRAME_MS / 1000), MAX_STEP_SECONDS);
      const next = video.currentTime + step;
      video.currentTime = next >= video.duration ? 0 : next;
    };

    // Reconciles the two modes rather than deciding once: playback can be granted later
    // (the first tap lifts the block) and can be taken away again.
    const reconcile = () => {
      if (disposed) return;
      const shouldSeek =
        video.paused &&
        video.readyState >= 2 &&
        Number.isFinite(video.duration) &&
        video.duration > 0 &&
        onScreen &&
        document.visibilityState === "visible";

      cover(video.paused);

      if (!shouldSeek) {
        stopSeekFallback();
        return;
      }
      if (!seeking) {
        seeking = true;
        lastStepAt = 0;
        stepFrame();
      }
    };

    // Seeking costs decode work on every frame, so it must not run for a hero that has
    // scrolled out of view or a tab in the background.
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              onScreen = entries[entries.length - 1].isIntersecting;
              reconcile();
            },
            { threshold: 0 }
          );
    observer?.observe(canvas);

    const reconcileTimer = setInterval(reconcile, 1500);
    const firstCheck = setTimeout(reconcile, 300);
    // loadeddata is the earliest moment a frame exists to seek through, so the hero
    // starts moving then instead of waiting out the poll interval.
    video.addEventListener("loadeddata", reconcile);
    video.addEventListener("canplay", reconcile);
    video.addEventListener("playing", reconcile);
    video.addEventListener("pause", reconcile);
    document.addEventListener("visibilitychange", reconcile);

    return () => {
      disposed = true;
      stopSeekFallback();
      clearInterval(reconcileTimer);
      clearTimeout(firstCheck);
      observer?.disconnect();
      video.removeEventListener("loadeddata", reconcile);
      video.removeEventListener("canplay", reconcile);
      video.removeEventListener("playing", reconcile);
      video.removeEventListener("pause", reconcile);
      document.removeEventListener("visibilitychange", reconcile);
      releaseAutoplayVideo(video);
      repaintEvents.forEach((event) => video.removeEventListener(event, repaint));
      window.removeEventListener("resize", repaint);
      window.removeEventListener("orientationchange", repaint);
    };
  }, []);

  return (
    <>
      <video
        className={`${block}__video`}
        src={src}
        poster={poster}
        ref={(node) => {
          videoRef.current = node;
          autoplayVideoRef(node);
        }}
        data-parallax={parallax}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <canvas className={`${block}__canvas`} ref={canvasRef} data-parallax={parallax} aria-hidden />
      {/* Both layers parallax: either one can be the visible one. */}
    </>
  );
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

// Memoized (like Clients and Contact below): it takes no props that ever change, so
// without this it would still re-render — and re-diff its whole subtree — every time
// setCursor fires from a hover anywhere else on the page, purely because it shares a
// parent with the cursor state. Cheap on its own, but it adds up across every component
// on the page doing the same thing on every single hover-in and hover-out.
export const Stats = memo(function Stats() {
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
});

// The strip advances sideways on its own, forever — the projects array is duplicated so
// the loop can wrap without ever running out of content, the same trick used by the
// Clients marquee. A drag (mouse press-and-hold, or a touch swipe) takes over the
// position directly and hands it back to autoplay on release, with a short glide instead
// of an abrupt stop. There is no scroll-jacking of any kind: the page always scrolls
// normally, and this section's own height is just whatever the panels need.
// A tap has moved less than this and still counts as a tap rather than a swipe. Must not
// exceed the track's own drag threshold (see Filmstrip below): if it did, a movement the
// carousel treats as a drag could also register here as a tap, growing a panel while the
// whole strip is being dragged past it.
const TAP_TOLERANCE_PX = 8;

function FilmstripPanel({
  project,
  setCursor,
  onActivate,
  onDeactivate
}: {
  project: Project;
  setCursor: (mode: CursorMode) => void;
  // Passes the panel's own shrink() up so the carousel can force it closed from outside —
  // specifically when a drag or an arrow-nav click starts, so someone who doesn't want to
  // watch a featured clip through can just move on instead of waiting for it to end. The
  // element is only passed on a touch tap (see grow() below) so the carousel can pull
  // that specific card to the middle of the screen — on mouse, hover already lands on
  // whatever's under the pointer, so there's nothing to re-center.
  onActivate: (cancel: () => void, centerOn?: HTMLElement | null) => void;
  onDeactivate: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameCallbackId = useRef<number | null>(null);
  const pendingSeekCleanup = useRef<(() => void) | null>(null);
  const [active, setActive] = useState(false);
  // Separate from `active`: on a slow connection, the tap/hover registers instantly but
  // the first real video frame can take a moment to arrive over the network. Driving the
  // glow/lift class off `active` directly meant it appeared the instant a tap landed,
  // with nothing but that glow's own colour showing through where the video should be —
  // a solid red card with no video in it. This only flips on once the video actually has
  // a frame ready to paint (see grow() below), so the glow only ever appears alongside
  // real content, never a beat ahead of an empty video element.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      pendingSeekCleanup.current?.();
      const video = videoRef.current;
      if (video && frameCallbackId.current !== null && typeof video.cancelVideoFrameCallback === "function") {
        video.cancelVideoFrameCallback(frameCallbackId.current);
      }
    };
  }, []);

  // Always restarts from the same point (project.previewStart, or the very top) rather
  // than resuming wherever it last paused — this is a "watch the clip" feature, not a
  // resume, and it's meant to play through to the end exactly once (see the ended
  // handler below) every time, not an arbitrary partial view depending on history.
  const grow = (center: boolean) => {
    setActive(true);
    setCursor("play");
    onActivate(shrink, center ? panelRef.current : null);
    const video = videoRef.current;
    if (!video) return;

    const startPlayback = () => {
      video.play().catch(() => {});
      // requestVideoFrameCallback fires once an actual decoded frame is about to be
      // painted — a stronger guarantee than the `playing` event, which on at least some
      // mobile browsers can fire a moment before anything is really on screen yet,
      // letting the glow show through empty video for that gap. Falls back to `playing`
      // (see the video element below) wherever this API isn't available.
      if (typeof video.requestVideoFrameCallback === "function") {
        frameCallbackId.current = video.requestVideoFrameCallback(() => {
          frameCallbackId.current = null;
          setVisible(true);
        });
      }
    };

    const startAt = project.previewStart ?? 0;
    // The >0.05s guard matters: setting currentTime to a value it's already at can skip
    // the seek algorithm entirely on some browsers, meaning `seeked` never fires — which
    // would otherwise leave this waiting forever instead of ever calling play().
    if (startAt > 0 && Math.abs(video.currentTime - startAt) > 0.05) {
      // Setting currentTime and calling play() in the same tick can race: some browsers
      // begin decoding from wherever the video already was — normally its very start —
      // before the seek this triggers has actually landed, showing a flash of whatever's
      // at time zero before jumping ahead to startAt. Waiting for `seeked` before calling
      // play() rules that out; shrink() cancels this listener if the panel closes first.
      const onSeeked = () => {
        pendingSeekCleanup.current = null;
        startPlayback();
      };
      pendingSeekCleanup.current = () => video.removeEventListener("seeked", onSeeked);
      video.addEventListener("seeked", onSeeked);
      video.currentTime = startAt;
    } else {
      video.currentTime = startAt;
      startPlayback();
    }
  };

  const shrink = () => {
    setActive(false);
    setVisible(false);
    setCursor("default");
    onDeactivate();
    pendingSeekCleanup.current?.();
    pendingSeekCleanup.current = null;
    const video = videoRef.current;
    if (video) {
      if (frameCallbackId.current !== null && typeof video.cancelVideoFrameCallback === "function") {
        video.cancelVideoFrameCallback(frameCallbackId.current);
      }
      frameCallbackId.current = null;
      video.pause();
    }
  };

  // The clip has no loop attribute (see below) specifically so this fires: reaching the
  // end is what hands the panel — and the carousel's autoplay, paused for as long as any
  // panel is featured — back to normal, without needing the pointer to move away first.
  // A video that has played keeps showing its final frame once paused — the poster only
  // ever displays before anything has loaded, and the browser never brings it back on its
  // own. Since this clip appears twice in the looping strip, that left the two copies of
  // the same video showing two different still images: whichever one someone had already
  // watched sat frozen on its last frame, the other still on the original poster. load()
  // resets the element back to that pre-load state, so the poster reliably returns.
  const onEnded = () => {
    shrink();
    videoRef.current?.load();
  };

  // Gated to a real mouse: a touchscreen fires this same enter/leave pair around a tap,
  // which would otherwise flash the panel active and then immediately shrink it back
  // before the tap handler below ever gets a say.
  //
  // A brief dwell before this actually takes effect. Autoplay keeps sliding panels past a
  // mouse that never moved a pixel, and — at least in Chrome — a browser does re-run
  // hover hit-testing when the content under a static pointer changes, not just when the
  // pointer itself moves. Near the edges of the strip, where panels are constantly
  // entering and leaving, that produced a burst of enter/leave pairs the mouse never
  // asked for, each one starting and immediately stopping a different panel's video.
  // Requiring the pointer to still be here a moment later is enough to tell "someone
  // paused on this" from "the strip moved under a parked cursor."
  const HOVER_DWELL_MS = 120;

  const onPointerEnter = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      hoverTimer.current = null;
      grow(false);
    }, HOVER_DWELL_MS);
  };

  const onPointerLeave = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    // Only ever cancels a hover that hasn't activated yet. Deliberately does NOT shrink()
    // an already-featured panel: a featured clip is meant to keep playing until it ends,
    // an arrow-nav click moves on, or the strip is dragged (see onEnded, and the
    // drag-cancel over in Filmstrip) — not the instant a mouse drifts off it, which
    // autoplay sliding the panel itself would trigger within a couple of seconds anyway.
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const onPointerDown = (event: React.PointerEvent) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };

  // Touch and pen: there is nowhere left to navigate to, so a genuine tap (not a swipe
  // that dragged the strip) toggles the video playing instead — the same feature a mouse
  // gets for free just by hovering. Also centers the card (grow(true)) — a mouse always
  // hovers whatever's already on screen, but a tapped card can be sitting half off one
  // edge of a phone screen, and there's no pointer position to "already be centered on"
  // the way there sort of is with a cursor.
  const onPointerUp = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse") return;
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_TOLERANCE_PX) return;
    if (active) shrink();
    else grow(true);
  };

  return (
    <div
      ref={panelRef}
      className={`filmstrip-panel${visible ? " filmstrip-panel--active" : ""}`}
      role="button"
      tabIndex={0}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* Clips the video to the rounded corners — kept off the outer element so its glow
          (an ::before on .filmstrip-panel) has room to bleed past those same corners
          instead of being clipped away along with everything else. */}
      {/* The poster doubles as the card's own background, not just the video's poster
          attribute. A video element only shows that attribute until something starts
          loading — from the first seek onward it paints nothing at all until a frame is
          decoded, which is the black gap between tapping and playback starting. Painting
          the same still behind the video means that gap shows the poster instead of an
          empty card, for a seek, a stall, or a slow connection alike. */}
      <div
        className="filmstrip-panel__inner"
        style={{ "--poster": `url(${posterSrc(project.video)})` } as CSSProperties}
      >
        {/* metadata, not none: lets the browser have duration/dimensions and often a
            little buffered data ready ahead of a tap, so play() has less to fetch before
            the first frame paints — without "auto"'s cost of pulling the whole clip for
            every rendered card before anyone asks for it. */}
        <video
          ref={videoRef}
          src={videoSrc(project.video)}
          poster={posterSrc(project.video)}
          muted
          playsInline
          preload="metadata"
          // Fallback for the rare browser without requestVideoFrameCallback (see grow()) —
          // harmless to also fire there, setVisible(true) twice is a no-op the second time.
          onPlaying={() => setVisible(true)}
          onEnded={onEnded}
        />
      </div>
    </div>
  );
}

// However many real cards fit end to end at this width, recycling (see the effect below)
// keeps the loop going forever without ever inventing content. But recycling only
// reorders whatever's already rendered — it can't make three cards span a screen wide
// enough for eight, and with too few, the strip runs out partway across, leaving bare
// background for the rest of the width. So the same handful of real projects gets
// rendered this many times over, just enough that a wide screen never runs dry; as more
// real projects are added, fewer repeats are needed until eventually none are.
const MIN_RENDERED_CARDS = 12;

function repeatToFillWidth(projects: Project[]) {
  if (projects.length === 0) return [];
  const copies = Math.max(1, Math.ceil(MIN_RENDERED_CARDS / projects.length));
  return Array.from({ length: copies }, (_, copy) =>
    projects.map((project) => ({ project, key: `${project.slug}-${copy}` }))
  ).flat();
}

export function Filmstrip({ projects, setCursor }: { projects: Project[]; setCursor: (mode: CursorMode) => void }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const renderedCards = repeatToFillWidth(projects);
  // Whichever panel is currently featured, so a drag-start or arrow-nav click (see the
  // effect below) can force it to close instead of leaving the carousel stuck until that
  // clip ends on its own — someone who decides mid-clip they'd rather move on can just
  // swipe past it, or click an arrow, instead of waiting.
  const activePanelCancel = useRef<(() => void) | null>(null);
  // Where to pull the strip while a touch-activated panel is featured — see the loop
  // effect below. Only ever set on touch: a mouse hover is already wherever the pointer
  // is, so re-centering it would just drag the card out from under the cursor (which is
  // exactly the desktop bug from the previous design of this feature). A tapped card has
  // no such pointer position to already be near, and can legitimately be sitting half off
  // one edge of a phone screen with nothing to bring it into view.
  const centerTargetOffset = useRef<number | null>(null);
  // Set by the effect below once it knows how to actually move the strip — the prev/next
  // buttons are rendered here in the component body, outside that effect's closure.
  const nudgeRef = useRef<((direction: 1 | -1) => void) | null>(null);

  const handleActivate = (cancel: () => void, centerOn?: HTMLElement | null) => {
    // Enforces one featured panel at a time: if a different one was already open — most
    // often on touch, where tapping a new panel has no "leave" event to close the last
    // one — this closes it first rather than letting two clips play at once.
    activePanelCancel.current?.();
    activePanelCancel.current = cancel;
    // Read once, not on every frame: the strip doesn't recycle cards while one is held
    // featured (see the loop below), so this card's position can't change for as long as
    // this value is going to be used.
    centerTargetOffset.current = centerOn ? centerOn.offsetLeft + centerOn.offsetWidth / 2 : null;
  };

  const handleDeactivate = () => {
    activePanelCancel.current = null;
    centerTargetOffset.current = null;
  };

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const calmer = window.matchMedia("(prefers-reduced-motion: reduce)");
    const AUTOPLAY_PX_PER_MS = 0.045;
    const DRAG_THRESHOLD_PX = 8;

    // The DOM order IS the loop: instead of duplicating the project list to fake an
    // endless strip, the real handful of cards gets physically recycled from whichever
    // end they scroll off of to the opposite end (see recycle() below) — infinite, with
    // no repeats in the markup, and it scales to however many real projects there are.
    let order = Array.from(track.children) as HTMLElement[];
    let stepWidth = 0;
    let centers: number[] = [];
    let lit = -1;
    let position = 0;
    let velocity = 0;
    let manualTarget: number | null = null;
    let dragging = false;
    let pointerId: number | null = null;
    let intentResolved = false;
    let horizontalIntent = false;
    let startX = 0;
    let startY = 0;
    let lastMoveTime = 0;
    let lastMoveX = 0;
    let lastFrameTime = 0;
    let onScreen = true;
    let raf = 0;

    // Read once on mount/resize/recycle rather than every frame: measuring an element's
    // box forces the browser to settle layout, and doing that 60 times a second for a
    // continuously running animation is exactly what makes a phone stutter. Every card is
    // the same fixed size (see .filmstrip-panel), so one measurement covers all of them.
    const measure = () => {
      centers = order.map((panel) => panel.offsetLeft + panel.offsetWidth / 2);
      const style = getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || "0") || 0;
      stepWidth = order[0] ? order[0].offsetWidth + gap : 0;
    };

    const apply = () => {
      track.style.transform = `translate3d(${position}px, 0, 0)`;
    };

    // Keeps position within a single card's width of zero — the moment it would drift
    // further, the card that just scrolled fully out of view is moved to the opposite end
    // of the DOM instead, and position is adjusted by exactly one step to compensate, so
    // nothing visibly jumps. Same handful of real elements, forever: recycling the actual
    // cards is what makes the loop endless without ever duplicating the project list. Any
    // in-flight nudge target is shifted along with position so it keeps meaning the same
    // physical spot after the reorder. centerTargetOffset gets the opposite adjustment:
    // it's a snapshot of some OTHER card's offsetLeft (see handleActivate), and every card
    // still in the DOM shifts by one step in the opposite direction of position whenever a
    // card ahead of or behind it gets recycled — without this, a touch-centered card more
    // than one step from center would drift off target the moment any card, anywhere in
    // the strip, gets recycled mid-ease.
    const recycle = () => {
      if (!stepWidth || order.length < 2) return;
      let moved = false;
      while (position <= -stepWidth) {
        const first = order.shift()!;
        order.push(first);
        track.appendChild(first);
        position += stepWidth;
        if (manualTarget !== null) manualTarget += stepWidth;
        if (centerTargetOffset.current !== null) centerTargetOffset.current -= stepWidth;
        moved = true;
      }
      while (position > 0) {
        const last = order.pop()!;
        order.unshift(last);
        track.prepend(last);
        position -= stepWidth;
        if (manualTarget !== null) manualTarget -= stepWidth;
        if (centerTargetOffset.current !== null) centerTargetOffset.current += stepWidth;
        moved = true;
      }
      if (moved) measure();
    };

    // With no hover on a touch screen, nothing would otherwise mark a "featured" panel
    // the way desktop's mouse hover does. This picks whichever panel is nearest the
    // middle of the screen as the strip drifts past, on every input type.
    const lightNearest = () => {
      if (!centers.length) return;
      const middle = window.innerWidth / 2 - position;
      let nearest = 0;
      let shortest = Infinity;
      centers.forEach((center, index) => {
        const gap = Math.abs(center - middle);
        if (gap < shortest) {
          shortest = gap;
          nearest = index;
        }
      });
      if (nearest === lit) return;
      order[lit]?.classList.remove("filmstrip-panel--lit");
      order[nearest]?.classList.add("filmstrip-panel--lit");
      lit = nearest;
    };

    // How much of the remaining gap to a target closes per ~frame — used for both easing
    // velocity toward its target (autoplay speed, or a stop) and easing position toward
    // an arrow-nav nudge. One continuous formula for every transition between drag,
    // coast, autoplay and nudging means none of them can ever meet as a visible snap.
    const easeFactor = (perFrameRate: number, dt: number) => 1 - Math.pow(perFrameRate, dt / 16.67);

    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      if (!onScreen) {
        lastFrameTime = time;
        return;
      }
      const dt = lastFrameTime ? time - lastFrameTime : 0;
      lastFrameTime = time;

      if (!dragging) {
        if (manualTarget !== null) {
          // An arrow-nav click is moving the strip by exactly one card. Capped regardless
          // of distance for the same reason autoplay's own speed is fixed: an
          // eased-toward-a-target move goes fastest exactly when it has the most ground
          // to cover, so an uncapped version would visibly rush before settling.
          const MAX_NUDGE_PX_PER_MS = 1.6;
          const step = (manualTarget - position) * easeFactor(0.86, dt);
          const cappedStep = Math.max(-MAX_NUDGE_PX_PER_MS * dt, Math.min(MAX_NUDGE_PX_PER_MS * dt, step));
          position += cappedStep;
          velocity = 0;
          if (Math.abs(manualTarget - position) < 0.5) {
            position = manualTarget;
            manualTarget = null;
          }
        } else if (activePanelCancel.current) {
          // A featured panel (hovered on desktop, tapped on mobile) holds the strip still
          // so its clip can be watched in full — see grow()/onEnded() on FilmstripPanel,
          // which is what clears activePanelCancel once that clip finishes.
          //
          // Touch only additionally pulls the card to the middle of the screen — set by
          // handleActivate above — so a card tapped near an edge doesn't sit half clipped
          // while its clip plays. Capped regardless of distance for the same reason the
          // arrow-nav nudge above is: an eased-toward-a-target move goes fastest exactly
          // when it has the most ground to cover, so an uncapped version would visibly
          // rush the strip before settling.
          if (centerTargetOffset.current !== null) {
            const target = window.innerWidth / 2 - centerTargetOffset.current;
            const MAX_CENTER_PX_PER_MS = 1.6;
            const step = (target - position) * easeFactor(0.86, dt);
            position += Math.max(-MAX_CENTER_PX_PER_MS * dt, Math.min(MAX_CENTER_PX_PER_MS * dt, step));
          }
        } else {
          // Autoplay's steady speed, or a stop when motion is reduced. Velocity eases
          // toward this target every frame — rather than decaying to zero and then
          // jumping straight to autoplay's fixed speed — so a released drag's own
          // momentum blends into autoplay (in whichever direction it was already
          // heading) instead of visibly snapping when the two meet.
          const targetVelocity = calmer.matches ? 0 : -AUTOPLAY_PX_PER_MS;
          velocity += (targetVelocity - velocity) * easeFactor(0.94, dt);
          position += velocity * dt;
        }
        recycle();
        apply();
      }
      lightNearest();
    };

    // Exposed to the prev/next buttons, which live outside this effect's closure. A click
    // is the same "move on" signal a drag is, so it closes whatever clip is playing too —
    // otherwise clicking next while one is featured would do nothing, since the strip is
    // deliberately held still for as long as activePanelCancel is set.
    const nudge = (direction: 1 | -1) => {
      activePanelCancel.current?.();
      if (!stepWidth) return;
      manualTarget = position - direction * stepWidth;
    };
    nudgeRef.current = nudge;

    measure();
    raf = requestAnimationFrame(loop);

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              onScreen = entries[entries.length - 1].isIntersecting;
            },
            { threshold: 0 }
          );
    observer?.observe(section);

    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== undefined && event.button !== 0) return;
      dragging = false;
      intentResolved = false;
      horizontalIntent = false;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      velocity = 0;
      lastMoveTime = performance.now();
      lastMoveX = event.clientX;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (!intentResolved) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) return;
        intentResolved = true;
        // Only a clearly horizontal swipe takes over — anything more vertical is left
        // alone so the page keeps scrolling normally, exactly as if this were plain text.
        horizontalIntent = Math.abs(dx) > Math.abs(dy);
        if (horizontalIntent) {
          dragging = true;
          track.setPointerCapture(pointerId);
          track.classList.add("filmstrip__track--dragging");
          // A real carousel drag is a clear "move on" signal — close whatever clip is
          // playing, and cancel any pending arrow-nudge, rather than leaving either stuck
          // mid-transition while the strip is now being moved by hand instead.
          activePanelCancel.current?.();
          manualTarget = null;
        }
      }

      if (!horizontalIntent) return;

      event.preventDefault();
      // Movement since the last event, not since the drag started: recycle() can rewrite
      // `position` mid-drag to compensate for a DOM reorder, and re-deriving it from a
      // fixed start point every move would silently undo that compensation on the very
      // next event — the strip would jump back by whatever the last recycle had adjusted.
      position += event.clientX - lastMoveX;
      // A drag can move several card-widths in one gesture, well past the single-step
      // window recycle() otherwise keeps position in — it has to run here too, not just
      // in the main loop, or dragging far enough would run past the last real card into
      // empty space with nothing left in the DOM to fill it.
      recycle();
      apply();
      lightNearest();

      const now = performance.now();
      const elapsed = now - lastMoveTime;
      // Two pointermove events can land on the same millisecond (common right at the
      // screen edges, where the browser's own back/forward-swipe gesture recognizer is
      // also racing to interpret the same touch) — dividing by a near-zero elapsed time
      // there produced velocities in the thousands, which is the strip "flying" that was
      // reported. A floor on elapsed and a hard cap on the result rule that out; a real
      // fast flick still reads as fast; a timing glitch no longer reads as a launch.
      const MAX_DRAG_VELOCITY_PX_PER_MS = 3;
      if (elapsed > 4) {
        const raw = (event.clientX - lastMoveX) / elapsed;
        velocity = Math.max(-MAX_DRAG_VELOCITY_PX_PER_MS, Math.min(MAX_DRAG_VELOCITY_PX_PER_MS, raw));
      }
      lastMoveTime = now;
      lastMoveX = event.clientX;
    };

    const endDrag = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      if (dragging) track.classList.remove("filmstrip__track--dragging");
      dragging = false;
      pointerId = null;
    };

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", endDrag);
      track.removeEventListener("pointercancel", endDrag);
      nudgeRef.current = null;
    };
  }, [projects]);

  return (
    <div className="filmstrip" ref={sectionRef}>
      <button
        type="button"
        className="filmstrip-nav filmstrip-nav--prev"
        aria-label="Vídeo anterior"
        onClick={() => nudgeRef.current?.(-1)}
      >
        <FiChevronLeft />
      </button>
      <div className="filmstrip__track" ref={trackRef}>
        {renderedCards.map(({ project, key }) => (
          <FilmstripPanel
            key={key}
            project={project}
            setCursor={setCursor}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
          />
        ))}
      </div>
      <button
        type="button"
        className="filmstrip-nav filmstrip-nav--next"
        aria-label="Próximo vídeo"
        onClick={() => nudgeRef.current?.(1)}
      >
        <FiChevronRight />
      </button>
    </div>
  );
}

type Brand = { name: string; src: string };

const LOGOS_BASE_URL = "https://pub-3e9f9cb57ae84ac58d16106bb6690f67.r2.dev";

const brands: Brand[] = [
  { name: "Red Bull", src: `${LOGOS_BASE_URL}/red-bull.png` },
  { name: "Gillette", src: `${LOGOS_BASE_URL}/gillette.png` },
  { name: "30 Praum", src: `${LOGOS_BASE_URL}/30-praum.png` },
  { name: "Supernova", src: `${LOGOS_BASE_URL}/supernova.png` },
  { name: "Illusionize", src: `${LOGOS_BASE_URL}/illusionize.png` },
  { name: "Beira Alta Cosméticos", src: `${LOGOS_BASE_URL}/beira-alta-cosmeticos.png` },
  { name: "Proper Jack", src: `${LOGOS_BASE_URL}/proper-jack.png` },
  { name: "Afiliados Brasil", src: `${LOGOS_BASE_URL}/afiliados-brasil.png` },
  { name: "iHub Afiliates", src: `${LOGOS_BASE_URL}/ihub-afiliates.png` }
];

// Falls back to the brand name as text if a logo ever 404s, so the row still
// looks intentional instead of showing a broken-image icon.
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

  // Not lazy: this row sits right below the hero and is animating from the moment the
  // page loads, so deferring the fetch only risked a blank flash mid-scroll — the logos
  // are tiny (under 60KB each) and there's no real bandwidth saving worth that trade.
  return <img ref={imgRef} src={src} alt={name} draggable={false} onError={() => setBroken(true)} />;
}

// Looped twice so the CSS scroll animation can wrap seamlessly at -50%,
// same trick as Filmstrip — reads as an endless row even with few logos.
// Memoized: no props ever change, so without this it would still re-render on every
// setCursor call from anywhere on the page — see the note on Stats above.
export const Clients = memo(function Clients() {
  const loopBrands = [...brands, ...brands];

  return (
    <section className="clients" aria-label="Marcas que ja confiaram no trabalho">
      {/* No scroll-linked wrapper here on purpose: reacting to scroll meant updating this
          element's transform from JS on every scroll frame, competing with — and, on a
          loaded page, sometimes starving — the marquee's own independent CSS animation
          on .clients__track below. A row that's supposed to never stop moving takes
          priority over the lean effect other elements get. */}
      <div className="clients__track">
        {loopBrands.map((brand, index) => (
          <ClientLogo key={`${brand.name}-${index}`} {...brand} />
        ))}
      </div>
    </section>
  );
});

// Contact identity for the studio's direct line, in one place — update here if the
// person, number, or handle behind the site ever changes.
export const CONTACT = {
  name: "Murilo Gonçalves",
  whatsappNumber: "5513997989477",
  whatsappLabel: "(13) 99798-9477",
  instagramHandle: "murilofilmsbr"
};

// Memoized: setCursor is the stable function useState always returns, so this only ever
// needs to re-render for its own reasons — not on every setCursor call elsewhere on the
// page, which is what happens without this (see the note on Stats above).
export const Contact = memo(function Contact({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  const links = [
    {
      key: "whatsapp",
      label: CONTACT.whatsappLabel,
      href: `https://wa.me/${CONTACT.whatsappNumber}`,
      icon: <FaWhatsapp />
    },
    {
      key: "instagram",
      label: `@${CONTACT.instagramHandle}`,
      href: `https://instagram.com/${CONTACT.instagramHandle}`,
      icon: <FaInstagram />
    }
  ];

  return (
    <footer className="contact">
      <div>
        <p className="kicker">Contato direto</p>
        <h2 className="reveal">
          <SplitText>Vamos criar algo que fique.</SplitText>
        </h2>
      </div>
      <nav aria-label="Links de contato">
        {links.map((link) => (
          <Magnetic key={link.key}>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              onMouseEnter={() => setCursor("link")}
              onMouseLeave={() => setCursor("default")}
            >
              <Scramble>{link.label}</Scramble>
              {link.icon}
            </a>
          </Magnetic>
        ))}
      </nav>
    </footer>
  );
});
