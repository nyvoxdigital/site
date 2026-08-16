export type Project = {
  slug: string;
  title: string;
  category: string;
  year: string;
  video: string;
  about: string;
  photos: string[];
  videos: string[];
};

export const projects: Project[] = [
  {
    slug: "lagoinha-praia-grande",
    title: "Lagoinha Praia Grande",
    category: "Hero film",
    year: "2026",
    video: "/videos/lagoinha-praia-grande-hero-web.mp4",
    about:
      "Filme de abertura gravado na Lagoinha, em Praia Grande, para apresentar a nova identidade audiovisual da marca. A direção buscou um olhar cru e atmosférico, com câmera na mão e luz natural, para transmitir a sensação real do lugar antes de qualquer edição.",
    photos: [],
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
    photos: [],
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
    photos: [],
    videos: ["/videos/alecgol-gillette-2-web.mp4"]
  }
];

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}
