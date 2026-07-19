# Storage Engine

Version 1.0

---

# Philosophy

Phoenix is Local First.

Projects exist on the filesystem.

The filesystem is the database.

Later:

Filesystem

↓

SQLite

↓

PostgreSQL

↓

Cloud

without changing business logic.

---

# Goals

Human readable.

Easy backup.

Easy restore.

Easy regeneration.

Version friendly.

---

# Project Structure

storage/

projects/

project-id/

project.json

director.json

story.json

scenes.json

dialogues.json

metadata.json

assets/

audio/

video/

subtitles/

exports/

logs/

---

# Storage Service

Every module communicates through StorageService.

Never use fs directly.

Never hardcode paths.

---

# Storage Operations

Create Project

Delete Project

Write JSON

Read JSON

Move Asset

Copy Asset

List Files

Exists

Create Directory

Delete Directory

---

# Versioning

Every JSON document contains

version

createdAt

updatedAt

generatorVersion

This enables migrations later.

---

# Recovery

If scene generation fails

↓

Delete scene only

↓

Regenerate scene

Never regenerate the entire project.

---

# Future

S3

Google Drive

NAS

Dropbox

Git-backed projects

All storage providers implement the same interface.