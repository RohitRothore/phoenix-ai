"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Studio",
  "/projects": "Projects",
  "/series": "Series",
  "/characters": "Characters",
  "/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Studio";

  return (
    <header className="border-b border-[#27272A] bg-[#111111] px-5 py-4 md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Phoenix AI Studio</p>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-full border border-[#27272A] p-2 text-zinc-300 transition hover:bg-[#27272A]">
            <Search className="size-4" />
          </button>
          <button className="rounded-full border border-[#27272A] p-2 text-zinc-300 transition hover:bg-[#27272A]">
            <Bell className="size-4" />
          </button>
          <Link
            href="/settings"
            className="flex size-9 items-center justify-center rounded-full bg-[#7C3AED] text-sm font-semibold text-white"
          >
            R
          </Link>
        </div>
      </div>
    </header>
  );
}
