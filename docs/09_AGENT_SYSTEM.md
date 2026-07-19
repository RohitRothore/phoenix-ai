# Agent System

---

# Philosophy

Agents represent intelligence.

Each agent performs exactly one cognitive task.

Agents never know about user interfaces.

Agents never know about storage.

Agents never know about providers.

Agents receive structured input.

Agents return structured output.

---

# Current Agents

Director Agent

Story Agent

Scene Agent

Dialogue Agent

Prompt Agent

Voice Agent

Subtitle Agent

Video Agent

---

# Interface

Every agent implements

Agent<Input, Output>

---

# Responsibilities

Director

Plans.

Story

Writes narrative.

Scene Planner

Breaks story into scenes.

Dialogue

Writes conversations.

Prompt Builder

Creates AI video prompts.

Video

Coordinates rendering.

Voice

Coordinates speech generation.

Subtitle

Coordinates caption generation.

---

# Rules

Agents do not call each other directly.

Agents never access filesystem.

Agents never know about REST.

Agents never know about React.

Agents are deterministic whenever possible.

---

# Communication

Agents communicate only through structured models.

Never strings.

Never markdown.

Never free-form objects.

---

# Testing

Every agent must have unit tests.

Provider calls must be mocked.

Prompt templates must be versioned.

---

# Future

Memory Agent

Character Agent

Humor Agent

Music Agent

Review Agent

Editor Agent