# Monorepo Guide

---

# Why Monorepo?

Phoenix contains multiple applications.

Instead of many repositories,
everything lives together.

Benefits

Shared Types

Shared Packages

Single Version

Simple Refactoring

Shared Tooling

---

# Structure

apps/

packages/

storage/

docs/

docker/

---

# apps

api

NestJS Backend

web

Next.js Frontend

---

# packages

ai-core

provider interfaces

providers

Gemini/OpenAI implementations

domain

Business models

prompts

Prompt builders

shared

Utilities

config

Shared configuration

---

# Rules

Applications never duplicate logic.

Packages never depend on applications.

Packages should remain reusable.

Business logic belongs inside packages whenever possible.

---

# Import Rules

GOOD

@phoenix/domain

@phoenix/providers

@phoenix/prompts

BAD

../../../../../../

Relative imports across packages.

---

# Package Ownership

Each package has one responsibility.

No package should solve multiple problems.

---

# Versioning

Workspace protocol only.

workspace:*