"use client";

import { X } from "lucide-react";

import { ProjectForm } from "@/features/projects/components/ProjectForm";

type NewProjectDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function NewProjectDialog({ open, onClose, onCreated }: NewProjectDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[#27272A] bg-[#111111] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">New Project</h3>
            <p className="text-sm text-zinc-400">Create a brand-new creative workspace.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#27272A] p-2 text-zinc-300 hover:bg-[#27272A]"
          >
            <X className="size-4" />
          </button>
        </div>

        <ProjectForm onCreated={onCreated} onCancel={onClose} />
      </div>
    </div>
  );
}
