# AI_CONTEXT.md

# Phoenix AI Studio

Version: 1.0

---

# Mission

Phoenix AI Studio is a local-first AI creative platform that generates
high-quality Hindi comedy videos for YouTube Shorts, Instagram Reels,
Facebook Reels, and other short-form video platforms.

Phoenix is NOT an AI chatbot.

Phoenix is NOT a prompt playground.

Phoenix behaves like a professional movie studio.

The user acts as the Director.

The software acts as the Production Team.

---

# Product Vision

A creator should be able to create an entire animated comedy video by creating
a Project and moving through a structured creative workflow.

The application should produce

• Consistent Characters

• Strong Comedy

• Cinematic Scenes

• High Quality Video

• Natural Voice

• Professional Subtitles

• Production Ready Export

---

# Current Development Phase

Current Version

v0.1

Current Sprint

Project System

Current Goal

Build the first complete vertical slice.

Studio

↓

Create Project

↓

Director Plan

↓

Story

↓

Scene

↓

Video

↓

Export

---

# Tech Stack

Frontend

Next.js 16

React 19

TypeScript

TailwindCSS

shadcn/ui

Backend

NestJS

TypeScript

Workspace

TurboRepo

pnpm

Storage

Local JSON

AI Providers

Gemini

Future

OpenAI

Claude

Groq

OpenRouter

Ollama

DeepSeek

---

# Project Philosophy

Phoenix is built around

Projects

↓

Pipelines

↓

Agents

↓

Providers

↓

Storage

Every generated asset belongs to exactly one project.

Nothing exists outside a project.

---

# Core Architecture

Presentation Layer

↓

Application Layer

↓

Generation Pipeline

↓

Agents

↓

Provider Registry

↓

Providers

↓

Storage Service

↓

Filesystem

Dependencies always point downward.

Never reverse dependencies.

---

# AI Workflow

Project

↓

Director Plan

↓

Story

↓

Scene Planner

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

Export

Every stage should be independently regeneratable.

---

# Engineering Principles

Controllers are thin.

Services orchestrate.

Pipelines coordinate.

Agents think.

Providers communicate.

Storage persists.

Never mix responsibilities.

---

# Folder Structure

apps/

api/

web/

packages/

ai-core/

providers/

domain/

prompts/

shared/

storage/

projects/

docs/

---

# Local Storage

Every project is stored independently.

storage/

projects/

project-id/

project.json

director.json

story.json

scenes.json

dialogues.json

video/

audio/

subtitles/

exports/

metadata.json

---

# AI Rules

Never call AI providers directly.

Always use ProviderRegistry.

Never write prompts inside services.

Prompts belong in packages/prompts.

Every AI output must be JSON.

Every AI output must be validated.

Every AI output must be reproducible.

---

# Storage Rules

Never use fs directly.

Always use StorageService.

Never hardcode file paths.

Never bypass StorageService.

---

# Backend Rules

NestJS only.

Controllers

↓

Services

↓

Pipelines

↓

Agents

↓

Providers

↓

Storage

Controllers never contain

Business Logic

Prompt Logic

Filesystem

Provider Calls

---

# Frontend Rules

Use App Router.

Prefer Server Components.

Client Components only for interaction.

Never call fetch directly.

Always use Service Layer.

Forms use

React Hook Form

+

Zod

---

# TypeScript Rules

Strict Mode.

Never use any.

Always define return types.

Prefer interfaces.

Prefer generics.

Validate external data.

---

# UI Philosophy

Phoenix is a Creative Studio.

Not an Admin Dashboard.

The interface should feel similar to

Adobe Premiere

CapCut

DaVinci Resolve

Cursor

Linear

Notion

Dark mode first.

Minimal.

Fast.

Professional.

---

# Coding Principles

SOLID

DRY

KISS

YAGNI

Composition over inheritance.

Readable code over clever code.

Maintainability over speed.

---

# Testing Principles

Every feature should be testable.

Every bug requires a regression test.

Never call paid AI providers in automated tests.

Mock external services.

---

# Security Principles

Never commit secrets.

Never commit .env.

Never expose API Keys.

Never trust AI output.

Validate every request.

Validate every response.

---

# Performance Principles

Measure first.

Optimize later.

Generate scenes independently.

Parallelize where possible.

Cache expensive operations.

---

# Non-Negotiable Rules

Never break architecture.

Never bypass ProviderRegistry.

Never bypass StorageService.

Never duplicate business logic.

Never mix UI with AI logic.

Never write prompts inside controllers.

Never use process.env outside ConfigService.

Never disable TypeScript strict mode.

Never introduce circular dependencies.

Never add dependencies without justification.

---

# Development Workflow

Before writing code

1. Read AI_CONTEXT.md

2. Read relevant docs/

3. Read existing implementation.

4. Understand architecture.

5. Explain implementation plan.

6. Keep changes minimal.

7. Preserve backward compatibility.

8. Update documentation if architecture changes.

---

# Current Priorities

1. Project Management

2. Director Agent

3. Story Agent

4. Scene Planner

5. Video Generation

6. Voice Generation

7. Subtitle Engine

8. Export Engine

---

# Long-Term Vision

Phoenix should become the world's best AI-powered creative studio for producing
consistent animated comedy content.

The architecture should support

Multiple AI Providers

Multiple Rendering Engines

Plugin System

Cloud Sync

Team Collaboration

GPU Rendering

Desktop Application

Mobile Companion

Marketplace

Public API

without major architectural changes.

---

# Definition of Done

A feature is complete only if

✓ Compiles

✓ Type Safe

✓ Tested

✓ Documented

✓ Uses Existing Architecture

✓ No Dead Code

✓ No Duplicated Logic

✓ Follows Coding Standards

✓ Ready for Production

---

# AI Assistant Instructions

You are not just writing code.

You are acting as a Senior Staff Engineer responsible for maintaining the
architecture of Phoenix AI Studio.

Prioritize

Correctness

Maintainability

Scalability

Developer Experience

over speed.

If a requested implementation conflicts with the documented architecture,
explain the conflict and propose a solution instead of silently violating the
architecture.

Always leave the codebase better than you found it.