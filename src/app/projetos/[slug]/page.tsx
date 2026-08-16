import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectView from "@/components/ProjectView";
import { getProjectBySlug, projects } from "@/lib/works";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {};
  }

  return {
    title: `${project.title} | Studio Motion`,
    description: project.about
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return <ProjectView project={project} />;
}
