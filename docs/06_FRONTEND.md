# Frontend

## Overview

The Phoenix AI frontend is built with **Next.js 14** (App Router), **React**, **TypeScript**, and **Tailwind CSS**. It provides a Studio UI for project management and pipeline orchestration.

## Project Structure

```
apps/web/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Dashboard page
│   ├── projects/
│   │   ├── page.tsx            # Projects list page
│   │   └── [slug]/
│   │       └── page.tsx        # Project workspace page
│   ├── dashboard/
│   ├── characters/
│   ├── series/
│   └── settings/
├── components/
│   ├── layout/                 # Layout components
│   ├── studio/                 # Studio components
│   │   └── create-project-dialog.tsx
│   └── ui/                     # UI components (shadcn/ui)
├── features/
│   └── projects/
│       ├── components/
│       │   ├── ProjectWorkspace.tsx  # Main workspace component
│       │   ├── ProjectCard.tsx
│       │   ├── ProjectForm.tsx
│       │   └── NewProjectDialog.tsx
│       └── services/
│           └── project.service.ts    # API client + types
├── lib/
│   ├── api/                    # API client utilities
│   ├── types/                  # Shared types
│   ├── utils.ts
│   └── cn.ts                   # Tailwind class utility
├── public/                     # Static assets
└── styles/                     # Global CSS
```

## ProjectWorkspace Component

The `ProjectWorkspace` component is the main UI for pipeline orchestration. It displays a horizontal navigation bar with all pipeline steps and a content area for each step.

### Steps

| Step | Description |
|------|-------------|
| Director | Director AI plan (genre, tone, pacing, visual style) |
| Story | Story AI output (plot, characters, acts) |
| Scenes | Scene breakdown (visual prompts, durations) |
| Dialogue | Character-specific dialogue |
| Prompts | Render-ready prompts (camera, lighting, mood) |
| AI Images | AI-generated images per scene (provider, status, regenerate, download) |
| Render | Scene rendering (video clips, pipeline status, logs) |
| Video | Legacy video render plan (Phase 1 fallback) |

### AI Images Step

The "AI Images" step displays:
- **Prompt** for each scene
- **Generated image** (thumbnail)
- **Provider** name (Mock, Gemini, OpenAI, Pollinations)
- **Generation status** (pending, generating, ready, failed)
- **Regenerate** button (per scene)
- **Download** button (per scene)
- **Render Scene** button (per scene)
- **Model** name
- **Seed** value
- **Resolution** (width × height)
- **Generation time** (ms)

### Render Step

The "Render" step displays:
- **Render All Scenes** button
- **Pipeline status** (all stages with status badges)
- **Refresh** button
- **Rendered video clips** (video player per scene)
- **Video metadata** (duration, resolution, FPS, provider)
- **Re-render** button (per scene)

### API Client

The `project.service.ts` file provides typed API functions for all endpoints:

```typescript
// Project management
createProject(input)
listProjects()
getProject(slug)

// AI pipeline
generateDirectorPlan(slug)
generateStory(slug)
generateScenes(slug)
generateDialogues(slug)
generatePrompts(slug)

// Image generation
generateImages(slug)
regenerateImage(slug, sceneId)
getAssets(slug, type?)

// Scene rendering
renderScene(slug, sceneId)
renderProject(slug)

// Pipeline status
getPipelineStatus(slug)
retryStage(slug, stage)
resumePipeline(slug, stage)

// Export
exportVideo(slug)
```

## UI Components

### Studio Navigation

The workspace uses a horizontal navigation bar with step buttons. Each button shows:
- Step icon (Sparkles, Film, Compass, etc.)
- Step label
- Status indicator (completed checkmark, lock, or icon)

### Step Locking

Steps are locked until their prerequisite is complete:
- Story requires Director plan
- Scenes requires Story
- Dialogues requires Scenes
- Prompts requires Dialogues
- AI Images requires Prompts
- Render requires Prompts

### Error Handling

Errors are displayed as a banner at the top of the workspace with:
- Error icon (AlertTriangle)
- Error message text

### Loading States

Each step has a loading state that shows:
- Spinner (Loader2 icon)
- Loading text (e.g., "Generating Images...")

## Styling

- **Color scheme**: Dark theme with purple accent (#7C3AED)
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library
- **Responsive**: Grid layout for desktop, stacked for mobile
