"use client";

import {
  Clapperboard,
  LayoutDashboard,
  NotebookPen,
  Settings,
  Tv,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { title: "Studio", href: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", href: "/projects", icon: Clapperboard },
  { title: "Series", href: "/series", icon: Tv },
  { title: "Characters", href: "/characters", icon: NotebookPen },
  { title: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] border-r border-[#27272A] bg-[#111111] px-4 py-6">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#7C3AED] text-lg font-bold text-white">
          P
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Phoenix AI</p>
          <p className="text-xs text-zinc-400">Creative Studio</p>
        </div>
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map(({ title, href, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={title}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-[#27272A] text-white"
                  : "text-zinc-300 hover:bg-[#18181B] hover:text-white"
              }`}
            >
              <Icon className="size-4" />
              <span>{title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
