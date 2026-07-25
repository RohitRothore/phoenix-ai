"use client";

import type { DialoguesStepProps } from "./step-types";
import { Button } from "@/components/ui/button";
import { BookOpenText, Sparkles, Loader2 } from "lucide-react";
import type { Dialogues } from "@/features/projects/services/project.service";

export function DialoguesStep({
  projectSlug,
  dialogues,
  scenes,
  loading,
  error,
  setError,
  onGenerateDialogues,
}: Omit<DialoguesStepProps, "activeStep">) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-6 md:col-span-1">
        <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <BookOpenText className="size-5 text-[#A78BFA]" />
            <h3 className="text-lg font-bold text-white">Dialogue Writer</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            The Dialogue AI writes natural, character-specific dialogue
            for every scene. Each character gets a distinct voice,
            emotion, and comedic timing.
          </p>
          {!dialogues ? (
            <Button
              onClick={onGenerateDialogues}
              className="w-full bg-[#7C3AED] text-white hover:bg-[#6d28d9] font-semibold py-5"
              disabled={loading.dialogues}
            >
              {loading.dialogues ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Writing Dialogues...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Generate Dialogues
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onGenerateDialogues}
              variant="outline"
              className="w-full border-[#27272A] text-zinc-300 hover:bg-[#1c1c1f] font-semibold py-5"
              disabled={loading.dialogues}
            >
              {loading.dialogues ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Rewriting Dialogues...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4 text-[#A78BFA]" />
                  Rewrite Dialogues
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        {dialogues ? (
          <DialoguesView dialogues={dialogues} scenes={scenes} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center h-full min-h-[300px]">
            <BookOpenText className="size-12 text-zinc-600 mb-4 stroke-1 animate-pulse" />
            <h3 className="text-lg font-bold text-zinc-300 mb-1">
              Dialogues Pending
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              Generate scenes first, then write character dialogue for
              each scene.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DialoguesView({
  dialogues,
  scenes,
}: {
  dialogues: Dialogues;
  scenes: { scenes: { id: number; title: string }[] } | null;
}) {
  return (
    <div className="space-y-6">
      {dialogues.scenes.map((sceneD) => {
        const sceneInfo = scenes?.scenes.find((s) => s.id === sceneD.id);
        return (
          <div
            key={sceneD.id}
            className="rounded-2xl border border-[#27272A] bg-[#111111] p-5 space-y-4 shadow-md"
          >
            <div className="flex items-center gap-3 border-b border-[#27272A]/50 pb-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-xs font-bold text-[#A78BFA] border border-[#7C3AED]/20">
                #{sceneD.id}
              </span>
              <h4 className="font-bold text-white text-base">
                {sceneInfo?.title ?? `Scene ${sceneD.id}`}
              </h4>
            </div>

            <div className="space-y-3">
              {sceneD.dialogue.map((line, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 p-3 rounded-xl bg-[#18181B] border border-[#27272A]/60"
                >
                  <div className="flex flex-col items-center gap-1 min-w-[80px]">
                    <span className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider">
                      {line.character}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      {line.emotion}
                    </span>
                    {line.timing && (
                      <span className="text-[10px] text-zinc-600 italic">
                        {line.timing}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 border-l border-[#27272A] pl-3">
                    <p className="text-sm text-white leading-relaxed">{line.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}