# Decision Log

Version: 1.0

---

# Purpose

Maintain a chronological history of important product and engineering decisions.

Unlike ADRs, this log records the evolution of the project.

---

## 2026-07-19

Initial architecture created.

Monorepo selected.

NestJS selected.

Next.js App Router selected.

---

## 2026-07-20

Provider abstraction introduced.

Pipeline architecture approved.

Director Agent created.

Prompt Builder added as the final v0.1 pre-render stage. Its provider output is schema-validated before it is stored as a project artifact.

Video preparation now uses a dedicated pipeline to create provider-independent scene render plans. External rendering remains deferred until a video provider is selected.

Local FFmpeg fallback rendering added to make the first vertical MP4 reproducible without an external video-generation service. It renders prompt title cards, not AI animation.

---

## Future

Every important decision should be recorded here.

Examples

Storage migration

New provider

New rendering engine

Database introduction

Cloud deployment

Breaking API changes

Architecture refactoring

Major UI redesign

Version milestones
