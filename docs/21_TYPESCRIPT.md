# TypeScript Guide

Version: 1.0

---

# Philosophy

TypeScript is part of the architecture.

Types are documentation.

Types prevent bugs.

---

# Strict Mode

Always enabled.

Never disable.

---

# Allowed

Interfaces

Generics

Utility Types

Readonly

Discriminated Unions

Enums (only when necessary)

---

# Avoid

any

unknown without validation

Implicit any

Type assertions without reason

---

# Interfaces

Represent business models.

Project

Story

Character

Scene

Dialogue

DirectorPlan

---

# Types

Use for

Union Types

Mapped Types

Utility Types

---

# Generics

Prefer

ApiResponse<T>

Agent<Input, Output>

Pipeline<Input, Output>

Repository<T>

---

# DTOs

Validation only.

Never business logic.

---

# Nullable

Prefer

undefined

Avoid null.

---

# Optional

Use only when truly optional.

---

# Enums

Prefer string unions.

Example

type Status =
    | "created"
    | "running"
    | "completed";

---

# Readonly

Use whenever mutation is not expected.

---

# Functions

Always define return type.

---

# Promise

Always Promise<T>

Never Promise<any>

---

# Errors

Create custom error classes.

Avoid generic Error.

---

# Validation

Never trust provider output.

Validate before use.

---

# JSON

Always parse safely.

Always validate schema.

---

# tsconfig

strict

noImplicitAny

exactOptionalPropertyTypes

noUncheckedIndexedAccess

Always enabled.

---

# Future

Code generation

Schema generation

OpenAPI generation

JSON Schema

Type-safe Providers