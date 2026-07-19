# Architecture Decision Records

Version: 1.0

---

# Purpose

Every important architectural decision should be documented.

This prevents knowledge loss.

Every ADR should explain

Context

Decision

Alternatives

Consequences

---

# ADR-001

Decision

Use NestJS

Reason

Modular architecture

Dependency Injection

Scalability

---

# ADR-002

Decision

Use Next.js App Router

Reason

Modern React

Server Components

Streaming

---

# ADR-003

Decision

Use Turborepo

Reason

Shared packages

Fast builds

Scalability

---

# ADR-004

Decision

Use Provider Pattern

Reason

Provider independence

Easy provider switching

Future support

---

# ADR-005

Decision

Use Pipeline Pattern

Reason

Workflow orchestration

Regeneration

Maintainability

---

# ADR-006

Decision

Use Local JSON Storage

Reason

Fast iteration

Simple debugging

No migrations

Future database support

---

# ADR-007

Decision

Use Multi-Agent Architecture

Reason

Better prompts

Reusable components

Better testing

---

# ADR-008

Decision

One Project = One Folder

Reason

Easy backup

Versioning

Asset organization

---

# ADR-009

Decision

Prompt Templates are Source Code

Reason

Version control

Testing

Reproducibility

---

# ADR Process

Every major decision

↓

Create ADR

↓

Review

↓

Merge

↓

Never silently change architecture.