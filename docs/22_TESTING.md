# Testing Guide

Version: 1.0

---

# Philosophy

Every feature should be testable.

Testing exists to prevent regressions, not merely increase coverage.

Correctness is more important than coverage percentage.

---

# Testing Pyramid

                E2E
             Integration
             Unit Tests

Most tests should be Unit Tests.

---

# Test Types

Unit Tests

Integration Tests

End-to-End Tests

Performance Tests

Future

AI Evaluation Tests

---

# Unit Testing

Test

Services

Agents

Pipelines

Utilities

Validators

Never test framework internals.

---

# Integration Testing

Test

Controllers

Storage

Providers

Database (future)

API Contracts

---

# E2E Testing

Test

Project Creation

Director Generation

Story Generation

Scene Generation

Export

---

# Mocking

Mock

AI Providers

Storage

HTTP

External APIs

Never call real AI providers in CI.

---

# AI Testing

Validate

JSON Schema

Prompt Version

Retry Logic

Fallback Logic

Deterministic Transformations

---

# Naming

project.service.spec.ts

director.agent.spec.ts

story.pipeline.spec.ts

---

# Coverage Goals

Core Business Logic

95%

Utilities

90%

Controllers

80%

Overall

85%+

Coverage is not the goal.

Confidence is.

---

# Regression Policy

Every bug fixed

↓

New Test

↓

Never Regress Again

---

# CI

Every Pull Request

↓

Lint

↓

Type Check

↓

Tests

↓

Build

↓

Merge