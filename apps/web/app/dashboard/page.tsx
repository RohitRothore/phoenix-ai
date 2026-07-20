"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NewProjectDialog } from "@/features/projects/components/NewProjectDialog";
import { ProjectCard } from "@/features/projects/components/ProjectCard";
import { listProjects, type Project } from "@/features/projects/services/project.service";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);

  const refreshProjects = async () => {
    const response = await listProjects();
    setProjects(response.data);
  };

  useEffect(() => {
    let isActive = true;

    void listProjects().then((response) => {
      if (isActive) {
        setProjects(response.data);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#27272A] bg-[#18181B] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-zinc-400">Welcome back</p>
          <h2 className="text-2xl font-semibold text-white">Create your next comedy short</h2>
        </div>

        <Button onClick={() => setOpen(true)} className="bg-[#7C3AED] text-white hover:bg-[#6d28d9]">
          <Plus className="size-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#27272A] bg-[#111111] p-8 text-zinc-400 md:col-span-2 xl:col-span-3">
            No projects yet. Create your first one to start generating director plans.
          </div>
        ) : null}
      </div>

      <NewProjectDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          void refreshProjects();
        }}
      />
    </div>
  );
}
