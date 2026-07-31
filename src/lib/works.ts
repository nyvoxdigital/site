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
    video: "https://videos.pexels.com/video-files/853889/853889-hd_1920_1080_25fps.mp4"
  },
  {
    title: "Nocturne Index",
    category: "Editorial system",
    year: "2025",
    image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=80",
    video: "https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_30fps.mp4"
  },
  {
    title: "Afterimage",
    category: "Museum identity",
    year: "2026",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=80",
    video: "https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4"
  },
  {
    title: "Field Theory",
    category: "Spatial commerce",
    year: "2024",
    image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1800&q=80",
    video: "https://videos.pexels.com/video-files/3130182/3130182-hd_1920_1080_30fps.mp4"
  },
  {
    title: "Cold Bloom",
    category: "Motion language",
    year: "2025",
    image: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=80",
    video: "https://videos.pexels.com/video-files/2040063/2040063-hd_1920_1080_24fps.mp4"
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
    src: "https://videos.pexels.com/video-files/4008530/4008530-hd_1920_1080_25fps.mp4"
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
    src: "https://videos.pexels.com/video-files/3141208/3141208-hd_1920_1080_25fps.mp4"
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
    src: "https://videos.pexels.com/video-files/854095/854095-hd_1920_1080_25fps.mp4"
  }
];
