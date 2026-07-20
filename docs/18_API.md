# API Guide

Version: 1.0

---

# Philosophy

Phoenix exposes a REST API.

Future versions will support WebSockets for live generation updates.

---

# Base URL

/api

---

# Response Format

Every endpoint returns

{
  "success": true,
  "message": "...",
  "data": {}
}

Never return raw objects.

---

# Authentication

Version 1

No authentication (local application)

Future

JWT

OAuth

API Keys

---

# Modules

Projects

Generation

Characters

Series

Settings

Health

---

# Project Endpoints

POST /projects

Create Project

GET /projects

List Projects

GET /projects/:id

Project Details

DELETE /projects/:id

Delete Project

---

# Generation Endpoints

POST /generation/director

POST /generation/story

POST /generation/scenes

POST /generation/dialogues

POST /generation/video

POST /generation/export

Current project-scoped generation endpoints

POST /projects/:slug/director-plan

POST /projects/:slug/story

POST /projects/:slug/scenes

POST /projects/:slug/dialogues

POST /projects/:slug/prompts

POST /projects/:slug/video

POST /projects/:slug/video/render

Each generated artifact can be retrieved through the corresponding
GET /projects/:slug/:artifact endpoint.

The video preparation endpoint creates a persisted scene-render plan. The render
endpoint produces a local FFmpeg fallback MP4 from that plan. It does not yet
start an external AI-video render.

---

# Character Endpoints

GET /characters

POST /characters

PATCH /characters/:id

DELETE /characters/:id

---

# Error Format

{
  "success": false,
  "message": "...",
  "errors": []
}

---

# Validation

DTO Validation

Class Validator

Class Transformer

---

# Documentation

Swagger

OpenAPI

Future

API Versioning

---

# Engineering Rules

Controllers remain thin.

Services orchestrate.

Pipelines coordinate.

Agents think.

Providers communicate.
