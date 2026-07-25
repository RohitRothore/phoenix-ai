"use client";

import type { VideoStepProps } from "./step-types";
import { Button } from "@/components/ui/button";
import { Film, Loader2 } from "lucide-react";

export function VideoStep({
  projectSlug,
  videoPlan,
  subtitles,
  exportPath,
  loading,
  error,
  setError,
  onPrepareVideo,
  onRenderVideo,
  onGenerateSubtitles,
  onExportVideo,
}: Omit<VideoStepProps, "activeStep">) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-6 md:col-span-1">
        <div className="space-y-4 rounded-2xl border border-[#27272A] bg-[#111111] p-6">
          <div className="flex items-center gap-3">
            <Film className="size-5 text-[#A78BFA]" />
            <h3 className="text-lg font-bold text-white">Video Render Plan</h3>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Create independently renderable scene jobs from the approved
            prompts. A video provider will execute these jobs in the next
            milestone.
          </p>
          <Button
            onClick={onPrepareVideo}
            className={
              videoPlan
                ? "w-full border-[#27272A] py-5 font-semibold text-zinc-300 hover:bg-[#1c1c1f]"
                : "w-full bg-[#7C3AED] py-5 font-semibold text-white hover:bg-[#6d28d9]"
            }
            disabled={loading.render}
            variant={videoPlan ? "outline" : "default"}
          >
            {loading.render ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Preparing Jobs...
              </>
            ) : (
              <>
                <Film className="mr-2 size-4" />
                {videoPlan ? "Rebuild Render Plan" : "Prepare Video Jobs"}
              </>
            )}
          </Button>
          {videoPlan ? (
            <Button
              onClick={onRenderVideo}
              className="w-full bg-emerald-600 py-5 font-semibold text-white hover:bg-emerald-500"
              disabled={loading.render || videoPlan.renderStatus === "completed"}
            >
              {loading.render ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Rendering Video...
                </>
              ) : videoPlan.renderStatus === "completed" ? (
                "Video Rendered"
              ) : (
                <>
                  <Film className="mr-2 size-4" />
                  Render Local MP4
                </>
              )}
            </Button>
          ) : null}
          <Button
            onClick={onGenerateSubtitles}
            className="w-full border-[#27272A] py-5 font-semibold text-zinc-300 hover:bg-[#1c1c1f]"
            disabled={loading.render || Boolean(subtitles)}
            variant="outline"
          >
            {subtitles ? "Subtitles Generated" : "Generate Subtitles"}
          </Button>
          {videoPlan?.renderStatus === "completed" && subtitles ? (
            <Button
              onClick={onExportVideo}
              className="w-full bg-[#7C3AED] py-5 font-semibold text-white hover:bg-[#6d28d9]"
              disabled={loading.render || Boolean(exportPath)}
            >
              {exportPath ? "Captioned Export Created" : "Export Captioned MP4"}
            </Button>
          ) : null}
          {exportPath ? (
            <a
              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectSlug}/export/download`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-[#27272A] bg-[#18181B] px-4 py-5 text-sm font-semibold text-zinc-200 hover:bg-[#27272A]"
            >
              Download Final MP4
            </a>
          ) : null}
        </div>
      </div>
      <div className="md:col-span-2">
        {videoPlan ? (
          <VideoPlanView
            videoPlan={videoPlan}
            subtitles={subtitles}
            exportPath={exportPath}
          />
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center">
            <Film className="mb-4 size-12 animate-pulse text-zinc-600 stroke-1" />
            <h3 className="mb-1 text-lg font-bold text-zinc-300">
              Video Jobs Pending
            </h3>
            <p className="max-w-sm text-sm text-zinc-500">
              Approve render prompts to prepare scene jobs for a future
              video provider.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoPlanView({
  videoPlan,
  subtitles,
  exportPath,
}: {
  videoPlan: NonNullable<VideoStepProps["videoPlan"]>;
  subtitles: VideoStepProps["subtitles"];
  exportPath: VideoStepProps["exportPath"];
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-4 py-3 text-sm text-zinc-400">
        {videoPlan.resolution} · {videoPlan.frameRate} FPS ·{" "}
        {videoPlan.renderStatus === "completed"
          ? `Rendered: ${videoPlan.finalPath}`
          : `${videoPlan.scenes.length} scene jobs pending render`}
      </div>
      {subtitles ? (
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-4 py-3 text-sm text-zinc-400">
          Captions: {subtitles.cues.length} cues · {subtitles.srtPath}
        </div>
      ) : null}
      {exportPath ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          Final export: {exportPath}
        </div>
      ) : null}
      {videoPlan.scenes.map((scene) => (
        <article
          key={scene.id}
          className="flex items-center justify-between gap-4 rounded-2xl border border-[#27272A] bg-[#111111] p-5"
        >
          <div>
            <p className="font-bold text-white">Scene {scene.id}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {scene.duration}s · {scene.camera} · {scene.lighting}
            </p>
          </div>
          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            {scene.status}
          </span>
        </article>
      ))}
    </div>
  );
}