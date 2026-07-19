"use client";

import { useState } from "react";
import { BookOpenText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateDirectorPlan, generateStory, type Project } from "@/features/projects/services/project.service";

type ProjectWorkspaceProps = {
  project: Project;
};

export function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<{ genre: string; storyStructure: string[]; status: string } | null>(null);
  const [story, setStory] = useState<{ title: string; hook: string; summary: string; ending: string; status: string } | null>(null);

  const handleGenerateDirectorPlan = async () => {
    setLoading(true);

    try {
      const response = await generateDirectorPlan(project.slug);
      setPlan(response.data);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStory = async () => {
    setLoading(true);

    try {
      const response = await generateStory(project.slug);
      setStory(response.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[#27272A] bg-[#18181B] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Workspace</p>
          <h2 className="text-2xl font-semibold text-white">{project.name}</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateDirectorPlan} className="bg-[#7C3AED] text-white hover:bg-[#6d28d9]" disabled={loading}>
            <Sparkles className="size-4" />
            {loading ? "Generating..." : "Generate Director Plan"}
          </Button>
          <Button onClick={handleGenerateStory} className="border border-[#27272A] bg-[#111111] text-white hover:bg-[#27272A]" disabled={loading}>
            <BookOpenText className="size-4" />
            Generate Story
          </Button>
        </div>
      </div>

      {plan ? (
        <div className="rounded-xl border border-[#27272A] bg-[#111111] p-4">
          <p className="text-sm text-zinc-400">Genre</p>
          <p className="text-lg font-semibold text-white">{plan.genre}</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {plan.storyStructure.map((step) => (
              <li key={step}>• {step}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#27272A] p-4 text-sm text-zinc-400">
          Press Generate Director Plan to create the first structured AI plan for this project.
        </div>
      )}

      {story ? (
        <div className="rounded-xl border border-[#27272A] bg-[#111111] p-4">
          <p className="text-sm text-zinc-400">Story</p>
          <h3 className="text-lg font-semibold text-white">{story.title}</h3>
          <p className="mt-2 text-sm text-zinc-300">{story.hook}</p>
          <p className="mt-2 text-sm text-zinc-300">{story.summary}</p>
          <p className="mt-2 text-sm text-zinc-300">{story.ending}</p>
        </div>
      ) : null}
    </div>
  );
}
