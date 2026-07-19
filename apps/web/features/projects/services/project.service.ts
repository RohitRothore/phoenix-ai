export type Project = {
  id: string;
  slug: string;
  name: string;
  language: string;
  platform: string;
  style: string;
  humor: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<ApiResponse<T>>;
}

export async function createProject(input: Omit<Project, "id" | "slug" | "status" | "createdAt" | "updatedAt">) {
  return request<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listProjects() {
  return request<Project[]>("/projects");
}

export async function generateDirectorPlan(slug: string) {
  return request<{ genre: string; storyStructure: string[]; status: string }>(`/projects/${slug}/director-plan`, {
    method: "POST",
  });
}

export async function generateStory(slug: string) {
  return request<{ title: string; hook: string; summary: string; ending: string; status: string }>(`/projects/${slug}/story`, {
    method: "POST",
  });
}
