"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ProjectWorkspace } from "@/features/projects/components/ProjectWorkspace";
import { getProject, type Project } from "@/features/projects/services/project.service";

export default function ProjectSlugPage() {
  const params = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const response = await getProject(params.slug);
        setProject(response.data ?? null);
      } catch (err) {
        console.error("Failed to load project details:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.slug]);


  if (loading) {
    return <div className="text-zinc-400">Loading project workspace...</div>;
  }

  if (!project) {
    return <div className="text-rose-400">Project not found.</div>;
  }

  return <ProjectWorkspace project={project} />;
}
