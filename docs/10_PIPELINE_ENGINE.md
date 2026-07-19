# Pipeline Engine

---

# Why Pipelines?

A project generation process contains many independent stages.

Coordinating them inside services quickly becomes unmaintainable.

Pipelines solve orchestration.

---

# Pipeline

Project

↓

Director

↓

Story

↓

Scenes

↓

Dialogue

↓

Prompt Builder

↓

Video

↓

Voice

↓

Subtitle

↓

Exporter

---

# Responsibilities

Pipelines coordinate.

Agents think.

Providers communicate.

Storage persists.

---

# Rules

Pipelines never contain AI prompts.

Pipelines never contain provider logic.

Pipelines only orchestrate execution.

---

# Pipeline State

Pending

Running

Completed

Failed

Cancelled

Future

Paused

---

# Failure Recovery

Scene generation failed

↓

Regenerate scene only

Story remains

Dialogue remains

Video remains

No unnecessary work repeated.

---

# Progress Reporting

Pipelines publish progress.

Frontend receives

Stage

Percentage

Message

Current asset

This enables live progress bars.

---

# Pipeline Events

Project Created

Director Completed

Story Completed

Scenes Completed

Dialogue Completed

Video Completed

Export Completed

Future

Events become WebSocket notifications.

---

# Future Pipelines

Generate Project

Regenerate Story

Regenerate Scene

Translate Project

Dub Project

Export Project

Each pipeline remains independent.