"use client";

import type { ScenesStepProps } from "./step-types";
import { Button } from "@/components/ui/button";
import { Film, Sparkles, Loader2, Clock } from "lucide-react";
import type { Scenes } from "@/features/projects/services/project.service";

export function ScenesStep({
  projectSlug,
  scenes,
  loading,
  error,
  setError,
  onGenerateScenes,
}: Omit<ScenesStepProps, "activeStep">) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-6 md:col-span-1">
        <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Film className="size-5 text-[#A78BFA]" />
            <h3 className="text-lg font-bold text-white">Scene Planner</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            The Scene Planner takes the completed story acts and maps them
            into filmable visual segments. Each scene is complete with
            length, precise visual prompts for AI rendering, dialogue
            audio cues, and comedy beats.
          </p>
          {!scenes ? (
            <Button
              onClick={onGenerateScenes}
              className="w-full bg-[#7C3AED] text-white hover:bg-[#6d28d9] font-semibold py-5"
              disabled={loading.scenes}
            >
              {loading.scenes ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Planning Scenes...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Plan Scenes
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onGenerateScenes}
              variant="outline"
              className="w-full border-[#27272A] text-zinc-300 hover:bg-[#1c1c1f] font-semibold py-5"
              disabled={loading.scenes}
            >
              {loading.scenes ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Re-planning...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4 text-[#A78BFA]" />
                  Re-plan Scenes
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        {scenes ? (
          <ScenesView scenes={scenes} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center h-full min-h-[300px]">
            <Film className="size-12 text-zinc-600 mb-4 stroke-1 animate-pulse" />
            <h3 className="text-lg font-bold text-zinc-300 mb-1">
              Scenes Pending
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              Plan scenes to generate exact prompt specifications for
              rendering videos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScenesView({ scenes }: { scenes: Scenes }) {
  return (
    <div className="space-y-4">
      {scenes.scenes.map((scene) => (
        <div
          key={scene.id}
          className="rounded-2xl border border-[#27272A] bg-[#111111] p-5 space-y-4 shadow-md"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272A]/50 pb-3">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-xs font-bold text-[#A78BFA] border border-[#7C3AED]/20">
                #{scene.id}
              </span>
              <h4 className="font-bold text-white text-base">{scene.title}</h4>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="rounded-md bg-zinc-800/80 px-2 py-1 text-zinc-300">
                {scene.act}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 text-zinc-500" /> {scene.duration}s
              </span>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Visual Action Description
              </span>
              <p className="text-sm text-zinc-300 leading-relaxed">{scene.description}</p>
            </div>

            {scene.dialogue && (
              <div className="space-y-1 p-3 rounded-lg bg-[#18181B] border border-[#27272A]/60 font-serif">
                <span className="text-[10px] uppercase tracking-widest text-[#A78BFA] font-bold block mb-1">
                  Dialogue / Narration
                </span>
                <p className="text-sm text-white italic leading-relaxed">{scene.dialogue}</p>
              </div>
            )}

            <div className="space-y-1 p-3 rounded-lg bg-[#0a0a0b] border border-[#27272A]/40">
              <span className="text-[10px] uppercase tracking-widest text-[#7C3AED] font-bold block mb-1">
                AI Video Generation Prompt
              </span>
              <code className="text-xs text-zinc-400 leading-relaxed block break-words whitespace-pre-wrap select-all selection:bg-[#7C3AED]/30">
                {scene.visualPrompt}
              </code>
            </div>

            {scene.comedyElement && (
              <div className="text-xs text-amber-400 flex items-center gap-1.5 bg-amber-950/10 border border-amber-900/30 rounded-lg px-3 py-2">
                <Sparkles className="size-3 text-amber-500 shrink-0" />
                <span>Comedy element: {scene.comedyElement}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}