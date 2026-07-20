'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listProjects, createProject } from '@/features/projects/services/project.service';
import type { Project } from '@/features/projects/services/project.service';
import { CreateProjectDialog } from '@/components/studio/create-project-dialog';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await listProjects();
        setProjects(response.data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load projects';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <div className="flex items-center justify-between border-b border-neutral-900 px-6 py-4">
        <h1 className="text-lg font-semibold">Phoenix Studio</h1>
        <nav className="flex items-center gap-4 text-sm text-neutral-400">
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
          <span className="text-white">Projects</span>
          <Link href="/series" className="hover:text-white">
            Series
          </Link>
          <Link href="/characters" className="hover:text-white">
            Characters
          </Link>
          <Link href="/settings" className="hover:text-white">
            Settings
          </Link>
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Projects</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Manage your comedy video projects
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            New Project
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/50 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-10 text-center text-sm text-neutral-500">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-20 flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-neutral-400">No projects yet</p>
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="group rounded-xl border border-neutral-900 bg-neutral-950 p-5 transition hover:border-neutral-700"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">
                    {project.name}
                  </h3>
                  <span className="text-xs text-neutral-500">{project.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-400">
                  <span>{project.language}</span>
                  <span className="text-neutral-700">•</span>
                  <span>{project.platform}</span>
                  <span className="text-neutral-700">•</span>
                  <span>{project.style}</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    Updated{' '}
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="text-neutral-400 group-hover:text-white">
                    Open Studio →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}