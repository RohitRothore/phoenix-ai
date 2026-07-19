"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createProject } from "@/features/projects/services/project.service";

const INITIAL_FORM = {
  name: "",
  language: "Hindi",
  platform: "YouTube Shorts",
  style: "Pixar",
  humor: "Sarcastic",
};

type ProjectFormProps = {
  onCreated: () => void;
  onCancel: () => void;
};

export function ProjectForm({ onCreated, onCancel }: ProjectFormProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (key: keyof typeof INITIAL_FORM, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createProject(form);
      onCreated();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-zinc-300">
          <span>Project Name</span>
          <input
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="w-full rounded-xl border border-[#27272A] bg-[#111111] px-3 py-2 text-white outline-none"
            placeholder="Pappu IT Office"
          />
        </label>

        <label className="space-y-2 text-sm text-zinc-300">
          <span>Language</span>
          <input
            required
            value={form.language}
            onChange={(event) => updateField("language", event.target.value)}
            className="w-full rounded-xl border border-[#27272A] bg-[#111111] px-3 py-2 text-white outline-none"
          />
        </label>

        <label className="space-y-2 text-sm text-zinc-300">
          <span>Platform</span>
          <input
            required
            value={form.platform}
            onChange={(event) => updateField("platform", event.target.value)}
            className="w-full rounded-xl border border-[#27272A] bg-[#111111] px-3 py-2 text-white outline-none"
          />
        </label>

        <label className="space-y-2 text-sm text-zinc-300">
          <span>Style</span>
          <input
            required
            value={form.style}
            onChange={(event) => updateField("style", event.target.value)}
            className="w-full rounded-xl border border-[#27272A] bg-[#111111] px-3 py-2 text-white outline-none"
          />
        </label>

        <label className="space-y-2 text-sm text-zinc-300 md:col-span-2">
          <span>Comedy Tone</span>
          <input
            value={form.humor}
            onChange={(event) => updateField("humor", event.target.value)}
            className="w-full rounded-xl border border-[#27272A] bg-[#111111] px-3 py-2 text-white outline-none"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" className='text-black' onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#7C3AED] text-white hover:bg-[#6d28d9]" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
