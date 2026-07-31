"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { AnimatePresence, motion } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import SplitType from "split-type";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowUpRight, FiMail } from "react-icons/fi";
import type { Mesh } from "three";
import { gallery, projects } from "@/lib/works";

gsap.registerPlugin(ScrollTrigger);

type CursorMode = "default" | "open" | "play" | "link";

function useCinematicScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.35,
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 0.86
    });

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };

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
  const label = mode === "open" ? "OPEN" : mode === "play" ? "PLAY" : "";

  useEffect(() => {
    const cursor = dot.current;
    if (!cursor) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    const move = (event: PointerEvent) => {
      tx = event.clientX;
      ty = event.clientY;
    };

    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", move);
    tick();

    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div ref={dot} className={`cursor cursor--${mode}`} aria-hidden="true">
      <span>{label}</span>
    </div>
  );
}

function Hero() {
  const wrap = useRef<HTMLElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!wrap.current || !headline.current) return;
    const split = new SplitType(headline.current, { types: "chars,words" });

    gsap.set(split.chars, { transformOrigin: "50% 55%" });
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: wrap.current,
        start: "top top",
        end: "bottom top",
        scrub: 1.15
      }
    });

    timeline
      .to(split.chars, {
        x: () => gsap.utils.random(-160, 160),
        y: () => gsap.utils.random(-120, 80),
        rotationZ: () => gsap.utils.random(-18, 18),
        opacity: 0,
        filter: "blur(12px)",
        stagger: { amount: 0.8, from: "random" }
      })
      .to(".hero__video", { scale: 1.18, filter: "brightness(0.26)" }, 0);

    return () => {
      timeline.kill();
      split.revert();
    };
  }, []);

  const bind = useGesture({
    onMove: ({ xy: [x, y] }) => {
      const nx = (x / window.innerWidth - 0.5) * 2;
      const ny = (y / window.innerHeight - 0.5) * 2;
      setTilt({ x: nx, y: ny });
    }
  });

  return (
    <section ref={wrap} className="hero scene" {...bind()}>
      <video
        className="hero__video"
        src="https://videos.pexels.com/video-files/6963744/6963744-uhd_2560_1440_25fps.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="grain" />
      <div
        className="hero__copy"
        style={{
          transform: `translate3d(${tilt.x * -16}px, ${tilt.y * -12}px, 0)`
        }}
      >
        <p className="kicker">Scene 01 / private exhibition</p>
        <h1 ref={headline}>
          CREATE
          <br />
          EXPERIENCES
          <br />
          NOT WEBSITES.
        </h1>
      </div>
      <span className="scroll-cue">Scroll</span>
    </section>
  );
}

function FeaturedProjects({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  return (
    <section className="feature-strip scene">
      {projects.slice(0, 3).map((project, index) => (
        <article
          className="feature"
          key={project.title}
          onMouseEnter={(event) => {
            setCursor("play");
            event.currentTarget.querySelector("video")?.play();
          }}
          onMouseLeave={(event) => {
            setCursor("default");
            event.currentTarget.querySelector("video")?.pause();
          }}
        >
          <video src={project.video} muted loop playsInline preload="metadata" />
          <div className="feature__meta">
            <span>{String(index + 2).padStart(2, "0")}</span>
            <span>{project.category}</span>
            <span>{project.year}</span>
          </div>
          <h2>{project.title}</h2>
        </article>
      ))}
    </section>
  );
}

function HorizontalStory({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!section.current || !track.current) return;
    const tween = gsap.to(track.current, {
      x: () => -(track.current!.scrollWidth - window.innerWidth + 96),
      ease: "none",
      scrollTrigger: {
        trigger: section.current,
        start: "top top",
        end: () => `+=${track.current!.scrollWidth}`,
        scrub: 1,
        pin: true,
        invalidateOnRefresh: true
      }
    });

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <section ref={section} className="horizontal scene">
      <div ref={track} className="horizontal__track">
        {projects.map((project, index) => (
          <article
            className={`h-card h-card--${index % 3}`}
            key={`${project.title}-horizontal`}
            onMouseEnter={() => setCursor("open")}
            onMouseLeave={() => setCursor("default")}
          >
            <img src={project.image} alt="" loading="lazy" />
            <div>
              <p>
                {project.category} / {project.year}
              </p>
              <h3>{project.title}</h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Gallery({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  const [active, setActive] = useState<(typeof gallery)[number] | null>(null);

  return (
    <section className="gallery scene">
      <div className="gallery__intro">
        <p className="kicker">Scene 05 / infinite wall</p>
        <h2>Fragments from the archive keep rearranging themselves.</h2>
      </div>
      <div className="gallery__wall">
        {gallery.map((item, index) => (
          <button
            className={`gallery__item gallery__item--${index % 6}`}
            key={item.src}
            onClick={() => setActive(item)}
            onMouseEnter={() => setCursor("open")}
            onMouseLeave={() => setCursor("default")}
            aria-label={`Open ${item.title}`}
          >
            {item.kind === "video" ? (
              <video src={item.src} muted loop playsInline preload="metadata" />
            ) : (
              <img src={item.src} alt="" loading="lazy" />
            )}
            <span>{item.title}</span>
          </button>
        ))}
      </div>
      <AnimatePresence>
        {active && (
          <motion.div
            className="viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div
              className="viewer__media"
              initial={{ scale: 0.94, filter: "blur(14px)" }}
              animate={{ scale: 1, filter: "blur(0px)" }}
              exit={{ scale: 0.96, filter: "blur(10px)" }}
            >
              {active.kind === "video" ? (
                <video src={active.src} autoPlay muted loop playsInline />
              ) : (
                <img src={active.src} alt="" />
              )}
            </motion.div>
            <button type="button">Close</button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function FloatingFrame({
  position,
  color,
  speed
}: {
  position: [number, number, number];
  color: string;
  speed: number;
}) {
  const mesh = useRef<Mesh>(null);

  useFrame(({ clock, pointer }) => {
    if (!mesh.current) return;
    const time = clock.getElapsedTime();
    mesh.current.rotation.x = Math.sin(time * speed) * 0.12 + pointer.y * 0.08;
    mesh.current.rotation.y = Math.cos(time * speed * 0.8) * 0.16 + pointer.x * 0.12;
    mesh.current.position.z = position[2] + Math.sin(time * speed + position[0]) * 0.24;
  });

  return (
    <mesh ref={mesh} position={position}>
      <boxGeometry args={[2.1, 1.28, 0.035]} />
      <meshStandardMaterial color={color} roughness={0.42} metalness={0.18} />
    </mesh>
  );
}

function DepthShowcase() {
  const frames = useMemo(
    () => [
      { position: [-2.5, 1.1, -1.2] as [number, number, number], color: "#d8d5cb", speed: 0.6 },
      { position: [0.25, -0.2, -0.45] as [number, number, number], color: "#373737", speed: 0.8 },
      { position: [2.65, 0.85, -1.05] as [number, number, number], color: "#a04736", speed: 0.5 },
      { position: [-0.9, -1.45, -1.7] as [number, number, number], color: "#6d746b", speed: 0.7 }
    ],
    []
  );

  return (
    <section className="depth scene">
      <Canvas camera={{ position: [0, 0, 5.1], fov: 42 }} dpr={[1, 1.6]}>
        <color attach="background" args={["#050505"]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 4, 4]} intensity={1.65} />
        {frames.map((frame) => (
          <FloatingFrame key={frame.color} {...frame} />
        ))}
      </Canvas>
      <div className="depth__copy">
        <p className="kicker">Scene 06 / depth study</p>
        <h2>Projects suspended in a quiet field of perspective.</h2>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section className="manifesto scene">
      <video
        src="https://videos.pexels.com/video-files/853919/853919-hd_1920_1080_25fps.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div>
        <p className="kicker">Scene 07 / manifesto</p>
        <h2>
          WE BUILD
          <br />
          MEMORABLE
          <br />
          DIGITAL STORIES.
        </h2>
      </div>
    </section>
  );
}

function Contact({ setCursor }: { setCursor: (mode: CursorMode) => void }) {
  return (
    <footer className="contact scene">
      <p className="kicker">Final scene</p>
      <h2>
        Let&apos;s create
        <br />
        something
        <br />
        remarkable.
      </h2>
      <nav aria-label="Contact links">
        {["hello@notwebsites.studio", "Instagram", "Vimeo"].map((item) => (
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
      gsap.utils.toArray<HTMLElement>(".scene").forEach((scene) => {
        gsap.fromTo(
          scene,
          { opacity: 0.68, filter: "blur(10px)" },
          {
            opacity: 1,
            filter: "blur(0px)",
            scrollTrigger: {
              trigger: scene,
              start: "top 86%",
              end: "top 35%",
              scrub: true
            }
          }
        );
      });
    });

    return () => context.revert();
  }, []);

  return (
    <main>
      <Cursor mode={cursor} />
      <Hero />
      <section className="interlude scene">
        <p className="kicker">Scene 02 / transition</p>
        <h2>Letters fall away. The room opens. The work begins to breathe.</h2>
      </section>
      <FeaturedProjects setCursor={setCursor} />
      <HorizontalStory setCursor={setCursor} />
      <Gallery setCursor={setCursor} />
      <DepthShowcase />
      <Manifesto />
      <Contact setCursor={setCursor} />
    </main>
  );
}
