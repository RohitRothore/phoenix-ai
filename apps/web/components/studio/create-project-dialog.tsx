'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '@/features/projects/services/project.service';
import type { Project } from '@/features/projects/services/project.service';

type FormState = Pick<Project, 'name' | 'language' | 'platform' | 'style' | 'humor'>;

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateProjectDialog({
  open,
  onClose,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: '',
    language: 'Hindi',
    platform: 'YouTube Shorts',
    style: 'Animated Comedy',
    humor: 'light',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await createProject(form);
      const slug = response.data.slug;
      onClose();
      router.push(`/projects/${slug}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create project';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-white">New Project</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Start a new comedy video project
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">
              Project Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) =>
                setForm((f: FormState) => ({ ...f, name: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
              placeholder="My Comedy Short"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Language
              </label>
              <select
                value={form.language}
              onChange={(e) =>
                setForm((f: FormState) => ({ ...f, language: e.target.value }))
              }
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-neutral-600 focus:outline-none"
              >
                <option value="Hindi">Hindi</option>
                <option value="English">English</option>
                <option value="Hinglish">Hinglish</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Platform
              </label>
              <select
                value={form.platform}
              onChange={(e) =>
                setForm((f: FormState) => ({ ...f, platform: e.target.value }))
              }
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-neutral-600 focus:outline-none"
              >
                <option value="YouTube Shorts">YouTube Shorts</option>
                <option value="Instagram Reels">Instagram Reels</option>
                <option value="Facebook Reels">Facebook Reels</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300">
              Visual Style
            </label>
            <select
              value={form.style}
              onChange={(e) =>
                setForm((f: FormState) => ({ ...f, style: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-neutral-600 focus:outline-none"
            >
              <option value="Animated Comedy">Animated Comedy</option>
              <option value="2D Animation">2D Animation</option>
              <option value="3D Animation">3D Animation</option>
              <option value="Cartoon">Cartoon</option>
              <option value="Anime">Anime</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300">
              Humor Style
            </label>
            <select
              value={form.humor}
              onChange={(e) =>
                setForm((f: FormState) => ({ ...f, humor: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-neutral-600 focus:outline-none"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="slapstick">Slapstick</option>
              <option value="wit">Wit</option>
              <option value="satire">Satire</option>
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}