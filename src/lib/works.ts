export type Project = {
  slug: string;
  title: string;
  category: string;
  year: string;
  video: string;
  about: string;
  videos: string[];
};

export function posterFor(video: string) {
  return video.replace(/-web\.mp4$/, "-poster.jpg");
}

export const projects: Project[] = [
  {
    slug: "lagoinha-praia-grande",
    title: "Lagoinha Praia Grande",
    category: "Hero film",
    year: "2026",
    video: "/videos/lagoinha-praia-grande-hero-web.mp4",
    about:
      "Filme de abertura gravado na Lagoinha, em Praia Grande, para apresentar a nova identidade audiovisual da marca. A direção buscou um olhar cru e atmosférico, com câmera na mão e luz natural, para transmitir a sensação real do lugar antes de qualquer edição.",
    videos: ["/videos/lagoinha-praia-grande-hero-web.mp4"]
  },
  {
    slug: "emily-andrade",
    title: "Emily Andrade",
    category: "Realtime campaign",
    year: "2025",
    video: "/videos/realtime-emily-andrade-mugo-games-web.mp4",
    about:
      "Cobertura em tempo real do dia a dia de treino da Emily Andrade para a Mugo Games. Conteúdo captado e entregue no mesmo dia, priorizando ritmo e autenticidade para acompanhar o calendário da campanha.",
    videos: ["/videos/realtime-emily-andrade-mugo-games-web.mp4"]
  },
  {
    slug: "alecgol-gillette",
    title: "Alecgol Gillette",
    category: "Commercial film",
    year: "2026",
    video: "/videos/alecgol-gillette-2-web.mp4",
    about:
      "Filme comercial para a Gillette em parceria com o Alecgol, construído em torno de uma narrativa simples e direta. Fotografia limpa e edição enxuta para reforçar a mensagem da marca sem distrair do protagonista.",
    videos: ["/videos/alecgol-gillette-2-web.mp4"]
  },
  {
    slug: "churrasco-com-buzeira",
    title: "Churrasco com Buzeira",
    category: "Realtime campaign",
    year: "2026",
    video: "/videos/churrasco-com-buzeira-web.mp4",
    about:
      "Cobertura em tempo real de um churrasco com conteúdo de bastidor, feita para acompanhar o ritmo do evento e ser publicada no mesmo dia.",
    videos: ["/videos/churrasco-com-buzeira-web.mp4"]
  },
  {
    slug: "day1-ihub",
    title: "Day 1 iHub",
    category: "Commercial film",
    year: "2026",
    video: "/videos/day1-ihub-web.mp4",
    about:
      "Registro do primeiro dia de um evento do iHub, com captação dinâmica para transmitir a energia do espaço e das pessoas presentes.",
    videos: ["/videos/day1-ihub-web.mp4"]
  },
  {
    slug: "excess-moby",
    title: "Excess Moby",
    category: "Realtime campaign",
    year: "2026",
    video: "/videos/excess-moby-web.mp4",
    about:
      "Conteúdo em tempo real gravado à beira-mar, acompanhando a ação das ondas com um olhar solto e imediato.",
    videos: ["/videos/excess-moby-web.mp4"]
  },
  {
    slug: "fashion-film",
    title: "Fashion Film",
    category: "Fashion film",
    year: "2026",
    video: "/videos/fashion-film-web.mp4",
    about:
      "Filme de moda com direção de fotografia cuidadosa, priorizando movimento e textura para valorizar as peças.",
    videos: ["/videos/fashion-film-web.mp4"]
  },
  {
    slug: "formatura-arq-urb",
    title: "Formatura ARQ & URB",
    category: "Event film",
    year: "2026",
    video: "/videos/formatura-arq-urb-web.mp4",
    about:
      "Cobertura da formatura da turma de Arquitetura e Urbanismo, registrando os principais momentos da cerimônia para a MR Formaturas.",
    videos: ["/videos/formatura-arq-urb-web.mp4"]
  },
  {
    slug: "goma-bbq",
    title: "Goma BBQ",
    category: "Realtime campaign",
    year: "2026",
    video: "/videos/goma-bbq-web.mp4",
    about:
      "Conteúdo em tempo real do dia a dia da Goma BBQ, com foco no preparo e no ambiente do estabelecimento.",
    videos: ["/videos/goma-bbq-web.mp4"]
  },
  {
    slug: "mobydicksantos-wave",
    title: "Moby Dick Santos",
    category: "Realtime campaign",
    year: "2026",
    video: "/videos/mobydicksantos-wave-web.mp4",
    about:
      "Registro em tempo real de um dia de ondas em Santos, acompanhando o movimento da água e dos surfistas.",
    videos: ["/videos/mobydicksantos-wave-web.mp4"]
  },
  {
    slug: "pre-wedding-casamento",
    title: "Pré Wedding",
    category: "Wedding film",
    year: "2026",
    video: "/videos/pre-wedding-casamento-web.mp4",
    about:
      "Ensaio pré-wedding gravado em alta taxa de quadros para valorizar os detalhes e a emoção do casal antes do grande dia.",
    videos: ["/videos/pre-wedding-casamento-web.mp4"]
  },
  {
    slug: "realtime-feminino-amador-mugo-games",
    title: "Feminino Amador Mugo Games",
    category: "Realtime campaign",
    year: "2026",
    video: "/videos/realtime-feminino-amador-mugo-games-web.mp4",
    about:
      "Cobertura em tempo real da categoria feminino amador do Mugo Games, com entrega rápida para acompanhar o calendário da competição.",
    videos: ["/videos/realtime-feminino-amador-mugo-games-web.mp4"]
  },
  {
    slug: "starterpack",
    title: "Starterpack",
    category: "Realtime campaign",
    year: "2026",
    video: "/videos/starterpack-web.mp4",
    about:
      "Conteúdo em formato starterpack, feito para redes sociais em parceria com @murilofilmsbr.",
    videos: ["/videos/starterpack-web.mp4"]
  },
  {
    slug: "veigh",
    title: "Veigh",
    category: "Music video",
    year: "2026",
    video: "/videos/veigh-web.mp4",
    about:
      "Peça audiovisual em parceria com @murilofilmsbr, com direção de fotografia autoral e edição dinâmica.",
    videos: ["/videos/veigh-web.mp4"]
  },
  {
    slug: "veigh-2",
    title: "Veigh",
    category: "Music video",
    year: "2026",
    video: "/videos/veigh-2-web.mp4",
    about: "Peça audiovisual em parceria com @murilofilmsbr.",
    videos: ["/videos/veigh-2-web.mp4"]
  },
  {
    slug: "yan",
    title: "Yan",
    category: "Vídeo",
    year: "2026",
    video: "/videos/yan-web.mp4",
    about: "Edição completa em parceria com @murilofilmsbr.",
    videos: ["/videos/yan-web.mp4"]
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
  "/videos/veigh-2-web.mp4": "veigh-web.mp4",
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
  "/videos/veigh-2-web.mp4": "/videos/veigh-poster.jpg",
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

