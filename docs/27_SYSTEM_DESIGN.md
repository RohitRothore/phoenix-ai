# System Design

Version: 1.0

---

# Purpose

This document describes the overall system architecture of Phoenix AI Studio.

It explains how every component interacts with every other component.

This document should remain stable even when implementation changes.

---

# System Overview

                    Phoenix AI Studio

                         User
                           │
                           ▼
                  Next.js Studio (Frontend)
                           │
                           ▼
                    REST API (NestJS)
                           │
                           ▼
                Generation Pipeline Engine
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
 Director Agent      Story Agent       Scene Agent
        ▼                  ▼                  ▼
 Dialogue Agent     Prompt Agent      Review Agent
                           │
                           ▼
                  Provider Registry
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     Gemini         OpenAI         Ollama
                           │
                           ▼
                   Storage Service
                           │
                           ▼
               Local Project File System

---

# System Layers

Presentation Layer

↓

Application Layer

↓

Pipeline Layer

↓

Agent Layer

↓

Provider Layer

↓

Storage Layer

↓

Infrastructure

---

# Data Flow

User

↓

Project

↓

Director Plan

↓

Story

↓

Scenes

↓

Dialogues

↓

Prompts

↓

Video

↓

Voice

↓

Subtitles

↓

Export

---

# Request Lifecycle

Client

↓

API

↓

DTO Validation

↓

Service

↓

Pipeline

↓

Agent

↓

Provider

↓

AI Response

↓

Validation

↓

Storage

↓

Response

---

# Component Responsibilities

Frontend

User Interface

Backend

Business Logic

Pipeline

Workflow

Agents

Reasoning

Providers

AI Communication

Storage

Persistence

---

# Failure Recovery

Every stage is recoverable.

Story failure

↓

Retry Story

Scene failure

↓

Retry Scene

Video failure

↓

Retry Video

No previous work should be lost.

---

# Future Architecture

WebSockets

Background Workers

GPU Rendering

Cloud Storage

Distributed Rendering

Plugin System

Multi-user Workspaces