export type Project = {
  title: string;
  category: string;
  year: string;
  image: string;
  video: string;
};

export type GalleryItem = {
  title: string;
  kind: "image" | "video";
  src: string;
};

export const projects: Project[] = [
  {
    title: "Silent Signal",
    category: "Interactive film",
    year: "2026",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80",
    video: "/videos/feature-silent-signal.mp4"
  },
  {
    title: "Nocturne Index",
    category: "Editorial system",
    year: "2025",
    image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=80",
    video: "/videos/feature-nocturne-index.mp4"
  },
  {
    title: "Afterimage",
    category: "Museum identity",
    year: "2026",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=80",
    video: "/videos/feature-afterimage.mp4"
  },
  {
    title: "Field Theory",
    category: "Spatial commerce",
    year: "2024",
    image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1800&q=80",
    video: "/videos/hero.mp4"
  },
  {
    title: "Cold Bloom",
    category: "Motion language",
    year: "2025",
    image: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=80",
    video: "/videos/gallery-material.mp4"
  }
];

export const gallery: GalleryItem[] = [
  {
    title: "Light Study",
    kind: "image",
    src: "https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Material",
    kind: "video",
    src: "/videos/gallery-material.mp4"
  },
  {
    title: "Passage",
    kind: "image",
    src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80"
  },
  {
    title: "Signal",
    kind: "image",
    src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Drift",
    kind: "video",
    src: "/videos/gallery-drift.mp4"
  },
  {
    title: "Frame",
    kind: "image",
    src: "https://images.unsplash.com/photo-1484950763426-56b5bf172dbb?auto=format&fit=crop&w=1400&q=80"
  },
  {
    title: "Texture",
    kind: "image",
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Breath",
    kind: "video",
    src: "/videos/gallery-breath.mp4"
  }
];
