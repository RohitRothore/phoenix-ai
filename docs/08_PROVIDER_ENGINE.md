# Provider Engine

---

# Goal

Phoenix supports multiple AI providers.

The application must never depend directly on Gemini, OpenAI, Claude or Ollama.

Instead it communicates through the Provider Engine.

---

# Architecture

Application

↓

Provider Registry

↓

Provider

↓

External API

---

# Supported Providers

Gemini

OpenAI

Claude

Groq

OpenRouter

Ollama

DeepSeek

Future providers should require no application changes.

---

# Responsibilities

Provider

Communicate with AI model.

Return normalized response.

Handle retries.

Handle provider-specific options.

Nothing else.

---

# Rules

Providers never contain business logic.

Providers never generate prompts.

Providers never know about projects.

Providers never know about characters.

Providers only communicate with AI models.

---

# Provider Interface

Every provider implements

AIProvider

This ensures provider independence.

---

# Registry

ProviderRegistry owns provider instances.

Application code requests providers through the registry.

Application never instantiates providers directly.

---

# Factory

ProviderFactory creates providers.

Environment determines which providers are available.

---

# Failover

Future

Gemini unavailable

↓

Fallback

↓

OpenAI

↓

Claude

↓

Error

No business logic changes required.

---

# Metrics

Every provider reports

Latency

Token usage

Errors

Retries

Model

Provider

These metrics power monitoring dashboards.