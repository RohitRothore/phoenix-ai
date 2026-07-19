# GitHub Copilot Instructions

Phoenix AI Studio follows Clean Architecture.

Always generate code that follows existing project patterns.

---

Prefer

NestJS

Next.js App Router

TypeScript

React Hook Form

Zod

Provider Pattern

Pipeline Pattern

Repository Pattern (future)

---

Never

Use any

Disable strict mode

Hardcode prompts

Hardcode providers

Access filesystem directly

Call Gemini directly

Mix UI with business logic

---

Controllers

Validate

Call services

Return ApiResponse<T>

Nothing else.

---

Services

Coordinate workflows.

No provider code.

No prompt code.

---

Agents

Single responsibility.

Input

↓

Output

Structured JSON.

---

Providers

Only communicate with AI models.

Never business logic.

---

Storage

Use StorageService.

Never fs.

---

UI

Dark mode first.

Minimal.

Professional.

Reusable components.

---

Goal

Generate maintainable,

production-quality code.