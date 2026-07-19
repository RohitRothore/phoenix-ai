"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

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

      <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-6">
        <div className="flex items-center gap-3 text-[#7C3AED]">
          <Sparkles className="size-5" />
          <span className="text-sm font-medium">Director Plan ready for your next project</span>
        </div>
        <p className="mt-2 text-sm text-zinc-400">Once a project is saved, the next step is to generate a director plan and store it as structured JSON.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
