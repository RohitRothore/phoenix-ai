"use client";

import { useEffect, useState } from "react";
import {
  BookOpenText,
  Sparkles,
  Compass,
  FileText,
  Film,
  CheckCircle2,
  Lock,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  generateDirectorPlan,
  generateStory,
  generateScenes,
  generateDialogues,
  generatePrompts,
  generateSubtitles,
  getSubtitles,
  getDirectorPlan,
  getStory,
  getScenes,
  getDialogues,
  getPrompts,
  generateImages,
  getImages,
  regenerateImage,
  getAssets,
  renderScene,
  renderProject,
  generateVoice,
  getVoice,
  composeVideo,
  getPipelineStatus,
  type Project,
  type DirectorPlan,
  type Story,
  type Scenes,
  type Dialogues,
  type Prompts,
  type Subtitles,
  type ImageGenerationResult,
  type Asset,
  type SceneRenderResult,
  type PipelineStatus,
  type VoiceGenerationResult,
  type CompositionResult,
} from "@/features/projects/services/project.service";

import {
  DirectorStep,
  StoryStep,
  ScenesStep,
  DialoguesStep,
  PromptsStep,
  ProduceStep,
} from "@/features/projects/components/project-workspace";

type ProjectWorkspaceProps = {
  project: Project;
};

export type Step =
  | "director"
  | "story"
  | "scenes"
  | "dialogues"
  | "prompts"
  | "produce";

export function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const [activeStep, setActiveStep] = useState<Step>("director");
  const [loading, setLoading] = useState<Record<Step, boolean>>({
    director: false,
    story: false,
    scenes: false,
    dialogues: false,
    prompts: false,
    produce: false,
  });

  const [plan, setPlan] = useState<DirectorPlan | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [scenes, setScenes] = useState<Scenes | null>(null);
  const [dialogues, setDialogues] = useState<Dialogues | null>(null);
  const [prompts, setPrompts] = useState<Prompts | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitles | null>(null);
  const [imageResults, setImageResults] = useState<
    ImageGenerationResult[] | null
  >(null);
  const [renderResults, setRenderResults] = useState<
    SceneRenderResult[] | null
  >(null);
  const [voiceResult, setVoiceResult] = useState<VoiceGenerationResult | null>(
    null,
  );
  const [compositionResult, setCompositionResult] =
    useState<CompositionResult | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(
    null,
  );
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkspace = async () => {
      setError(null);
      try {
        const planRes = await getDirectorPlan(project.slug);
        if (planRes.data && planRes.data.status === "ready")
          setPlan(planRes.data);

        const storyRes = await getStory(project.slug);
        if (storyRes.data && storyRes.data.status === "ready")
          setStory(storyRes.data);

        const scenesRes = await getScenes(project.slug);
        if (scenesRes.data && scenesRes.data.status === "ready")
          setScenes(scenesRes.data);

        const dialoguesRes = await getDialogues(project.slug);
        if (dialoguesRes.data && dialoguesRes.data.status === "ready")
          setDialogues(dialoguesRes.data);

        const promptsRes = await getPrompts(project.slug);
        if (promptsRes.data && promptsRes.data.status === "ready")
          setPrompts(promptsRes.data);

        const subtitlesRes = await getSubtitles(project.slug);
        if (subtitlesRes.data && subtitlesRes.data.status === "ready")
          setSubtitles(subtitlesRes.data);

        const voiceRes = await getVoice(project.slug);
        if (voiceRes.data && voiceRes.data.lines?.length > 0)
          setVoiceResult(voiceRes.data);

        const assetsRes = await getAssets(project.slug);
        if (assetsRes.data) {
          setAssets(assetsRes.data);
          const videoAssets = assetsRes.data.filter(
            (a) => a.type === "VIDEO" && a.status === "ready",
          );
          if (videoAssets.length > 0) {
            setRenderResults(
              videoAssets.map((a) => ({
                sceneId: a.sceneId,
                videoPath: a.path,
                duration: a.duration ?? 0,
                width: a.width ?? 1080,
                height: a.height ?? 1920,
                fps: (a.metadata?.frameRate as number) ?? 30,
              })),
            );
          }
        }

        const imagesRes = await getImages(project.slug);
        if (imagesRes.data && imagesRes.data.length > 0)
          setImageResults(imagesRes.data);

        const pipelineRes = await getPipelineStatus(project.slug);
        if (pipelineRes.data) setPipelineStatus(pipelineRes.data);
      } catch (err) {
        console.error("Error loading project workspace data:", err);
      }
    };
    void loadWorkspace();
  }, [project.slug]);

  // ─── Step Handlers ──────────────────────────────────────────────────────

  const handleGenerateDirectorPlan = async () => {
    setLoading((prev) => ({ ...prev, director: true }));
    setError(null);
    try {
      const response = await generateDirectorPlan(project.slug);
      setPlan(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to generate Director Plan."));
    } finally {
      setLoading((prev) => ({ ...prev, director: false }));
    }
  };

  const handleGenerateStory = async () => {
    setLoading((prev) => ({ ...prev, story: true }));
    setError(null);
    try {
      const response = await generateStory(project.slug);
      setStory(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to generate Story."));
    } finally {
      setLoading((prev) => ({ ...prev, story: false }));
    }
  };

  const handleGenerateScenes = async () => {
    setLoading((prev) => ({ ...prev, scenes: true }));
    setError(null);
    try {
      const response = await generateScenes(project.slug);
      setScenes(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to generate Scenes."));
    } finally {
      setLoading((prev) => ({ ...prev, scenes: false }));
    }
  };

  const handleGenerateDialogues = async () => {
    setLoading((prev) => ({ ...prev, dialogues: true }));
    setError(null);
    try {
      const response = await generateDialogues(project.slug);
      setDialogues(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to generate Dialogues."));
    } finally {
      setLoading((prev) => ({ ...prev, dialogues: false }));
    }
  };

  const handleGeneratePrompts = async () => {
    setLoading((prev) => ({ ...prev, prompts: true }));
    setError(null);
    try {
      const response = await generatePrompts(project.slug);
      setPrompts(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to generate render prompts."));
    } finally {
      setLoading((prev) => ({ ...prev, prompts: false }));
    }
  };

  const handleGenerateImages = async () => {
    setLoading((prev) => ({ ...prev, prompts: true }));
    setError(null);
    try {
      const response = await generateImages(project.slug);
      setImageResults(response.data);
      const assetsRes = await getAssets(project.slug, "IMAGE");
      setAssets(assetsRes.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to generate images."));
    } finally {
      setLoading((prev) => ({ ...prev, prompts: false }));
    }
  };

  const handleRegenerateImage = async (sceneId: string) => {
    setLoading((prev) => ({ ...prev, prompts: true }));
    setError(null);
    try {
      const response = await regenerateImage(project.slug, sceneId);
      if (imageResults) {
        setImageResults(
          imageResults.map((r) => (r.sceneId === sceneId ? response.data : r)),
        );
      }
      const assetsRes = await getAssets(project.slug, "IMAGE");
      setAssets(assetsRes.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to regenerate image."));
    } finally {
      setLoading((prev) => ({ ...prev, prompts: false }));
    }
  };

  const handleRenderScene = async (sceneId: string) => {
    setLoading((prev) => ({ ...prev, produce: true }));
    setError(null);
    try {
      const response = await renderScene(project.slug, sceneId);
      setRenderResults((prev) => {
        const existing = prev ?? [];
        const filtered = existing.filter((r) => r.sceneId !== sceneId);
        return [...filtered, response.data];
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to render scene."));
    } finally {
      setLoading((prev) => ({ ...prev, produce: false }));
    }
  };

  const handleRenderProject = async () => {
    setLoading((prev) => ({ ...prev, produce: true }));
    setError(null);
    try {
      const response = await renderProject(project.slug);
      setRenderResults(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to render project."));
    } finally {
      setLoading((prev) => ({ ...prev, produce: false }));
    }
  };

  const handleGenerateVoice = async () => {
    setLoading((prev) => ({ ...prev, produce: true }));
    setError(null);
    try {
      const response = await generateVoice(project.slug);
      setVoiceResult(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to generate voice."));
    } finally {
      setLoading((prev) => ({ ...prev, produce: false }));
    }
  };

  const handleGenerateSubtitles = async () => {
    setLoading((prev) => ({ ...prev, produce: true }));
    setError(null);
    try {
      const response = await generateSubtitles(project.slug);
      setSubtitles(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to generate subtitles."));
    } finally {
      setLoading((prev) => ({ ...prev, produce: false }));
    }
  };

  const handleComposeVideo = async () => {
    setLoading((prev) => ({ ...prev, produce: true }));
    setError(null);
    try {
      const response = await composeVideo(project.slug);
      setCompositionResult(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to compose video."));
    } finally {
      setLoading((prev) => ({ ...prev, produce: false }));
    }
  };

  const handleRefreshPipeline = async () => {
    try {
      const pipelineRes = await getPipelineStatus(project.slug);
      setPipelineStatus(pipelineRes.data);
      const assetsRes = await getAssets(project.slug);
      setAssets(assetsRes.data);
    } catch (err) {
      console.error("Failed to refresh pipeline status:", err);
    }
  };

  // ─── Step Locking ──────────────────────────────────────────────────────

  const isStepLocked = (step: Step): boolean => {
    if (step === "story") return !plan;
    if (step === "scenes") return !story;
    if (step === "dialogues") return !scenes;
    if (step === "prompts") return !dialogues;
    if (step === "produce") return !prompts;
    return false;
  };

  const stepLabels: Record<Step, string> = {
    director: "Director",
    story: "Story",
    scenes: "Scenes",
    dialogues: "Dialogue",
    prompts: "Prompts",
    produce: "Produce",
  };

  const stepIcons: Record<Step, React.ReactNode> = {
    director: <Compass className="size-3.5 text-[#A78BFA]" />,
    story: <FileText className="size-3.5 text-[#A78BFA]" />,
    scenes: <Film className="size-3.5 text-[#A78BFA]" />,
    dialogues: <BookOpenText className="size-3.5 text-[#A78BFA]" />,
    prompts: <Sparkles className="size-3.5 text-[#A78BFA]" />,
    produce: <Film className="size-3.5 text-[#A78BFA]" />,
  };

  const stepCompleted: Record<Step, boolean> = {
    director: !!plan,
    story: !!story,
    scenes: !!scenes,
    dialogues: !!dialogues,
    prompts: !!prompts && !!imageResults,
    produce: !!renderResults,
  };

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Header Info */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#27272A] bg-[#111111]/80 backdrop-blur-md p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#7C3AED]/10 px-2.5 py-0.5 text-xs font-medium text-[#A78BFA] border border-[#7C3AED]/20">
              v0.2
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">
              Project Workspace
            </p>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            {project.name}
          </h2>
          <p className="text-sm text-zinc-400">
            Style: <span className="text-zinc-200">{project.style}</span> |
            Lang: <span className="text-zinc-200">{project.language}</span> |
            Platform: <span className="text-zinc-200">{project.platform}</span>
          </p>
        </div>

        {/* Horizontal Navigation Steps */}
        <div className="flex items-center gap-2 rounded-xl border border-[#27272A] bg-[#18181B] p-1.5 self-start md:self-auto">
          {(Object.keys(stepLabels) as Step[]).map((step) => {
            const locked = isStepLocked(step);
            const active = activeStep === step;
            const completed = stepCompleted[step];

            return (
              <button
                key={step}
                disabled={locked}
                onClick={() => setActiveStep(step)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  active
                    ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/20"
                    : locked
                      ? "text-zinc-600 cursor-not-allowed opacity-50"
                      : "text-zinc-400 hover:bg-[#27272A] hover:text-white"
                }`}
              >
                {completed ? (
                  <CheckCircle2 className="size-3.5 text-emerald-400 fill-emerald-400/10" />
                ) : locked ? (
                  <Lock className="size-3.5" />
                ) : (
                  stepIcons[step]
                )}
                <span>{stepLabels[step]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-900/50 bg-rose-950/20 px-4 py-3 text-sm text-rose-400 animate-fadeIn">
          <AlertTriangle className="size-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Workspace Display Content */}
      <div className="flex-1 min-h-[400px]">
        {activeStep === "director" && (
          <DirectorStep
            projectSlug={project.slug}
            plan={plan}
            loading={loading}
            error={error}
            setError={setError}
            onGenerateDirectorPlan={handleGenerateDirectorPlan}
          />
        )}

        {activeStep === "story" && (
          <StoryStep
            projectSlug={project.slug}
            story={story}
            loading={loading}
            error={error}
            setError={setError}
            onGenerateStory={handleGenerateStory}
          />
        )}

        {activeStep === "scenes" && (
          <ScenesStep
            projectSlug={project.slug}
            scenes={scenes}
            loading={loading}
            error={error}
            setError={setError}
            onGenerateScenes={handleGenerateScenes}
          />
        )}

        {activeStep === "dialogues" && (
          <DialoguesStep
            projectSlug={project.slug}
            dialogues={dialogues}
            scenes={scenes}
            loading={loading}
            error={error}
            setError={setError}
            onGenerateDialogues={handleGenerateDialogues}
          />
        )}

        {activeStep === "prompts" && (
          <PromptsStep
            projectSlug={project.slug}
            prompts={prompts}
            scenes={scenes}
            imageResults={imageResults}
            assets={assets}
            loading={loading}
            error={error}
            setError={setError}
            onGeneratePrompts={handleGeneratePrompts}
            onGenerateImages={handleGenerateImages}
            onRegenerateImage={handleRegenerateImage}
            onRefreshPipeline={handleRefreshPipeline}
          />
        )}

        {activeStep === "produce" && (
          <ProduceStep
            projectSlug={project.slug}
            scenes={scenes}
            prompts={prompts}
            imageResults={imageResults}
            renderResults={renderResults}
            voiceResult={voiceResult}
            subtitles={subtitles}
            compositionResult={compositionResult}
            assets={assets}
            loading={loading}
            error={error}
            setError={setError}
            onRenderProject={handleRenderProject}
            onRenderScene={handleRenderScene}
            onGenerateVoice={handleGenerateVoice}
            onGenerateSubtitles={handleGenerateSubtitles}
            onComposeVideo={handleComposeVideo}
            onRefreshPipeline={handleRefreshPipeline}
          />
        )}
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
