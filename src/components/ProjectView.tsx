"use client";

import gsap from "gsap";
import { useEffect, useState } from "react";
import { posterFor, type Project } from "@/lib/works";
import {
  autoplayVideoRef,
  Contact,
  Cursor,
  CursorMode,
  lazyAutoplayVideoRef,
  SiteHeader,
  useCinematicScroll
} from "@/components/SiteChrome";

function ProjectHero({ project }: { project: Project }) {
  return (
    <section className="project-hero">
      <video
        className="project-hero__video"
        src={project.video}
        poster={posterFor(project.video)}
        ref={autoplayVideoRef}
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
        <h1>{project.title}</h1>
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
        <h2>O projeto</h2>
      </div>
      <p className="project-about__text">{project.about}</p>
    </section>
  );
}

function ProjectPhotos({ project, setCursor }: { project: Project; setCursor: (mode: CursorMode) => void }) {
  const placeholders = project.photos.length > 0 ? project.photos : Array.from({ length: 4 });

  return (
    <section className="project-photos">
      <div className="section-heading">
        <p className="kicker">Fotos</p>
        <h2>Registros do projeto</h2>
      </div>
      <div className="photo-grid">
        {placeholders.map((photo, index) =>
          typeof photo === "string" ? (
            <figure
              className="photo-tile"
              key={photo}
              onMouseEnter={() => setCursor("play")}
              onMouseLeave={() => setCursor("default")}
            >
              <img src={photo} alt={`${project.title} — foto ${index + 1}`} loading="lazy" />
            </figure>
          ) : (
            <figure className="photo-tile photo-tile--empty" key={index}>
              <span>Foto em breve</span>
            </figure>
          )
        )}
      </div>
    </section>
  );
}

function ProjectVideos({ project, setCursor }: { project: Project; setCursor: (mode: CursorMode) => void }) {
  return (
    <section className="project-videos">
      <div className="section-heading">
        <p className="kicker">Vídeos</p>
        <h2>Material em movimento</h2>
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
              src={video}
              poster={posterFor(video)}
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

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(
        ".project-about, .photo-tile, .video-tile, .contact",
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
      <ProjectPhotos project={project} setCursor={setCursor} />
      <ProjectVideos project={project} setCursor={setCursor} />
      <Contact setCursor={setCursor} />
    </main>
  );
}
