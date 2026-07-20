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
  Clock,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  generateDirectorPlan,
  generateStory,
  generateScenes,
  generateDialogues,
  generatePrompts,
  prepareVideo,
  getDirectorPlan,
  getStory,
  getScenes,
  getDialogues,
  getPrompts,
  getVideoPlan,
  type Project,
  type DirectorPlan,
  type Story,
  type Scenes,
  type Dialogues,
  type Prompts,
  type VideoPlan,
} from "@/features/projects/services/project.service";

type ProjectWorkspaceProps = {
  project: Project;
};

type Step = "director" | "story" | "scenes" | "dialogues" | "prompts" | "video";

export function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const [activeStep, setActiveStep] = useState<Step>("director");
  const [loading, setLoading] = useState<Record<Step, boolean>>({
    director: false,
    story: false,
    scenes: false,
    dialogues: false,
    prompts: false,
    video: false,
  });

  const [plan, setPlan] = useState<DirectorPlan | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [scenes, setScenes] = useState<Scenes | null>(null);
  const [dialogues, setDialogues] = useState<Dialogues | null>(null);
  const [prompts, setPrompts] = useState<Prompts | null>(null);
  const [videoPlan, setVideoPlan] = useState<VideoPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing plan, story, scenes, dialogues on mount
  useEffect(() => {
    const loadWorkspace = async () => {
      setError(null);
      try {
        const planRes = await getDirectorPlan(project.slug);
        if (planRes.data && planRes.data.status === "ready") {
          setPlan(planRes.data);
        }

        const storyRes = await getStory(project.slug);
        if (storyRes.data && storyRes.data.status === "ready") {
          setStory(storyRes.data);
        }

        const scenesRes = await getScenes(project.slug);
        if (scenesRes.data && scenesRes.data.status === "ready") {
          setScenes(scenesRes.data);
        }

        const dialoguesRes = await getDialogues(project.slug);
        if (dialoguesRes.data && dialoguesRes.data.status === "ready") {
          setDialogues(dialoguesRes.data);
        }

        const promptsRes = await getPrompts(project.slug);
        if (promptsRes.data && promptsRes.data.status === "ready") {
          setPrompts(promptsRes.data);
        }

        const videoRes = await getVideoPlan(project.slug);
        if (videoRes.data && videoRes.data.status === "ready") {
          setVideoPlan(videoRes.data);
        }
      } catch (err) {
        console.error("Error loading project workspace data:", err);
      }
    };
    void loadWorkspace();
  }, [project.slug]);

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

  const handlePrepareVideo = async () => {
    setLoading((prev) => ({ ...prev, video: true }));
    setError(null);
    try {
      const response = await prepareVideo(project.slug);
      setVideoPlan(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to prepare video rendering."));
    } finally {
      setLoading((prev) => ({ ...prev, video: false }));
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

  const isStepLocked = (step: Step): boolean => {
    if (step === "story") return !plan;
    if (step === "scenes") return !story;
    if (step === "dialogues") return !scenes;
    if (step === "prompts") return !dialogues;
    if (step === "video") return !prompts;
    return false;
  };

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Header Info */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#27272A] bg-[#111111]/80 backdrop-blur-md p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#7C3AED]/10 px-2.5 py-0.5 text-xs font-medium text-[#A78BFA] border border-[#7C3AED]/20">
              v0.1 Slice
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-semibold">
              Project Workspace
            </p>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            {project.name}
          </h2>
          <p className="text-sm text-zinc-400">
            Style: <span className="text-zinc-200">{project.style}</span> | Lang:{" "}
            <span className="text-zinc-200">{project.language}</span> | Platform:{" "}
            <span className="text-zinc-200">{project.platform}</span>
          </p>
        </div>

        {/* Horizontal Navigation Steps */}
        <div className="flex items-center gap-2 rounded-xl border border-[#27272A] bg-[#18181B] p-1.5 self-start md:self-auto">
          {(["director", "story", "scenes", "dialogues", "prompts", "video"] as Step[]).map((step) => {
            const locked = isStepLocked(step);
            const active = activeStep === step;
            const completed =
              (step === "director" && !!plan) ||
              (step === "story" && !!story) ||
              (step === "scenes" && !!scenes) ||
              (step === "dialogues" && !!dialogues) ||
              (step === "prompts" && !!prompts) ||
              (step === "video" && !!videoPlan);

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
                  <Sparkles className="size-3.5 text-[#A78BFA]" />
                )}
                <span>
                  {step === "director"
                    ? "Director"
                    : step === "story"
                    ? "Story"
                    : step === "scenes"
                    ? "Scenes"
                    : step === "dialogues"
                    ? "Dialogue"
                    : step === "prompts"
                    ? "Prompts"
                    : "Video"}
                </span>
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
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Info Panel */}
            <div className="space-y-6 md:col-span-1">
              <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Compass className="size-5 text-[#A78BFA]" />
                  <h3 className="text-lg font-bold text-white">Director Plan</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  The Director AI analyzes your project topic, humor style, and target platform to establish creative boundaries, comedic tone, pacing, and visual look.
                </p>
                {!plan ? (
                  <Button
                    onClick={handleGenerateDirectorPlan}
                    className="w-full bg-[#7C3AED] text-white hover:bg-[#6d28d9] font-semibold py-5 transition-all active:scale-[0.98]"
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
                    onClick={handleGenerateDirectorPlan}
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

            {/* Right Display Panel */}
            <div className="md:col-span-2">
              {plan ? (
                <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-6 space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1.5 p-4 rounded-xl bg-[#18181B] border border-[#27272A]/50">
                      <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Genre</p>
                      <p className="text-lg font-bold text-white">{plan.genre}</p>
                    </div>
                    <div className="space-y-1.5 p-4 rounded-xl bg-[#18181B] border border-[#27272A]/50">
                      <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Target Audience</p>
                      <p className="text-lg font-bold text-white">{plan.targetAudience}</p>
                    </div>
                    <div className="space-y-1.5 p-4 rounded-xl bg-[#18181B] border border-[#27272A]/50">
                      <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Tone</p>
                      <p className="text-lg font-bold text-white">{plan.tone}</p>
                    </div>
                    <div className="space-y-1.5 p-4 rounded-xl bg-[#18181B] border border-[#27272A]/50">
                      <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Pacing</p>
                      <p className="text-lg font-bold text-white">{plan.pacing}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Story Structure</h4>
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
                    <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Visual Style</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{plan.visualStyle}</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Comedic Mechanics</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {plan.comedyMechanics.map((mech, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 rounded-lg bg-[#18181B]/50 px-3.5 py-2.5 text-sm text-zinc-300 border border-[#27272A]/40">
                          <span className="size-1.5 rounded-full bg-[#A78BFA]" />
                          <span>{mech}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 p-4 rounded-xl bg-[#18181B] border border-[#27272A]/50">
                    <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Content Constraints & Guidelines</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{plan.contentGuidelines}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center h-full min-h-[300px]">
                  <Compass className="size-12 text-zinc-600 mb-4 stroke-1 animate-pulse" />
                  <h3 className="text-lg font-bold text-zinc-300 mb-1">Director Plan Required</h3>
                  <p className="text-sm text-zinc-500 max-w-sm">
                    Generate the director plan first to lay the foundation of the storytelling guidelines.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeStep === "story" && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Info Panel */}
            <div className="space-y-6 md:col-span-1">
              <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <FileText className="size-5 text-[#A78BFA]" />
                  <h3 className="text-lg font-bold text-white">Story Writer</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  The Story AI reads the Director Plan constraints and writes a structured storyline complete with attention hook, character definitions, premise, summary, and funny punchlines.
                </p>
                {!story ? (
                  <Button
                    onClick={handleGenerateStory}
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
                    onClick={handleGenerateStory}
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

            {/* Right Display Panel */}
            <div className="md:col-span-2">
              {story ? (
                <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-6 space-y-6">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#A78BFA] font-bold">Script Title</span>
                    <h3 className="text-2xl font-black text-white mt-1">{story.title}</h3>
                  </div>

                  <div className="space-y-1.5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <p className="text-xs uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                      <Sparkles className="size-3.5" /> Core Comedy Hook (0-3s)
                    </p>
                    <p className="text-base font-medium text-white italic leading-relaxed">
                      &quot;{story.hook}&quot;
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Premise</p>
                      <p className="text-sm text-zinc-300 leading-relaxed mt-1">{story.premise}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Story Summary</p>
                      <p className="text-sm text-zinc-300 leading-relaxed mt-1">{story.summary}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Key Comedic Twist / Payoff</p>
                      <p className="text-sm text-zinc-300 leading-relaxed mt-1">{story.ending}</p>
                    </div>
                  </div>

                  {/* Character Cast */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Character Cast</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {story.characters.map((char, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2">
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

                  {/* Story Acts */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Acts Flow</h4>
                    <div className="space-y-3">
                      {story.acts.map((act, idx) => (
                        <div key={idx} className="flex gap-4 p-4 rounded-xl bg-[#18181B]/40 border border-[#27272A]/50">
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
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center h-full min-h-[300px]">
                  <FileText className="size-12 text-zinc-600 mb-4 stroke-1" />
                  <h3 className="text-lg font-bold text-zinc-300 mb-1">Story Plan Pending</h3>
                  <p className="text-sm text-zinc-500 max-w-sm">
                    Generate the story next to map characters, dialogue cues, and act structures.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeStep === "scenes" && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Info Panel */}
            <div className="space-y-6 md:col-span-1">
              <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Film className="size-5 text-[#A78BFA]" />
                  <h3 className="text-lg font-bold text-white">Scene Planner</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  The Scene Planner takes the completed story acts and maps them into filmable visual segments. Each scene is complete with length, precise visual prompts for AI rendering, dialogue audio cues, and comedy beats.
                </p>
                {!scenes ? (
                  <Button
                    onClick={handleGenerateScenes}
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
                    onClick={handleGenerateScenes}
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

            {/* Right Display Panel */}
            <div className="md:col-span-2">
              {scenes ? (
                <div className="space-y-4">
                  {scenes.scenes.map((scene) => (
                    <div
                      key={scene.id}
                      className="rounded-2xl border border-[#27272A] bg-[#111111] p-5 space-y-4 shadow-md"
                    >
                      {/* Top bar info */}
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

                      {/* Scene descriptions */}
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Visual Action Description</span>
                          <p className="text-sm text-zinc-300 leading-relaxed">
                            {scene.description}
                          </p>
                        </div>

                        {scene.dialogue && (
                          <div className="space-y-1 p-3 rounded-lg bg-[#18181B] border border-[#27272A]/60 font-serif">
                            <span className="text-[10px] uppercase tracking-widest text-[#A78BFA] font-bold block mb-1">Dialogue / Narration</span>
                            <p className="text-sm text-white italic leading-relaxed">
                              {scene.dialogue}
                            </p>
                          </div>
                        )}

                        <div className="space-y-1 p-3 rounded-lg bg-[#0a0a0b] border border-[#27272A]/40">
                          <span className="text-[10px] uppercase tracking-widest text-[#7C3AED] font-bold block mb-1">AI Video Generation Prompt</span>
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
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center h-full min-h-[300px]">
                  <Film className="size-12 text-zinc-600 mb-4 stroke-1 animate-pulse" />
                  <h3 className="text-lg font-bold text-zinc-300 mb-1">Scenes Pending</h3>
                  <p className="text-sm text-zinc-500 max-w-sm">
                    Plan scenes to generate exact prompt specifications for rendering videos.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeStep === "dialogues" && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Info Panel */}
            <div className="space-y-6 md:col-span-1">
              <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <BookOpenText className="size-5 text-[#A78BFA]" />
                  <h3 className="text-lg font-bold text-white">Dialogue Writer</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  The Dialogue AI writes natural, character-specific dialogue for every scene. Each character gets a distinct voice, emotion, and comedic timing.
                </p>
                {!dialogues ? (
                  <Button
                    onClick={handleGenerateDialogues}
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
                    onClick={handleGenerateDialogues}
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

            {/* Right Display Panel */}
            <div className="md:col-span-2">
              {dialogues ? (
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
                                <p className="text-sm text-white leading-relaxed">
                                  {line.text}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center h-full min-h-[300px]">
                  <BookOpenText className="size-12 text-zinc-600 mb-4 stroke-1 animate-pulse" />
                  <h3 className="text-lg font-bold text-zinc-300 mb-1">Dialogues Pending</h3>
                  <p className="text-sm text-zinc-500 max-w-sm">
                    Generate scenes first, then write character dialogue for each scene.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeStep === "prompts" && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-6 md:col-span-1">
              <div className="space-y-4 rounded-2xl border border-[#27272A] bg-[#111111] p-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="size-5 text-[#A78BFA]" />
                  <h3 className="text-lg font-bold text-white">Prompt Builder</h3>
                </div>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Finalize each scene into a render-ready prompt with camera, lighting, mood, and visual exclusions.
                </p>
                <Button
                  onClick={handleGeneratePrompts}
                  className={prompts ? "w-full border-[#27272A] py-5 font-semibold text-zinc-300 hover:bg-[#1c1c1f]" : "w-full bg-[#7C3AED] py-5 font-semibold text-white hover:bg-[#6d28d9]"}
                  disabled={loading.prompts}
                  variant={prompts ? "outline" : "default"}
                >
                  {loading.prompts ? <><Loader2 className="mr-2 size-4 animate-spin" />Building Prompts...</> : <><Sparkles className="mr-2 size-4" />{prompts ? "Regenerate Prompts" : "Build Render Prompts"}</>}
                </Button>
              </div>
            </div>

            <div className="md:col-span-2">
              {prompts ? (
                <div className="space-y-4">
                  {prompts.scenes.map((scene) => (
                    <article key={scene.id} className="space-y-4 rounded-2xl border border-[#27272A] bg-[#111111] p-5">
                      <div className="flex items-center gap-3 border-b border-[#27272A]/50 pb-3">
                        <span className="flex size-7 items-center justify-center rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/10 text-xs font-bold text-[#A78BFA]">#{scene.id}</span>
                        <h4 className="font-bold text-white">{scenes?.scenes.find((item) => item.id === scene.id)?.title ?? `Scene ${scene.id}`}</h4>
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
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center">
                  <Sparkles className="mb-4 size-12 animate-pulse text-zinc-600 stroke-1" />
                  <h3 className="mb-1 text-lg font-bold text-zinc-300">Render Prompts Pending</h3>
                  <p className="max-w-sm text-sm text-zinc-500">Generate dialogue first, then finalize the visual direction for every scene.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeStep === "video" && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-6 md:col-span-1">
              <div className="space-y-4 rounded-2xl border border-[#27272A] bg-[#111111] p-6">
                <div className="flex items-center gap-3">
                  <Film className="size-5 text-[#A78BFA]" />
                  <h3 className="text-lg font-bold text-white">Video Render Plan</h3>
                </div>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Create independently renderable scene jobs from the approved prompts. A video provider will execute these jobs in the next milestone.
                </p>
                <Button onClick={handlePrepareVideo} className={videoPlan ? "w-full border-[#27272A] py-5 font-semibold text-zinc-300 hover:bg-[#1c1c1f]" : "w-full bg-[#7C3AED] py-5 font-semibold text-white hover:bg-[#6d28d9]"} disabled={loading.video} variant={videoPlan ? "outline" : "default"}>
                  {loading.video ? <><Loader2 className="mr-2 size-4 animate-spin" />Preparing Jobs...</> : <><Film className="mr-2 size-4" />{videoPlan ? "Rebuild Render Plan" : "Prepare Video Jobs"}</>}
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              {videoPlan ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#27272A] bg-[#18181B] px-4 py-3 text-sm text-zinc-400">{videoPlan.resolution} · {videoPlan.frameRate} FPS · {videoPlan.scenes.length} scene jobs pending render</div>
                  {videoPlan.scenes.map((scene) => (
                    <article key={scene.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[#27272A] bg-[#111111] p-5">
                      <div>
                        <p className="font-bold text-white">Scene {scene.id}</p>
                        <p className="mt-1 text-xs text-zinc-500">{scene.duration}s · {scene.camera} · {scene.lighting}</p>
                      </div>
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">{scene.status}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#27272A] bg-[#111111]/30 p-12 text-center">
                  <Film className="mb-4 size-12 animate-pulse text-zinc-600 stroke-1" />
                  <h3 className="mb-1 text-lg font-bold text-zinc-300">Video Jobs Pending</h3>
                  <p className="max-w-sm text-sm text-zinc-500">Approve render prompts to prepare scene jobs for a future video provider.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PromptField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-lg border border-[#27272A]/40 bg-[#0a0a0b] p-3">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-[#7C3AED]">{label}</span>
      <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-400">{value}</p>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
