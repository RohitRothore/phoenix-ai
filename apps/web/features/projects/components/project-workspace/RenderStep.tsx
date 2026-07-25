"use client";

import type { RenderStepProps } from "./step-types";
import { Button } from "@/components/ui/button";
import { Film, Play, RefreshCw, Activity, Loader2 } from "lucide-react";

export function RenderStep({
  projectSlug,
  renderResults,
  scenes,
  assets,
  pipelineStatus,
  imageResults,
  loading,
  error,
  setError,
  onRenderProject,
  onRefreshPipeline,
  onRenderScene,
}: Omit<RenderStepProps, "activeStep">) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-6 md:col-span-1">
        <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Film className="size-5 text-[#A78BFA]" />
            <h3 className="text-lg font-bold text-white">Scene Renderer</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Render AI images into video clips using FFmpeg with camera
            movements (zoom, pan, fade). Each scene video is stored as an
            Asset. Later, these will be replaced by AI-generated videos.
          </p>
          <Button
            onClick={onRenderProject}
            className="w-full bg-[#7C3AED] text-white hover:bg-[#6d28d9] font-semibold py-5"
            disabled={loading.render || !imageResults}
          >
            {loading.render ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Rendering All...
              </>
            ) : (
              <>
                <Play className="mr-2 size-4" />
                Render All Scenes
              </>
            )}
          </Button>
          <Button
            onClick={onRefreshPipeline}
            variant="outline"
            className="w-full border-[#27272A] text-zinc-300 hover:bg-[#1c1c1f] font-semibold py-3"
          >
            <Activity className="mr-2 size-4" />
            Refresh Pipeline
          </Button>

          {pipelineStatus ? (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Pipeline Status
              </h4>
              {pipelineStatus.stages.map((stage) => (
                <div
                  key={stage.stage}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-zinc-400">{stage.stage}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      stage.status === "completed"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : stage.status === "failed"
                          ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                          : stage.status === "running"
                            ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {stage.status}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="md:col-span-2">
        {renderResults ? (
          <RenderResultsView
            projectSlug={projectSlug}
            renderResults={renderResults}
            scenes={scenes}
            assets={assets}
            loading={loading}
            onRenderScene={onRenderScene}
          />
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center">
            <Film className="mb-4 size-12 animate-pulse text-zinc-600 stroke-1" />
            <h3 className="mb-1 text-lg font-bold text-zinc-300">
              Scene Rendering Pending
            </h3>
            <p className="max-w-sm text-sm text-zinc-500">
              Generate AI images first, then render them into video clips
              with FFmpeg.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RenderResultsView({
  projectSlug,
  renderResults,
  scenes,
  assets,
  loading,
  onRenderScene,
}: {
  projectSlug: string;
  renderResults: NonNullable<RenderStepProps["renderResults"]>;
  scenes: RenderStepProps["scenes"];
  assets: RenderStepProps["assets"];
  loading: RenderStepProps["loading"];
  onRenderScene: RenderStepProps["onRenderScene"];
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-4 py-3 text-sm text-zinc-400">
        {renderResults.length} scene videos rendered · Resolution:
        1080×1920 · 30 FPS
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
                <video
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectSlug}/assets`}
                  className="w-full rounded-xl border border-[#27272A] object-cover aspect-video bg-[#18181B]"
                  controls
                />
              </div>

              <div className="sm:col-span-2 space-y-3">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                    Rendered Video
                  </span>
                  <p className="text-sm text-zinc-300 leading-relaxed mt-1">
                    {result.videoPath}
                  </p>
                </div>
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
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                      FPS
                    </span>
                    <p className="text-zinc-300">{result.fps}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                      Provider
                    </span>
                    <p className="text-zinc-300">
                      {videoAsset?.provider ?? "ffmpeg"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => onRenderScene(result.sceneId)}
                    variant="outline"
                    size="sm"
                    className="border-[#27272A] text-zinc-300 hover:bg-[#1c1c1f]"
                    disabled={loading.render}
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
    </div>
  );
}