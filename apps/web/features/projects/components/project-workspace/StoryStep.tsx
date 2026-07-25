"use client";

import type { StoryStepProps } from "./step-types";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import type { Story } from "@/features/projects/services/project.service";

export function StoryStep({
  projectSlug,
  story,
  loading,
  error,
  setError,
  onGenerateStory,
}: Omit<StoryStepProps, "activeStep">) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-6 md:col-span-1">
        <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="size-5 text-[#A78BFA]" />
            <h3 className="text-lg font-bold text-white">Story Writer</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            The Story AI reads the Director Plan constraints and writes a
            structured storyline complete with attention hook, character
            definitions, premise, summary, and funny punchlines.
          </p>
          {!story ? (
            <Button
              onClick={onGenerateStory}
              className="w-full bg-[#7C3AED] text-white hover:bg-[#6d28d9] font-semibold py-5"
              disabled={loading.story}
            >
              {loading.story ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Writing Script...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Generate Story
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onGenerateStory}
              variant="outline"
              className="w-full border-[#27272A] text-zinc-300 hover:bg-[#1c1c1f] font-semibold py-5"
              disabled={loading.story}
            >
              {loading.story ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Rewriting Story...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4 text-[#A78BFA]" />
                  Rewrite Story
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        {story ? (
          <StoryView story={story} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center h-full min-h-[300px]">
            <FileText className="size-12 text-zinc-600 mb-4 stroke-1" />
            <h3 className="text-lg font-bold text-zinc-300 mb-1">
              Story Plan Pending
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              Generate the story next to map characters, dialogue cues,
              and act structures.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StoryView({ story }: { story: Story }) {
  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-6 space-y-6">
      <div>
        <span className="text-xs uppercase tracking-widest text-[#A78BFA] font-bold">
          Script Title
        </span>
        <h3 className="text-2xl font-black text-white mt-1">{story.title}</h3>
      </div>

      <div className="space-y-1.5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <p className="text-xs uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
          <Sparkles className="size-3.5" /> Core Comedy Hook (0-3s)
        </p>
        <p className="text-base font-medium text-white italic leading-relaxed">
          &ldquo;{story.hook}&rdquo;
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
            Premise
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed mt-1">{story.premise}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
            Story Summary
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed mt-1">{story.summary}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
            Key Comedic Twist / Payoff
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed mt-1">{story.ending}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          Character Cast
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {story.characters.map((char, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{char.name}</span>
                <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-400">
                  {char.role}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{char.personality}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          Acts Flow
        </h4>
        <div className="space-y-3">
          {story.acts.map((act, idx) => (
            <div
              key={idx}
              className="flex gap-4 p-4 rounded-xl bg-[#18181B]/40 border border-[#27272A]/50"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-[#27272A] text-xs font-bold text-zinc-300">
                {idx + 1}
              </div>
              <div className="space-y-1">
                <span className="text-sm font-bold text-white">{act.name}</span>
                <p className="text-xs text-zinc-400 leading-relaxed">{act.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}