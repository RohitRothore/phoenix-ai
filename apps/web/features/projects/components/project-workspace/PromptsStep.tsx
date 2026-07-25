"use client";

import type { PromptsStepProps } from "./step-types";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import type { Scenes } from "@/features/projects/services/project.service";

function PromptField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-lg border border-[#27272A]/40 bg-[#0a0a0b] p-3">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-[#7C3AED]">
        {label}
      </span>
      <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-400">
        {value}
      </p>
    </div>
  );
}

export function PromptsStep({
  projectSlug,
  prompts,
  scenes,
  loading,
  error,
  setError,
  onGeneratePrompts,
}: Omit<PromptsStepProps, "activeStep">) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-6 md:col-span-1">
        <div className="space-y-4 rounded-2xl border border-[#27272A] bg-[#111111] p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="size-5 text-[#A78BFA]" />
            <h3 className="text-lg font-bold text-white">Prompt Builder</h3>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Finalize each scene into a render-ready prompt with camera,
            lighting, mood, and visual exclusions.
          </p>
          <Button
            onClick={onGeneratePrompts}
            className={
              prompts
                ? "w-full border-[#27272A] py-5 font-semibold text-zinc-300 hover:bg-[#1c1c1f]"
                : "w-full bg-[#7C3AED] py-5 font-semibold text-white hover:bg-[#6d28d9]"
            }
            disabled={loading.prompts}
            variant={prompts ? "outline" : "default"}
          >
            {loading.prompts ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Building Prompts...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" />
                {prompts ? "Regenerate Prompts" : "Build Render Prompts"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="md:col-span-2">
        {prompts ? (
          <PromptsView prompts={prompts} scenes={scenes} />
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center">
            <Sparkles className="mb-4 size-12 animate-pulse text-zinc-600 stroke-1" />
            <h3 className="mb-1 text-lg font-bold text-zinc-300">
              Render Prompts Pending
            </h3>
            <p className="max-w-sm text-sm text-zinc-500">
              Generate dialogue first, then finalize the visual direction
              for every scene.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PromptsView({
  prompts,
  scenes,
}: {
  prompts: { scenes: { id: number; prompt: string; camera: string; lighting: string; mood: string; negativePrompt: string }[] };
  scenes: { scenes: { id: number; title: string }[] } | null;
}) {
  return (
    <div className="space-y-4">
      {prompts.scenes.map((scene) => (
        <article
          key={scene.id}
          className="space-y-4 rounded-2xl border border-[#27272A] bg-[#111111] p-5"
        >
          <div className="flex items-center gap-3 border-b border-[#27272A]/50 pb-3">
            <span className="flex size-7 items-center justify-center rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/10 text-xs font-bold text-[#A78BFA]">
              #{scene.id}
            </span>
            <h4 className="font-bold text-white">
              {scenes?.scenes.find((item) => item.id === scene.id)?.title ??
                `Scene ${scene.id}`}
            </h4>
          </div>
          <PromptField label="Render Prompt" value={scene.prompt} />
          <div className="grid gap-3 sm:grid-cols-2">
            <PromptField label="Camera" value={scene.camera} />
            <PromptField label="Lighting" value={scene.lighting} />
            <PromptField label="Mood" value={scene.mood} />
            <PromptField label="Avoid" value={scene.negativePrompt} />
          </div>
        </article>
      ))}
    </div>
  );
}