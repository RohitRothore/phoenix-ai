# Architecture Decision Records (ADR)

## ADR-001: MongoDB as Primary Database

**Status**: Accepted

**Context**: The project needs a database to store project metadata, pipeline state, and asset references. Options include MongoDB, PostgreSQL, and JSON files.

**Decision**: Use MongoDB as the primary database. Only binary assets (images, videos, audio) are stored on disk.

**Consequences**:
- MongoDB's flexible schema allows easy extension for new asset types.
- No need for complex migrations when adding new fields.
- Asset documents can reference disk paths without duplicating metadata.
- The schema is compatible with future video generation (Phase 2).

## ADR-002: Provider Abstraction Pattern

**Status**: Accepted

**Context**: The project needs to support multiple AI providers (Gemini, OpenAI, Pollinations, Mock) without hardcoding any specific provider.

**Decision**: Use a Provider Registry pattern with a common `ImageProvider` interface. Providers are registered at runtime based on API key availability.

**Consequences**:
- No provider is hardcoded.
- New providers can be added without changing existing code.
- Mock mode is always available when no API key is set.
- Phase 2 can introduce a `VideoProvider` without changing the pipeline.

## ADR-003: Phase 1 = AI Images, Phase 2 = AI Videos

**Status**: Accepted

**Context**: AI video generation APIs are expensive and rate-limited. The project needs a way to produce videos without paid APIs.

**Decision**: In Phase 1, generate AI images and animate them with FFmpeg. In Phase 2, replace the ImageProvider with a VideoProvider. The remaining pipeline stays the same.

**Consequences**:
- The full pipeline is runnable without paid APIs (Mock mode).
- Phase 2 requires minimal changes (swap provider, bypass scene renderer).
- The Asset schema is compatible with both image and video assets.
- The pipeline state tracks image-generation and scene-rendering as separate stages.

## ADR-004: Asset-Centric Storage

**Status**: Accepted

**Context**: The project generates multiple types of assets (images, videos, audio, subtitles, exports). Each asset needs metadata stored in MongoDB and binary data on disk.

**Decision**: Use a unified `Asset` document schema with a `type` field (IMAGE, VIDEO, AUDIO, SUBTITLE, EXPORT). Each asset references a disk path.

**Consequences**:
- All asset types share the same schema, making queries simple.
- Phase 2 can add VIDEO assets from the VideoProvider without schema changes.
- Asset lifecycle (create, update, delete) is consistent across types.
- Asset metadata includes provider, model, generation time, seed, etc.

## ADR-005: Pipeline State Management

**Status**: Accepted

**Context**: The pipeline has multiple stages that need status tracking, timestamps, logs, retry, and resume support.

**Decision**: Use a `PipelineState` document per (project, stage) pair. Each document tracks status, timestamps, retry count, error messages, and execution logs.

**Consequences**:
- Every stage has a well-defined status (pending, queued, running, completed, failed, cancelled).
- Failed stages can be retried or resumed.
- Execution logs provide full auditability.
- The pipeline status API returns all stages, jobs, and assets in a single response.

## ADR-006: FFmpeg for Scene Rendering

**Status**: Accepted

**Context**: AI images need to be animated into video clips. Options include FFmpeg, OpenCV, and cloud-based video processing.

**Decision**: Use FFmpeg for scene rendering. FFmpeg is installed locally and provides full control over camera movements, transitions, and output format.

**Consequences**:
- No dependency on external video processing services.
- Full control over camera movements (zoom, pan, fade).
- FFmpeg is widely available and well-documented.
- Phase 2 can bypass FFmpeg when the VideoProvider generates clips directly.

## ADR-007: NestJS for Backend

**Status**: Accepted

**Context**: The backend needs a framework that supports dependency injection, modular architecture, and REST API.

**Decision**: Use NestJS with TypeScript. NestJS provides dependency injection, modular architecture, and excellent TypeScript support.

**Consequences**:
- Services are loosely coupled and easily testable.
- Modules can be imported/exported as needed.
- NestJS exception filters provide consistent error handling.
- The architecture is enterprise-grade and scalable.

## ADR-008: Next.js for Frontend

**Status**: Accepted

**Context**: The frontend needs a modern React framework with server-side rendering, routing, and API integration.

**Decision**: Use Next.js 14 with the App Router. Next.js provides file-based routing, server components, and excellent developer experience.

**Consequences**:
- The Studio UI is a single-page application with smooth navigation.
- API integration is straightforward with fetch/axios.
- The UI is responsive and works on desktop and mobile.
- TypeScript provides type safety across the frontend.
