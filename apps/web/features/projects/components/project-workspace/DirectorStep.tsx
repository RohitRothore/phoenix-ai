"use client";

import type { DirectorStepProps } from "./step-types";
import { Button } from "@/components/ui/button";
import { Compass, Sparkles, Loader2 } from "lucide-react";
import type { DirectorPlan } from "@/features/projects/services/project.service";

export function DirectorStep({
  projectSlug,
  plan,
  loading,
  error,
  setError,
  onGenerateDirectorPlan,
}: Omit<DirectorStepProps, "activeStep">) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-6 md:col-span-1">
        <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Compass className="size-5 text-[#A78BFA]" />
            <h3 className="text-lg font-bold text-white">Director Plan</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            The Director AI analyzes your project topic, humor style, and
            target platform to establish creative boundaries, comedic
            tone, pacing, and visual look.
          </p>
          {!plan ? (
            <Button
              onClick={onGenerateDirectorPlan}
              className="w-full bg-[#7C3AED] text-white hover:bg-[#6d28d9] font-semibold py-5"
              disabled={loading.director}
            >
              {loading.director ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Analyzing Style...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Generate Director Plan
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onGenerateDirectorPlan}
              variant="outline"
              className="w-full border-[#27272A] text-zinc-300 hover:bg-[#1c1c1f] font-semibold py-5"
              disabled={loading.director}
            >
              {loading.director ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Re-analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4 text-[#A78BFA]" />
                  Regenerate Plan
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        {plan ? (
          <DirectorPlanView plan={plan} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center h-full min-h-[300px]">
            <Compass className="size-12 text-zinc-600 mb-4 stroke-1 animate-pulse" />
            <h3 className="text-lg font-bold text-zinc-300 mb-1">
              Director Plan Required
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              Generate the director plan first to lay the foundation of
              the storytelling guidelines.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DirectorPlanView({ plan }: { plan: DirectorPlan }) {
  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-6 space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5 p-4 rounded-xl bg-[#18181B] border border-[#27272A]/50">
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
            Genre
          </p>
          <p className="text-lg font-bold text-white">{plan.genre}</p>
        </div>
        <div className="space-y-1.5 p-4 rounded-xl bg-[#18181B] border border-[#27272A]/50">
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
            Target Audience
          </p>
          <p className="text-lg font-bold text-white">{plan.targetAudience}</p>
        </div>
        <div className="space-y-1.5 p-4 rounded-xl bg-[#18181B] border border-[#27272A]/50">
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
            Tone
          </p>
          <p className="text-lg font-bold text-white">{plan.tone}</p>
        </div>
        <div className="space-y-1.5 p-4 rounded-xl bg-[#18181B] border border-[#27272A]/50">
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
            Pacing
          </p>
          <p className="text-lg font-bold text-white">{plan.pacing}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          Story Structure
        </h4>
        <div className="flex flex-wrap items-center gap-2">
          {plan.storyStructure.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="rounded-lg bg-[#27272A] px-3.5 py-1.5 text-xs font-semibold text-zinc-200 border border-[#3f3f46]">
                {step}
              </span>
              {idx < plan.storyStructure.length - 1 && (
                <span className="text-zinc-600 font-bold">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 p-4 rounded-xl bg-[#18181B] border border-[#27272A]/50">
        <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
          Visual Style
        </p>
        <p className="text-sm text-zinc-300 leading-relaxed">{plan.visualStyle}</p>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          Comedic Mechanics
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {plan.comedyMechanics.map((mech, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 rounded-lg bg-[#18181B]/50 px-3.5 py-2.5 text-sm text-zinc-300 border border-[#27272A]/40"
            >
              <span className="size-1.5 rounded-full bg-[#A78BFA]" />
              <span>{mech}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 p-4 rounded-xl bg-[#18181B] border border-[#27272A]/50">
        <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
          Content Constraints & Guidelines
        </p>
        <p className="text-sm text-zinc-300 leading-relaxed">
          {plan.contentGuidelines}
        </p>
      </div>
    </div>
  );
}