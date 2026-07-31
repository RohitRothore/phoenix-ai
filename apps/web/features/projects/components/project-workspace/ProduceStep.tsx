"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  ChevronDown,
  ChevronUp,
  Clock,
  Hash,
  ListVideo,
  Volume2,
  FileText,
  Sparkles,
} from "lucide-react";

import type { Step } from "../ProjectWorkspace";
import type { PipelineStageInfo } from "./step-types";
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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

const POLL_INTERVAL_MS = 3000;

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
  pipelineStages?: PipelineStageInfo[];
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

interface ProduceLoading {
  render: boolean;
  voice: boolean;
  subtitles: boolean;
  compose: boolean;
}

function getStageStatus(
  stages: PipelineStageInfo[] | undefined,
  stage: string,
): PipelineStageInfo["status"] {
  return stages?.find((s) => s.stage === stage)?.status ?? "pending";
}

function getStageInfo(
  stages: PipelineStageInfo[] | undefined,
  stage: string,
): PipelineStageInfo | undefined {
  return stages?.find((s) => s.stage === stage);
}

// ─── Progress Bar Component ─────────────────────────────────────────────────

function ProgressBar({
  current,
  total,
  color = "emerald",
}: {
  current: number;
  total: number;
  color?: "emerald" | "amber" | "blue" | "violet";
}) {
  const pct =
    total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const colorMap = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    violet: "bg-violet-500",
  };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorMap[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-zinc-400 shrink-0 tabular-nums">
        {current}/{total}
      </span>
    </div>
  );
}

// ─── Elapsed Time ───────────────────────────────────────────────────────────

function ElapsedTime({ startedAt }: { startedAt?: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!startedAt) return;
    const update = () => {
      const diff = Date.now() - new Date(startedAt).getTime();
      const secs = Math.floor(diff / 1000);
      if (secs < 60) setElapsed(`${secs}s`);
      else setElapsed(`${Math.floor(secs / 60)}m ${secs % 60}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!startedAt || !elapsed) return null;
  return (
    <span className="flex items-center gap-1 text-[10px] text-zinc-500">
      <Clock className="size-2.5" />
      {elapsed}
    </span>
  );
}

// ─── Stage Badge ────────────────────────────────────────────────────────────

function StageBadge({
  status,
  progress,
  total,
  startedAt,
}: {
  status: PipelineStageInfo["status"];
  progress?: number;
  total?: number;
  startedAt?: string;
}) {
  const config: Record<
    PipelineStageInfo["status"],
    { label: string; cls: string; icon: React.ReactNode }
  > = {
    pending: {
      label: "Pending",
      cls: "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
      icon: null,
    },
    queued: {
      label: "Queued",
      cls: "border-blue-500/20 bg-blue-500/10 text-blue-400",
      icon: <Loader2 className="size-2.5 animate-spin" />,
    },
    running: {
      label: "Running",
      cls: "border-amber-500/20 bg-amber-500/10 text-amber-400",
      icon: <Loader2 className="size-2.5 animate-spin" />,
    },
    completed: {
      label: "Done",
      cls: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
      icon: <CheckCircle2 className="size-2.5" />,
    },
    failed: {
      label: "Failed",
      cls: "border-rose-500/20 bg-rose-500/10 text-rose-400",
      icon: <AlertTriangle className="size-2.5" />,
    },
    cancelled: {
      label: "Cancelled",
      cls: "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
      icon: null,
    },
  };
  const { label, cls, icon } = config[status];

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}
      >
        {icon}
        {label}
      </span>
      {progress !== undefined && total !== undefined && total > 0 && (
        <ProgressBar current={progress} total={total} />
      )}
      <ElapsedTime startedAt={startedAt} />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ProduceStep({
  projectSlug,
  scenes,
  renderResults,
  voiceResult,
  subtitles,
  compositionResult,
  assets,
  pipelineStages,
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
  const [produceLoading, setProduceLoading] = useState<ProduceLoading>({
    render: false,
    voice: false,
    subtitles: false,
    compose: false,
  });

  // ─── Auto-polling for real-time pipeline updates ──────────────────────────
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAnyStageRunning = useCallback(() => {
    if (!pipelineStages) return false;
    return pipelineStages.some(
      (s) => s.status === "running" || s.status === "queued",
    );
  }, [pipelineStages]);

  useEffect(() => {
    if (isAnyStageRunning()) {
      pollRef.current = setInterval(onRefreshPipeline, POLL_INTERVAL_MS);
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isAnyStageRunning, onRefreshPipeline]);

  // ─── Derived state ───────────────────────────────────────────────────────

  const totalScenes = scenes?.scenes?.length ?? 0;
  const renderedScenes =
    assets?.filter((a: Asset) => a.type === "VIDEO" && a.status === "ready")
      .length ?? 0;
  const totalVoiceLines = voiceResult?.lines?.length ?? 0;
  const readyVoiceLines =
    voiceResult?.lines?.filter((l) => l.status === "ready").length ?? 0;
  const errorVoiceLines =
    voiceResult?.lines?.filter((l) => l.status === "error").length ?? 0;

  const hasImages = Boolean(
    assets &&
    assets.filter((a: Asset) => a.type === "IMAGE" && a.status === "ready")
      .length > 0,
  );
  const hasRenderedClips = renderedScenes > 0;
  const hasVoice = Boolean(voiceResult && voiceResult.lines.length > 0);
  const hasSubtitles = Boolean(subtitles && subtitles.status === "ready");
  const hasComposed = Boolean(compositionResult);

  const anyLoading =
    loading.produce || Object.values(produceLoading).some(Boolean);

  const withLoading = async <T,>(
    key: keyof ProduceLoading,
    fn: () => Promise<T>,
  ): Promise<T | undefined> => {
    setProduceLoading((prev) => ({ ...prev, [key]: true }));
    setError(null);
    try {
      return await fn();
    } catch (err: unknown) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : `Failed to complete ${key}.`,
      );
      return undefined;
    } finally {
      setProduceLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleRender = () => withLoading("render", onRenderProject);
  const handleVoice = () => withLoading("voice", onGenerateVoice);
  const handleSubtitles = () => withLoading("subtitles", onGenerateSubtitles);
  const handleCompose = () => withLoading("compose", onComposeVideo);

  const renderStage = getStageStatus(pipelineStages, "scene-rendering");
  const renderStageInfo = getStageInfo(pipelineStages, "scene-rendering");
  const voiceStage = getStageStatus(pipelineStages, "voice-generation");
  const voiceStageInfo = getStageInfo(pipelineStages, "voice-generation");
  const subtitleStage = getStageStatus(pipelineStages, "subtitle-generation");
  const subtitleStageInfo = getStageInfo(pipelineStages, "subtitle-generation");
  const exportStage = getStageStatus(pipelineStages, "export");
  const exportStageInfo = getStageInfo(pipelineStages, "export");

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left Sidebar: Controls */}
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
            <ProduceAction
              step={1}
              label="Render Scenes"
              icon={<ListVideo className="size-4" />}
              stageStatus={renderStage}
              isDone={hasRenderedClips}
              isLoading={produceLoading.render}
              disabled={anyLoading || !hasImages}
              loadingText="Rendering..."
              doneLabel="Re-render All"
              defaultLabel="Render All Scenes"
              progress={totalScenes > 0 ? renderedScenes : undefined}
              total={totalScenes > 0 ? totalScenes : undefined}
              stageError={renderStageInfo?.errorMessage}
              startedAt={renderStageInfo?.startedAt}
              onAction={handleRender}
            />

            {/* Step 2: Generate Subtitles */}
            <ProduceAction
              step={2}
              label="Subtitles"
              icon={<FileText className="size-4" />}
              stageStatus={subtitleStage}
              isDone={hasSubtitles}
              isLoading={produceLoading.subtitles}
              disabled={anyLoading || !hasRenderedClips}
              loadingText="Generating..."
              doneLabel="Regenerate Subtitles"
              defaultLabel="Generate Subtitles"
              stageError={subtitleStageInfo?.errorMessage}
              startedAt={subtitleStageInfo?.startedAt}
              onAction={handleSubtitles}
            />

            {/* Step 3: Generate Voice */}
            <ProduceAction
              step={3}
              label="Voice (TTS)"
              icon={<Volume2 className="size-4" />}
              stageStatus={voiceStage}
              isDone={hasVoice}
              isLoading={produceLoading.voice}
              disabled={anyLoading || !hasRenderedClips}
              loadingText="Generating Voice..."
              doneLabel="Regenerate Voice"
              defaultLabel="Generate Voice"
              progress={totalVoiceLines > 0 ? readyVoiceLines : undefined}
              total={totalVoiceLines > 0 ? totalVoiceLines : undefined}
              stageError={
                getStageInfo(pipelineStages, "voice-generation")?.errorMessage
              }
              startedAt={voiceStageInfo?.startedAt}
              onAction={handleVoice}
            />

            {/* Step 4: Compose Final Video */}
            <ProduceAction
              step={4}
              label="Compose Final"
              icon={<Sparkles className="size-4" />}
              stageStatus={exportStage}
              isDone={hasComposed}
              isLoading={produceLoading.compose}
              disabled={anyLoading || !hasSubtitles}
              loadingText="Composing..."
              doneLabel="Re-compose"
              defaultLabel="Compose Final Video"
              stageError={exportStageInfo?.errorMessage}
              startedAt={exportStageInfo?.startedAt}
              onAction={handleCompose}
              accent
            />

            {/* Download */}
            {hasComposed && (
              <a
                href={`${API_BASE_URL}/projects/${projectSlug}/final/download`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                <Download className="mr-2 size-4" />
                Download Final MP4
              </a>
            )}

            <Button
              onClick={onRefreshPipeline}
              variant="outline"
              className="w-full border-[#27272A] text-zinc-300 hover:bg-[#1c1c1f] font-semibold py-3"
              disabled={anyLoading}
            >
              <RefreshCw
                className={`mr-2 size-4 ${isAnyStageRunning() ? "animate-spin text-amber-400" : ""}`}
              />
              {isAnyStageRunning() ? "Auto-refreshing..." : "Refresh Status"}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Content: Results */}
      <div className="md:col-span-2">
        <ProduceResultsView
          projectSlug={projectSlug}
          scenes={scenes}
          renderResults={renderResults}
          voiceResult={voiceResult}
          subtitles={subtitles}
          compositionResult={compositionResult}
          assets={assets}
          loading={produceLoading}
          parentLoading={loading}
          pipelineStages={pipelineStages}
          onRenderScene={onRenderScene}
        />
      </div>
    </div>
  );
}

// ─── Produce Action Button ──────────────────────────────────────────────────

function ProduceAction({
  step,
  label,
  icon,
  stageStatus,
  isDone,
  isLoading,
  disabled,
  loadingText,
  doneLabel,
  defaultLabel,
  progress,
  total,
  stageError,
  startedAt,
  onAction,
  accent,
}: {
  step: number;
  label: string;
  icon: React.ReactNode;
  stageStatus: PipelineStageInfo["status"];
  isDone: boolean;
  isLoading: boolean;
  disabled: boolean;
  loadingText: string;
  doneLabel: string;
  defaultLabel: string;
  progress?: number;
  total?: number;
  stageError?: string;
  startedAt?: string;
  onAction: () => void;
  accent?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {isDone ? (
            <CheckCircle2 className="size-3.5 text-emerald-400" />
          ) : stageStatus === "running" || stageStatus === "queued" ? (
            <Loader2 className="size-3.5 animate-spin text-amber-400" />
          ) : (
            <span className="flex size-3.5 items-center justify-center rounded-full border border-zinc-600 text-[8px] text-zinc-500">
              {step}
            </span>
          )}
          {label}
        </div>
        <StageBadge
          status={stageStatus}
          progress={progress}
          total={total}
          startedAt={startedAt}
        />
      </div>
      <Button
        onClick={onAction}
        className={
          accent
            ? "w-full bg-emerald-600 py-5 font-semibold text-white hover:bg-emerald-500"
            : isDone
              ? "w-full border-[#27272A] py-5 font-semibold text-zinc-300 hover:bg-[#1c1c1f]"
              : "w-full bg-[#7C3AED] py-5 font-semibold text-white hover:bg-[#6d28d9]"
        }
        disabled={disabled}
        variant={accent ? "default" : isDone ? "outline" : "default"}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {loadingText}
          </>
        ) : isDone ? (
          <>
            <RefreshCw className="mr-2 size-4" />
            {doneLabel}
          </>
        ) : (
          <>
            {icon}
            {defaultLabel}
          </>
        )}
      </Button>

      {/* Inline stage error */}
      {stageError && stageStatus === "failed" && (
        <div className="flex items-start gap-1.5 rounded-lg border border-rose-900/30 bg-rose-950/20 px-3 py-2 text-[11px] text-rose-400">
          <AlertTriangle className="size-3 shrink-0 mt-0.5" />
          <span>{stageError}</span>
        </div>
      )}
    </div>
  );
}

// ─── Results View ───────────────────────────────────────────────────────────

function ProduceResultsView({
  projectSlug,
  scenes,
  renderResults,
  voiceResult,
  subtitles,
  compositionResult,
  assets,
  loading,
  parentLoading,
  pipelineStages,
  onRenderScene,
}: {
  projectSlug: string;
  scenes: Scenes | null;
  renderResults: SceneRenderResult[] | null;
  voiceResult: VoiceGenerationResult | null;
  subtitles: SubtitlesType | null;
  compositionResult: CompositionResult | null;
  assets: Asset[] | null;
  loading: ProduceLoading;
  parentLoading: Record<Step, boolean>;
  pipelineStages?: PipelineStageInfo[];
  onRenderScene: (sceneId: string) => Promise<void>;
}) {
  const anyLoading =
    parentLoading.produce || Object.values(loading).some(Boolean);

  if (!renderResults && !compositionResult) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center">
        <Film className="mb-4 size-12 animate-pulse text-zinc-600 stroke-1" />
        <h3 className="mb-1 text-lg font-bold text-zinc-300">
          Production Pending
        </h3>
        <p className="max-w-sm text-sm text-zinc-500">
          Generate images first, then render scenes, add subtitles, voice, and
          compose the final video.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scene Clips */}
      {renderResults && renderResults.length > 0 && (
        <SceneClipsSection
          projectSlug={projectSlug}
          scenes={scenes}
          renderResults={renderResults}
          assets={assets}
          pipelineStages={pipelineStages}
          loading={anyLoading}
          onRenderScene={onRenderScene}
        />
      )}

      {/* Subtitles */}
      {subtitles && subtitles.status === "ready" && (
        <SubtitlesSection subtitles={subtitles} />
      )}

      {/* Voice Results */}
      {voiceResult && voiceResult.lines.length > 0 && (
        <VoiceSection
          projectSlug={projectSlug}
          voiceResult={voiceResult}
          pipelineStages={pipelineStages}
        />
      )}

      {/* Composition Result */}
      {compositionResult && (
        <CompositionSection
          projectSlug={projectSlug}
          compositionResult={compositionResult}
        />
      )}
    </div>
  );
}

// ─── Scene Clips Section ────────────────────────────────────────────────────

function SceneClipsSection({
  projectSlug,
  scenes,
  renderResults,
  assets,
  pipelineStages,
  loading,
  onRenderScene,
}: {
  projectSlug: string;
  scenes: Scenes | null;
  renderResults: SceneRenderResult[];
  assets: Asset[] | null;
  pipelineStages?: PipelineStageInfo[];
  loading: boolean;
  onRenderScene: (sceneId: string) => Promise<void>;
}) {
  const totalScenes = scenes?.scenes?.length ?? renderResults.length;
  const readyVideos =
    assets?.filter((a) => a.type === "VIDEO" && a.status === "ready").length ??
    renderResults.length;
  const failedVideos =
    assets?.filter((a) => a.type === "VIDEO" && a.status === "failed").length ??
    0;
  const renderStage = getStageInfo(pipelineStages, "scene-rendering");
  const isRunning =
    renderStage?.status === "running" || renderStage?.status === "queued";

  return (
    <>
      {/* Summary bar */}
      <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-zinc-400">
            <ListVideo className="size-4 text-[#A78BFA]" />
            <span>
              {readyVideos} of {totalScenes} scene clips rendered
            </span>
            {failedVideos > 0 && (
              <span className="text-rose-400">
                &middot; {failedVideos} failed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isRunning && (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <Loader2 className="size-3 animate-spin" />
                Rendering...
              </span>
            )}
            <StageBadge
              status={renderStage?.status ?? "pending"}
              progress={readyVideos}
              total={totalScenes}
              startedAt={renderStage?.startedAt}
            />
          </div>
        </div>
        <ProgressBar current={readyVideos} total={totalScenes} />
      </div>

      {renderResults.map((result) => {
        const scene = scenes?.scenes.find(
          (s) => String(s.id) === result.sceneId,
        );
        const videoAsset = assets?.find(
          (a) => a.sceneId === result.sceneId && a.type === "VIDEO",
        );
        const isFailed = videoAsset?.status === "failed";
        const isGenerating = videoAsset?.status === "generating";

        return (
          <div
            key={result.sceneId}
            className={`rounded-2xl border p-5 space-y-4 ${
              isFailed
                ? "border-rose-500/20 bg-rose-950/10"
                : "border-[#27272A] bg-[#111111]"
            }`}
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
                  isFailed
                    ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                    : isGenerating
                      ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                      : videoAsset?.status === "ready"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border-zinc-500/20 bg-zinc-500/10 text-zinc-400"
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="size-2.5 animate-spin" />
                    Rendering
                  </span>
                ) : (
                  (videoAsset?.status ?? "pending")
                )}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                {videoAsset && videoAsset.status === "ready" ? (
                  <video
                    src={`${API_BASE_URL}/projects/${projectSlug}/assets/${videoAsset._id}/file`}
                    className="w-full rounded-xl border border-[#27272A] object-cover aspect-video bg-[#18181B]"
                    controls
                  />
                ) : isFailed ? (
                  <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border border-rose-500/20 bg-rose-950/20 text-xs text-rose-400 gap-1">
                    <AlertTriangle className="size-4" />
                    <span>Render failed</span>
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-[#27272A] bg-[#18181B] text-xs text-zinc-500">
                    {isGenerating ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" />
                        Rendering...
                      </span>
                    ) : (
                      "No video"
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 space-y-3">
                <div className="grid gap-3 sm:grid-cols-3 text-xs">
                  <MetaField label="Duration" value={`${result.duration}s`} />
                  <MetaField
                    label="Resolution"
                    value={`${result.width}×${result.height}`}
                  />
                  <MetaField label="FPS" value={String(result.fps)} />
                </div>

                {isFailed && videoAsset?.metadata?.errorMessage != null && (
                  <div className="rounded-lg border border-rose-900/30 bg-rose-950/20 px-3 py-2 text-[11px] text-rose-400">
                    {String(videoAsset.metadata.errorMessage as string)}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => onRenderScene(result.sceneId)}
                    variant="outline"
                    size="sm"
                    className="border-[#27272A] text-zinc-300 hover:bg-[#1c1c1f]"
                    disabled={loading}
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
  );
}

// ─── Voice Section ──────────────────────────────────────────────────────────

function VoiceSection({
  projectSlug,
  voiceResult,
  pipelineStages,
}: {
  projectSlug: string;
  voiceResult: VoiceGenerationResult;
  pipelineStages?: PipelineStageInfo[];
}) {
  const [expanded, setExpanded] = useState(true);
  const voiceStage = getStageInfo(pipelineStages, "voice-generation");
  const isRunning =
    voiceStage?.status === "running" || voiceStage?.status === "queued";

  const sceneGroups = new Map<string, typeof voiceResult.lines>();
  for (const line of voiceResult.lines) {
    const existing = sceneGroups.get(line.sceneId) ?? [];
    existing.push(line);
    sceneGroups.set(line.sceneId, existing);
  }

  const readyCount = voiceResult.lines.filter(
    (l) => l.status === "ready",
  ).length;
  const errorCount = voiceResult.lines.filter(
    (l) => l.status === "error",
  ).length;
  const totalCount = voiceResult.lines.length;

  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#111111] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[#18181B] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Mic className="size-4 text-[#A78BFA]" />
          <h4 className="font-bold text-white">Voice Generation</h4>
          <span className="text-xs text-zinc-400">
            {readyCount}/{totalCount} lines &middot;{" "}
            {voiceResult.totalDuration.toFixed(1)}s total
            {errorCount > 0 && (
              <span className="ml-2 text-rose-400">
                &middot; {errorCount} failed
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <Loader2 className="size-3 animate-spin" />
              Generating...
            </span>
          )}
          {expanded ? (
            <ChevronUp className="size-4 text-zinc-500" />
          ) : (
            <ChevronDown className="size-4 text-zinc-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#27272A] px-5 pb-5 space-y-4">
          {/* Progress bar for voice generation */}
          {isRunning && totalCount > 0 && (
            <div className="pt-3">
              <ProgressBar
                current={readyCount}
                total={totalCount}
                color="amber"
              />
            </div>
          )}

          {Array.from(sceneGroups.entries()).map(([sceneId, lines]) => (
            <div key={sceneId} className="space-y-2 pt-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Hash className="size-3" />
                Scene {sceneId}
              </div>
              {lines.map((line, idx) => (
                <div
                  key={`${sceneId}-${idx}`}
                  className="flex items-start gap-3 rounded-xl border border-[#27272A]/50 bg-[#18181B] p-3"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#A78BFA]">
                        {line.character}
                      </span>
                      <span className="text-[10px] rounded-full border border-zinc-700 px-1.5 py-0.5 text-zinc-400">
                        {line.emotion}
                      </span>
                      {line.status === "error" && (
                        <span className="text-[10px] rounded-full border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-rose-400">
                          error
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {line.text}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="size-2.5" />
                        {line.duration.toFixed(1)}s
                      </span>
                    </div>
                  </div>
                  {line.status === "ready" && line.audioAssetId && (
                    <div className="shrink-0">
                      <audio
                        controls
                        preload="none"
                        className="h-8 w-40"
                        src={`${API_BASE_URL}/projects/${projectSlug}/assets/${line.audioAssetId}/file`}
                      />
                    </div>
                  )}
                  {line.status === "error" && (
                    <div className="shrink-0 flex items-center gap-1 text-xs text-rose-400">
                      <AlertTriangle className="size-3" />
                      Failed
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Subtitles Section ──────────────────────────────────────────────────────

function SubtitlesSection({ subtitles }: { subtitles: SubtitlesType }) {
  const [expanded, setExpanded] = useState(true);
  const [showSrt, setShowSrt] = useState(false);

  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#111111] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[#18181B] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Subtitles className="size-4 text-[#A78BFA]" />
          <h4 className="font-bold text-white">Subtitles</h4>
          <span className="text-xs text-zinc-400">
            {subtitles.cues.length} cues generated
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 text-zinc-500" />
        ) : (
          <ChevronDown className="size-4 text-zinc-500" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[#27272A] px-5 pb-5 space-y-3">
          {/* Cue List */}
          <div className="max-h-64 overflow-y-auto space-y-1 rounded-xl border border-[#27272A]/50 bg-[#18181B] p-3">
            {subtitles.cues.map((cue) => (
              <div
                key={cue.index}
                className="flex items-baseline gap-3 text-xs py-1"
              >
                <span className="w-6 text-right font-mono text-zinc-500 shrink-0">
                  {cue.index}
                </span>
                <span className="font-mono text-zinc-500 shrink-0">
                  {cue.startTime} &rarr; {cue.endTime}
                </span>
                <span className="text-zinc-300">{cue.text}</span>
              </div>
            ))}
          </div>

          {/* SRT Content Toggle */}
          {subtitles.srtContent && (
            <div>
              <button
                onClick={() => setShowSrt(!showSrt)}
                className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {showSrt ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
                View SRT Content
              </button>
              {showSrt && (
                <pre className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-[#27272A]/50 bg-[#0a0a0b] p-3 text-[11px] leading-relaxed text-zinc-400 font-mono whitespace-pre-wrap">
                  {subtitles.srtContent}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Composition Section ────────────────────────────────────────────────────

function CompositionSection({
  projectSlug,
  compositionResult,
}: {
  projectSlug: string;
  compositionResult: CompositionResult;
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <h4 className="font-bold text-emerald-400">Final Video Ready</h4>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetaField
            label="Duration"
            value={`${compositionResult.duration}s`}
          />
          <MetaField
            label="Exported"
            value={new Date(compositionResult.exportedAt).toLocaleDateString()}
          />
          <MetaField label="Format" value="MP4 (H.264)" />
        </div>

        <div className="pt-2">
          <video
            controls
            preload="metadata"
            className="w-full rounded-xl border border-[#27272A] bg-black aspect-[9/16] max-h-[480px] object-contain"
            src={`${API_BASE_URL}/projects/${projectSlug}/final/download`}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────────────

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
        {label}
      </span>
      <p className="text-sm text-zinc-300">{value}</p>
    </div>
  );
}
