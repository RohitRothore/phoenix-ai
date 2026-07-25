"use client";

import type { PromptsStepProps } from "./step-types";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Download,
  Play,
} from "lucide-react";

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
  imageResults,
  assets,
  loading,
  error,
  setError,
  onGeneratePrompts,
  onGenerateImages,
  onRegenerateImage,
  onRefreshPipeline,
}: Omit<PromptsStepProps, "activeStep">) {
  const hasImages = Boolean(imageResults && imageResults.length > 0);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-6 md:col-span-1">
        <div className="space-y-4 rounded-2xl border border-[#27272A] bg-[#111111] p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="size-5 text-[#A78BFA]" />
            <h3 className="text-lg font-bold text-white">Prompts & Images</h3>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Build render-ready prompts for each scene, then generate AI images.
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

          {prompts && (
            <Button
              onClick={onGenerateImages}
              className={
                hasImages
                  ? "w-full border-[#27272A] py-5 font-semibold text-zinc-300 hover:bg-[#1c1c1f]"
                  : "w-full bg-[#7C3AED] py-5 font-semibold text-white hover:bg-[#6d28d9]"
              }
              disabled={loading.prompts}
              variant={hasImages ? "outline" : "default"}
            >
              {loading.prompts ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Generating Images...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  {hasImages ? "Regenerate All Images" : "Generate AI Images"}
                </>
              )}
            </Button>
          )}

          <Button
            onClick={onRefreshPipeline}
            variant="outline"
            className="w-full border-[#27272A] text-zinc-300 hover:bg-[#1c1c1f] font-semibold py-3"
          >
            <RefreshCw className="mr-2 size-4" />
            Refresh Status
          </Button>
        </div>
      </div>

      <div className="md:col-span-2">
        {imageResults ? (
          <ImagesResultsView
            projectSlug={projectSlug}
            imageResults={imageResults}
            scenes={scenes}
            prompts={prompts}
            assets={assets}
            loading={loading}
            onRegenerateImage={onRegenerateImage}
          />
        ) : prompts ? (
          <PromptsView prompts={prompts} scenes={scenes} />
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center">
            <Sparkles className="mb-4 size-12 animate-pulse text-zinc-600 stroke-1" />
            <h3 className="mb-1 text-lg font-bold text-zinc-300">
              Prompts & Images Pending
            </h3>
            <p className="max-w-sm text-sm text-zinc-500">
              Generate dialogue first, then build render prompts and create AI
              images for each scene.
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
  prompts: {
    scenes: {
      id: number;
      prompt: string;
      camera: string;
      lighting: string;
      mood: string;
      negativePrompt: string;
    }[];
  };
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

function ImagesResultsView({
  projectSlug,
  imageResults,
  scenes,
  prompts,
  assets,
  loading,
  onRegenerateImage,
}: {
  projectSlug: string;
  imageResults: NonNullable<PromptsStepProps["imageResults"]>;
  scenes: PromptsStepProps["scenes"];
  prompts: PromptsStepProps["prompts"];
  assets: PromptsStepProps["assets"];
  loading: PromptsStepProps["loading"];
  onRegenerateImage: PromptsStepProps["onRegenerateImage"];
}) {
  if (!imageResults || imageResults.length === 0) return null;

  return (
    <div className="space-y-4">
      {imageResults.map((result) => {
        const scene = scenes?.scenes.find(
          (s) => String(s.id) === result.sceneId,
        );
        const prompt = prompts?.scenes.find(
          (p) => p.id === Number(result.sceneId),
        );
        const asset = assets?.find(
          (a) => a.sceneId === result.sceneId && a.type === "IMAGE",
        );
        return (
          <div
            key={result.sceneId}
            className="rounded-2xl border border-[#27272A] bg-[#111111] p-5 space-y-4 shadow-md"
          >
            <div className="flex items-center justify-between border-b border-[#27272A]/50 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-xs font-bold text-[#A78BFA] border border-[#7C3AED]/20">
                  #{result.sceneId}
                </span>
                <h4 className="font-bold text-white text-base">
                  {scene?.title ?? `Scene ${result.sceneId}`}
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400">
                  Provider:{" "}
                  <span className="text-zinc-200 font-semibold">
                    {result.provider}
                  </span>
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    asset?.status === "ready"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : asset?.status === "failed"
                        ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {asset?.status ?? "pending"}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                {result.imageUrl ? (
                  <img
                    src={result.imageUrl}
                    alt={`Scene ${result.sceneId}`}
                    className="w-full rounded-xl border border-[#27272A] object-cover aspect-square"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-[#27272A] bg-[#18181B]">
                    <Sparkles className="size-8 text-zinc-600" />
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 space-y-3">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                    Prompt
                  </span>
                  <p className="text-sm text-zinc-300 leading-relaxed mt-1">
                    {prompt?.prompt ??
                      scene?.visualPrompt ??
                      "No prompt available"}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                      Model
                    </span>
                    <p className="text-zinc-300">{result.model}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                      Resolution
                    </span>
                    <p className="text-zinc-300">
                      {result.width}×{result.height}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => onRegenerateImage(result.sceneId)}
                    variant="outline"
                    size="sm"
                    className="border-[#27272A] text-zinc-300 hover:bg-[#1c1c1f]"
                    disabled={loading.prompts}
                  >
                    <RefreshCw className="mr-1 size-3" />
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
