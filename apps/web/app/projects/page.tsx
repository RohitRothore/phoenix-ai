"use client";

import { useEffect, useState } from "react";

import { ProjectCard } from "@/features/projects/components/ProjectCard";
import { listProjects, type Project } from "@/features/projects/services/project.service";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    void (async () => {
      const response = await listProjects();
      setProjects(response.data);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5">
        <h2 className="text-2xl font-semibold text-white">Projects</h2>
        <p className="mt-1 text-sm text-zinc-400">Track every comedy video project you create.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
