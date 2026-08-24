"use client";

import gsap from "gsap";
import { useEffect, useState } from "react";
import { posterSrc, videoSrc, type Project } from "@/lib/works";
import {
  autoplayVideoRef,
  Contact,
  Cursor,
  CursorMode,
  lazyAutoplayVideoRef,
  SiteHeader,
  SplitText,
  useCinematicScroll,
  useParallax,
  useTextReveal
} from "@/components/SiteChrome";

function ProjectHero({ project }: { project: Project }) {
  return (
    <section className="project-hero">
      <video
        className="project-hero__video"
        src={videoSrc(project.video)}
        poster={posterSrc(project.video)}
        ref={autoplayVideoRef}
        data-parallax="25"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className="grain" />
      <div className="project-hero__copy">
        <p className="kicker">
          {project.category} · {project.year}
        </p>
        <h1 className="reveal">
          <SplitText>{project.title}</SplitText>
        </h1>
      </div>
      <span className="scroll-cue">Role</span>
    </section>
  );
}

function ProjectAbout({ project }: { project: Project }) {
  return (
    <section className="project-about">
      <div className="section-heading">
        <p className="kicker">Sobre</p>
        <h2 className="reveal">
          <SplitText>O projeto</SplitText>
        </h2>
      </div>
      <p className="project-about__text">{project.about}</p>
    </section>
  );
}

function ProjectVideos({ project, setCursor }: { project: Project; setCursor: (mode: CursorMode) => void }) {
  return (
    <section className="project-videos">
      <div className="section-heading">
        <p className="kicker">Vídeos</p>
        <h2 className="reveal">
          <SplitText>Material em movimento</SplitText>
        </h2>
      </div>
      <div className="video-grid">
        {project.videos.map((video, index) => (
          <div
            className="video-tile"
            key={video}
            onMouseEnter={() => setCursor("play")}
            onMouseLeave={() => setCursor("default")}
          >
            <video
              src={videoSrc(video)}
              poster={posterSrc(video)}
              ref={lazyAutoplayVideoRef}
              muted
              loop
              playsInline
              preload="none"
            />
            <span className="video-tile__index">{String(index + 1).padStart(2, "0")}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ProjectView({ project }: { project: Project }) {
  const [cursor, setCursor] = useState<CursorMode>("default");

  useCinematicScroll();
  useTextReveal();
  useParallax();

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(
        ".project-about, .video-tile, .contact",
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.06,
          scrollTrigger: {
            trigger: ".project-about",
            start: "top 80%"
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
      <ProjectHero project={project} />
      <ProjectAbout project={project} />
      <ProjectVideos project={project} setCursor={setCursor} />
      <Contact setCursor={setCursor} />
    </main>
  );
}
