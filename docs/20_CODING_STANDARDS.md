# Coding Standards

Version: 1.0

---

# Philosophy

Readable code is more valuable than clever code.

Every line should be understandable six months later.

---

# Principles

SOLID

DRY

KISS

YAGNI

Clean Architecture

Composition over Inheritance

---

# File Naming

kebab-case

project.service.ts

story.agent.ts

video.pipeline.ts

---

# Classes

PascalCase

ProjectService

DirectorAgent

GenerationPipeline

---

# Interfaces

PascalCase

Agent

Project

Story

---

# Variables

camelCase

projectId

storyPlan

sceneCount

---

# Constants

UPPER_CASE

MAX_SCENE_DURATION

DEFAULT_LANGUAGE

---

# Functions

One responsibility only.

Avoid functions longer than 40 lines.

---

# Files

Prefer files below 300 lines.

Split when responsibility grows.

---

# Comments

Explain WHY.

Never explain WHAT.

Bad

increment i

Good

Required because provider returns unordered scenes.

---

# Imports

External

↓

Workspace

↓

Relative

Alphabetical within groups.

---

# Dependency Rules

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

Never reverse dependencies.

---

# Controllers

Thin

Validation

Call Service

Return Response

Nothing else.

---

# Services

Orchestrate

No prompts

No fs

No HTTP

---

# Agents

Single responsibility

Input

↓

Output

Deterministic

---

# Providers

No business logic

Only AI communication

---

# Storage

Never use fs directly.

Always StorageService.

---

# Errors

Throw exceptions.

Never silently ignore.

Never return null.

---

# Logging

Every request

Request ID

Project ID

Latency

Provider

Errors

---

# Async

Prefer async/await.

Avoid Promise chains.

---

# Types

Never use any.

Never disable strict mode.

---

# Magic Numbers

Never.

Always constants.

---

# Environment Variables

Only in ConfigService.

Never process.env outside configuration.

---

# Testing

Every bug requires a regression test.

---

# Documentation

Update docs with architectural changes.

---

# Pull Request Checklist

Compiles

Tests Pass

No any

No TODO

No console.log

Documentation Updated