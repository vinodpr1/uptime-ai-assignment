import type { TabId } from "../types";
import { cn } from "../lib/cn";
import { ghBarSurface, pageContainer } from "../ui/layout";
import { BookIcon, BriefcaseIcon, PackageIcon, ProjectIcon, StarIcon } from "./Icons";

interface ProfileNavProps {
  tab: TabId;
  onTab: (tab: TabId) => void;
  repoCount?: number;
  starCount?: number;
}

const TABS: Array<{ id: TabId; label: string; icon: typeof BookIcon }> = [
  { id: "overview", label: "Overview", icon: BookIcon },
  { id: "repositories", label: "Repositories", icon: BriefcaseIcon },
  { id: "projects", label: "Projects", icon: ProjectIcon },
  { id: "packages", label: "Packages", icon: PackageIcon },
  { id: "stars", label: "Stars", icon: StarIcon },
];

export function ProfileNav({ tab, onTab, repoCount }: ProfileNavProps) {
  return (
    <nav className={cn("border-b border-border", ghBarSurface)}>
      <div
        className={cn(
          pageContainer,
          "flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {TABS.map((item) => {
          const Icon = item.icon;
          const count = item.id === "repositories" ? repoCount : undefined;
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                "inline-flex shrink-0 items-center gap-2 border-0 border-b-2 border-transparent bg-transparent px-2 pt-3 pb-2.5 text-fg hover:no-underline",
                selected ? "border-underline font-semibold [&_svg]:text-fg" : "[&_svg]:text-muted",
              )}
              onClick={() => onTab(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
              {count !== undefined && (
                <span className="inline-flex h-5 min-w-5 items-center rounded-full bg-[rgba(175,184,193,0.2)] px-1.5 text-xs font-medium leading-none text-fg">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
