export type Project = {
  slug: string;
  title: string;
  category: string;
  year: string;
  video: string;
  about: string;
  videos: string[];
  // Where the carousel preview starts playing from, in seconds — defaults to the very
  // start. For a clip that opens on something that doesn't sell the work at a glance
  // (an interview intro, a title card), skipping ahead to where the actual footage
  // begins makes for a better few seconds than the raw edit's own opening does.
  previewStart?: number;
};

export function posterFor(video: string) {
  return video.replace(/-web\.mp4$/, "-poster.jpg");
}

export const projects: Project[] = [
  {
    slug: "veigh",
    title: "Veigh",
    category: "Music video",
    year: "2026",
    video: "/videos/veigh-web.mp4",
    about: "Peça audiovisual em parceria com @murilofilmsbr.",
    videos: ["/videos/veigh-web.mp4"]
  },
  {
    slug: "yan",
    title: "Yan",
    category: "Vídeo",
    year: "2026",
    video: "/videos/yan-web.mp4",
    about: "Edição completa em parceria com @murilofilmsbr.",
    videos: ["/videos/yan-web.mp4"],
    // The first ~15s cut rapidly between action, an interview, and trophy cutaways —
    // those trophies happen to be bright red, and cropped into the carousel's narrow
    // portrait card they read as a near-solid red block passing by. 24s is well clear of
    // that, and its frame is sharp rather than mid-motion-blur — the poster is taken from
    // this exact timestamp, so the still and the first played frame are the same image and
    // the handoff between them is invisible.
    previewStart: 24
  },
  {
    slug: "soul-fest",
    title: "Soul Fest",
    category: "Event film",
    year: "2026",
    video: "/videos/soul-fest-web.mp4",
    about: "Cobertura do Soul Fest em parceria com @murilofilmsbr.",
    videos: ["/videos/soul-fest-web.mp4"]
  }
];

const R2_BASE_URL = "https://pub-3e9f9cb57ae84ac58d16106bb6690f67.r2.dev";

// Placeholder while real per-project footage gets uploaded to R2 one by
// one — every project video currently points at this same clip. The home
// page's hero video is hardcoded separately in page.tsx and never goes
// through this map, so it's unaffected.
const PLACEHOLDER_VIDEO = "Alecgol - Gillette 2.mp4";

// Real footage that's been compressed and uploaded to R2 — add an entry here as each
// project's real clip goes live, and it takes over from the shared placeholder above.
const REAL_FOOTAGE: Record<string, string> = {
  "/videos/veigh-web.mp4": "veigh-web.mp4",
  "/videos/yan-web.mp4": "yan-web.mp4",
  "/videos/soul-fest-web.mp4": "soul-fest-web.mp4"
};

// Everything else still points at the shared placeholder clip, so listing every project
// would mean the same clip playing over and over next to the handful with real footage.
// Only the ones with a real clip go on display until the rest catch up.
export function hasRealFootage(project: Project) {
  return project.video in REAL_FOOTAGE;
}

// A still frame pulled from each real clip itself, so the poster matches what's about to
// play. Projects without an entry here fall back to the placeholder poster below.
const REAL_POSTERS: Record<string, string> = {
  "/videos/veigh-web.mp4": "/videos/veigh-poster.jpg",
  "/videos/yan-web.mp4": "/videos/yan-poster.jpg",
  "/videos/soul-fest-web.mp4": "/videos/soul-fest-poster.jpg"
};

const r2Overrides: Record<string, string> = Object.fromEntries(
  projects
    .flatMap((project) => [project.video, ...project.videos])
    .map((path) => [path, REAL_FOOTAGE[path] ?? PLACEHOLDER_VIDEO])
);

export function videoSrc(video: string) {
  const filename = r2Overrides[video];
  return filename ? `${R2_BASE_URL}/${encodeURIComponent(filename)}` : video;
}

// A frame pulled from the placeholder clip itself, so the poster always
// matches whatever's about to play — swap per-project once real footage
// replaces the placeholder in r2Overrides above.
const PLACEHOLDER_POSTER = "/videos/placeholder-poster.jpg";

export function posterSrc(video: string) {
  return REAL_POSTERS[video] ?? (r2Overrides[video] ? PLACEHOLDER_POSTER : posterFor(video));
}

