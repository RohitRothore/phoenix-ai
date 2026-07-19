# Phoenix AI Studio Architecture

Version: 1.0

---

# Overview

Phoenix AI Studio is a modular, local-first AI creative platform designed to
generate high-quality short-form comedy videos.

The architecture follows four principles:

1. Modular
2. Provider Independent
3. Pipeline Driven
4. Local First

---

# High Level Architecture

                    Next.js Studio
                           │
                           ▼
                     REST API (NestJS)
                           │
                           ▼
                  Generation Pipeline
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
 Director Agent      Story Agent        Scene Agent
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                    Provider Registry
                           │
        ┌───────────────┬──────────────┬─────────────┐
        ▼               ▼              ▼
      Gemini         OpenAI         Ollama

                           ▼
                     Project Storage

---

# Core Layers

Presentation

Next.js

↓

Application

NestJS Modules

↓

Domain

Business Models

↓

AI

Agents + Pipelines

↓

Providers

Gemini/OpenAI/Claude

↓

Storage

Local JSON

---

# Principles

Controllers are thin.

Business logic belongs inside services.

AI logic belongs inside agents.

Provider-specific code belongs inside Providers.

Storage is abstracted.

Every layer depends only on abstractions.

---

# Dependency Rule

Frontend

↓

Backend API

↓

Application Layer

↓

Domain

↓

Providers

↓

Infrastructure

Dependencies always point inward.

Never the opposite.

---

# Generation Pipeline

Project

↓

Director

↓

Story

↓

Scene Planner

↓

Dialogue

↓

Prompt Builder

↓

Video Generator

↓

Voice Generator

↓

Subtitle Generator

↓

Exporter

Each stage receives structured data and produces structured data.

---

# Storage Model

Every project is stored independently.

storage/

projects/

project-name/

project.json

director.json

story.json

scenes.json

dialogues.json

assets/

audio/

video/

exports/

---

# AI Philosophy

Never generate everything at once.

Every stage must be independently regeneratable.

Every AI response must be validated.

Every response must be logged.

Every response must be reproducible.