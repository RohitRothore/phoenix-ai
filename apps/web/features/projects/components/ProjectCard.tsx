import { ArrowRight, Film, Languages, Sparkles } from "lucide-react";

import type { Project } from "@/features/projects/services/project.service";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4 text-white">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Project</p>
          <h3 className="text-lg font-semibold">{project.name}</h3>
        </div>
        <div className="rounded-full bg-[#27272A] px-3 py-1 text-xs text-zinc-300">{project.status}</div>
      </div>

      <div className="space-y-2 text-sm text-zinc-300">
        <div className="flex items-center gap-2">
          <Languages className="size-4 text-[#7C3AED]" />
          <span>{project.language}</span>
        </div>
        <div className="flex items-center gap-2">
          <Film className="size-4 text-[#7C3AED]" />
          <span>{project.platform}</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#7C3AED]" />
          <span>{project.style}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
        <span>{project.humor}</span>
        <button className="inline-flex items-center gap-1 text-[#7C3AED] transition hover:text-white">
          Open <ArrowRight className="size-4" />
        </button>
      </div>
    </article>
  );
}
