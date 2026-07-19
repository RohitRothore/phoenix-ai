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