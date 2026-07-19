# Backend Guide

Technology

NestJS

Language

TypeScript

---

# Philosophy

Controllers coordinate.

Services orchestrate.

Agents think.

Providers communicate.

Storage persists.

---

# Folder Structure

modules/

common/

config/

---

# Modules

AI

Projects

Characters

Series

Generation

Settings

---

# Controller Rules

Controllers should

Validate DTOs

Call Services

Return Responses

Nothing else

Controllers must never

Call Providers

Use fs

Contain AI prompts

Contain business logic

---

# Service Rules

Services orchestrate workflows.

Services may call multiple agents.

Services should never know provider implementation.

---

# Agent Rules

Each agent solves one problem.

Director Agent

Story Agent

Scene Agent

Dialogue Agent

Prompt Agent

Video Agent

Voice Agent

Subtitle Agent

---

# DTO Rules

DTOs

Validation only.

No business logic.

---

# Error Handling

Use Exceptions.

Never return null.

Never swallow errors.

Always log failures.

---

# Logging

Every request gets

Request ID

Project ID

Provider

Latency

Token Usage

Errors

---

# Response Format

{
  success,
  message,
  data
}

Never return raw objects.