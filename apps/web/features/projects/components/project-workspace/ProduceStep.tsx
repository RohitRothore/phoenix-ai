"use client";

import { Button } from "@/components/ui/button";
import {
  Film,
  Mic,
  Subtitles,
  Download,
  Loader2,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Music,
} from "lucide-react";

import type { Step } from "../ProjectWorkspace";
import type {
  Scenes,
  Prompts,
  Subtitles as SubtitlesType,
  VoiceGenerationResult,
  SceneRenderResult,
  ImageGenerationResult,
  Asset,
  CompositionResult,
} from "@/features/projects/services/project.service";

export interface ProduceStepProps {
  projectSlug: string;
  scenes: Scenes | null;
  prompts: Prompts | null;
  imageResults: ImageGenerationResult[] | null;
  renderResults: SceneRenderResult[] | null;
  voiceResult: VoiceGenerationResult | null;
  subtitles: SubtitlesType | null;
  compositionResult: CompositionResult | null;
  assets: Asset[] | null;
  loading: Record<Step, boolean>;
  error: string | null;
  setError: (error: string | null) => void;
  onRenderProject: () => Promise<void>;
  onRenderScene: (sceneId: string) => Promise<void>;
  onGenerateVoice: () => Promise<void>;
  onGenerateSubtitles: () => Promise<void>;
  onComposeVideo: () => Promise<void>;
  onRefreshPipeline: () => Promise<void>;
}

export function ProduceStep({
  projectSlug,
  scenes,
  prompts,
  imageResults,
  renderResults,
  voiceResult,
  subtitles,
  compositionResult,
  assets,
  loading,
  error,
  setError,
  onRenderProject,
  onRenderScene,
  onGenerateVoice,
  onGenerateSubtitles,
  onComposeVideo,
  onRefreshPipeline,
}: ProduceStepProps) {
  const hasImages = Boolean(imageResults && imageResults.length > 0);
  const hasRenderedClips = Boolean(
    renderResults && renderResults.length > 0,
  );
  const hasVoice = Boolean(voiceResult);
  const hasSubtitles = Boolean(subtitles && subtitles.status === "ready");
  const hasComposed = Boolean(compositionResult);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-6 md:col-span-1">
        <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Film className="size-5 text-[#A78BFA]" />
            <h3 className="text-lg font-bold text-white">Produce Video</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Render AI images into video clips, generate voice audio, create
            subtitles, and compose the final video ready for YouTube Shorts.
          </p>

          <div className="space-y-3">
            {/* Step 1: Render Scenes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {hasRenderedClips ? (
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                ) : (
                  <span className="flex size-3.5 items-center justify-center rounded-full border border-zinc-600 text-[8px] text-zinc-500">
                    1
                  </span>
                )}
                Render Scenes
              </div>
              <Button
                onClick={onRenderProject}
                className="w-full bg-[#7C3AED] text-white hover:bg-[#6d28d9] font-semibold py-5"
                disabled={loading.produce || !hasImages}
              >
                {loading.produce ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Rendering...
                  </>
                ) : hasRenderedClips ? (
                  <>
                    <RefreshCw className="mr-2 size-4" />
                    Re-render All
                  </>
                ) : (
                  <>
                    <Play className="mr-2 size-4" />
                    Render All Scenes
                  </>
                )}
              </Button>
            </div>

            {/* Step 2: Generate Voice */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {hasVoice ? (
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                ) : (
                  <span className="flex size-3.5 items-center justify-center rounded-full border border-zinc-600 text-[8px] text-zinc-500">
                    2
                  </span>
                )}
                Voice (TTS)
              </div>
              <Button
                onClick={onGenerateVoice}
                className={
                  hasVoice
                    ? "w-full border-[#27272A] py-5 font-semibold text-zinc-300 hover:bg-[#1c1c1f]"
                    : "w-full bg-[#7C3AED] py-5 font-semibold text-white hover:bg-[#6d28d9]"
                }
                disabled={loading.produce || !hasRenderedClips}
                variant={hasVoice ? "outline" : "default"}
              >
                {loading.produce ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Generating Voice...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 size-4" />
                    {hasVoice ? "Regenerate Voice" : "Generate Voice"}
                  </>
                )}
              </Button>
            </div>

            {/* Step 3: Generate Subtitles */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {hasSubtitles ? (
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                ) : (
                  <span className="flex size-3.5 items-center justify-center rounded-full border border-zinc-600 text-[8px] text-zinc-500">
                    3
                  </span>
                )}
                Subtitles
              </div>
              <Button
                onClick={onGenerateSubtitles}
                className={
                  hasSubtitles
                    ? "w-full border-[#27272A] py-5 font-semibold text-zinc-300 hover:bg-[#1c1c1f]"
                    : "w-full bg-[#7C3AED] py-5 font-semibold text-white hover:bg-[#6d28d9]"
                }
                disabled={loading.produce || !hasRenderedClips}
                variant={hasSubtitles ? "outline" : "default"}
              >
                {loading.produce ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Subtitles className="mr-2 size-4" />
                    {hasSubtitles ? "Regenerate Subtitles" : "Generate Subtitles"}
                  </>
                )}
              </Button>
            </div>

            {/* Step 4: Compose Final Video */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {hasComposed ? (
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                ) : (
                  <span className="flex size-3.5 items-center justify-center rounded-full border border-zinc-600 text-[8px] text-zinc-500">
                    4
                  </span>
                )}
                Compose Final
              </div>
              <Button
                onClick={onComposeVideo}
                className="w-full bg-emerald-600 py-5 font-semibold text-white hover:bg-emerald-500"
                disabled={loading.produce || !hasSubtitles}
              >
                {loading.produce ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Composing...
                  </>
                ) : hasComposed ? (
                  <>
                    <RefreshCw className="mr-2 size-4" />
                    Re-compose
                  </>
                ) : (
                  <>
                    <Film className="mr-2 size-4" />
                    Compose Final Video
                  </>
                )}
              </Button>
            </div>

            {/* Download */}
            {hasComposed && (
              <a
                href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectSlug}/final/download`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-lg border border-[#27272A] bg-[#18181B] px-4 py-5 text-sm font-semibold text-zinc-200 hover:bg-[#27272A]"
              >
                <Download className="mr-2 size-4" />
                Download Final MP4
              </a>
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
      </div>

      <div className="md:col-span-2">
        <ProduceResultsView
          projectSlug={projectSlug}
          scenes={scenes}
          renderResults={renderResults}
          voiceResult={voiceResult}
          subtitles={subtitles}
          compositionResult={compositionResult}
          assets={assets}
          loading={loading}
          onRenderScene={onRenderScene}
        />
      </div>
    </div>
  );
}

function ProduceResultsView({
  projectSlug,
  scenes,
  renderResults,
  voiceResult,
  subtitles,
  compositionResult,
  assets,
  loading,
  onRenderScene,
}: {
  projectSlug: string;
  scenes: Scenes | null;
  renderResults: SceneRenderResult[] | null;
  voiceResult: VoiceGenerationResult | null;
  subtitles: SubtitlesType | null;
  compositionResult: CompositionResult | null;
  assets: Asset[] | null;
  loading: Record<Step, boolean>;
  onRenderScene: (sceneId: string) => Promise<void>;
}) {
  if (!renderResults && !compositionResult) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center">
        <Film className="mb-4 size-12 animate-pulse text-zinc-600 stroke-1" />
        <h3 className="mb-1 text-lg font-bold text-zinc-300">
          Production Pending
        </h3>
        <p className="max-w-sm text-sm text-zinc-500">
          Generate images first, then render scenes, add voice, subtitles, and
          compose the final video.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scene Clips */}
      {renderResults && (
        <>
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-4 py-3 text-sm text-zinc-400">
            {renderResults.length} scene clips rendered · 1080×1920 · 30 FPS
          </div>
          {renderResults.map((result) => {
            const scene = scenes?.scenes.find(
              (s) => String(s.id) === result.sceneId,
            );
            const videoAsset = assets?.find(
              (a) => a.sceneId === result.sceneId && a.type === "VIDEO",
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
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      videoAsset?.status === "ready"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {videoAsset?.status ?? "pending"}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    {videoAsset && videoAsset.status === "ready" ? (
                      <video
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectSlug}/assets/${videoAsset._id}/file`}
                        className="w-full rounded-xl border border-[#27272A] object-cover aspect-video bg-[#18181B]"
                        controls
                      />
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-[#27272A] bg-[#18181B] text-xs text-zinc-500">
                        No video
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                          Duration
                        </span>
                        <p className="text-zinc-300">{result.duration}s</p>
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
                        onClick={() => onRenderScene(result.sceneId)}
                        variant="outline"
                        size="sm"
                        className="border-[#27272A] text-zinc-300 hover:bg-[#1c1c1f]"
                        disabled={loading.produce}
                      >
                        <RefreshCw className="mr-1 size-3" />
                        Re-render
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Voice Info */}
      {voiceResult && (
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-4 py-3 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <Mic className="size-4 text-[#A78BFA]" />
            <span>
              Voice generated: {voiceResult.lines.length} lines ·{" "}
              {voiceResult.totalDuration.toFixed(1)}s total
            </span>
          </div>
        </div>
      )}

      {/* Subtitles Info */}
      {subtitles && subtitles.status === "ready" && (
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-4 py-3 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <Subtitles className="size-4 text-[#A78BFA]" />
            <span>Subtitles: {subtitles.cues.length} cues generated</span>
          </div>
        </div>
      )}

      {/* Composition Result */}
      {compositionResult && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            <span>
              Final video composed · {compositionResult.duration}s · Ready for
              download
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
