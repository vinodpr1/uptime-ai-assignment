import { useEffect, useRef, useState } from "react";
import type { GitHubUser, TabId } from "../types";
import { cn } from "../lib/cn";
import { ghBarSurface, iconButton, pageContainer } from "../ui/layout";
import {
  BriefcaseIcon,
  CaretIcon,
  IssueIcon,
  MenuIcon,
  PeopleIcon,
  PlusIcon,
  PullRequestIcon,
  SearchIcon,
} from "./Icons";

const MENU_ITEMS: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "repositories", label: "Repositories" },
  { id: "projects", label: "Projects" },
  { id: "packages", label: "Packages" },
  { id: "stars", label: "Stars" },
];

interface HeaderProps {
  user: GitHubUser | null;
  onNavigate: (tab: TabId) => void;
}

export function Header({ user, onNavigate }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [menuOpen]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(query);
  };

  const login = user?.login ?? "vinodpr1";
  const profileUrl = user?.url ?? "https://github.com/vinodpr1";

  return (
    <header className={cn("sticky top-0 z-20 h-16", ghBarSurface)}>
      <div className={cn(pageContainer, "flex h-full items-center justify-between gap-4")}>
        <div className="relative flex min-w-0 shrink-0 items-center gap-2" ref={menuRef}>
          <button type="button" className={iconButton} onClick={() => setMenuOpen((open) => !open)}>
            <MenuIcon />
          </button>
          {menuOpen && (
            <div
              className="absolute top-10 left-0 z-30 min-w-[196px] rounded-md border border-border bg-white py-1 shadow-[0_8px_24px_rgba(140,149,159,0.2)]"
            >
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="block w-full border-0 bg-transparent px-4 py-2 text-left hover:bg-subtle"
                  onClick={() => {
                    onNavigate(item.id);
                    setMenuOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          <a
            className="inline-flex min-w-0 items-center gap-2 text-fg no-underline hover:no-underline"
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
          >
            {user ? (
              <img className="size-7 shrink-0 rounded-full object-cover" src={user.avatarUrl} alt="" />
            ) : (
              <span className="skeleton size-7 shrink-0 rounded-full" />
            )}
            <span className="max-w-40 truncate text-sm font-semibold text-fg">{login}</span>
          </a>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
          <form onSubmit={handleSubmit} className="relative w-[min(272px,34vw)] min-w-[140px] shrink-0 max-md:w-[min(200px,28vw)] max-md:min-w-[120px]">
            <SearchIcon className="absolute top-2 left-2.5 text-muted" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type / to search"
              className="h-8 w-full rounded-md border border-border bg-white pr-[34px] pl-8 text-sm shadow-[inset_0_1px_0_rgba(208,215,222,0.2)] focus:border-accent focus:shadow-[0_0_0_3px_rgba(9,105,218,0.3)] focus:outline-none"
            />
          </form>

          <button type="button" className={cn(iconButton, "hidden w-auto gap-0 px-2 md:inline-flex")}>
            <PeopleIcon />
            <CaretIcon className="-ml-0.5 size-3 text-muted" />
          </button>

          <span className="mx-1 hidden h-6 w-px shrink-0 bg-border md:block" />

          <button type="button" className={cn(iconButton, "hidden w-auto gap-0 px-2 md:inline-flex")}>
            <PlusIcon />
            <CaretIcon className="-ml-0.5 size-3 text-muted" />
          </button>
          <a className={cn(iconButton, "hidden md:inline-flex")} href="https://github.com/issues" target="_blank" rel="noreferrer">
            <IssueIcon />
          </a>
          <a className={cn(iconButton, "hidden md:inline-flex")} href="https://github.com/pulls" target="_blank" rel="noreferrer">
            <PullRequestIcon />
          </a>
          <button type="button" className={cn(iconButton, "relative")}>
            <BriefcaseIcon />
            <span className="absolute top-[5px] right-[5px] size-2 rounded-full bg-accent shadow-[0_0_0_2px_#ffffff]" />
          </button>
          <a className="ml-1 flex rounded-full hover:opacity-85" href={profileUrl} target="_blank" rel="noreferrer">
            {user ? (
              <img className="size-8 shrink-0 rounded-full object-cover" src={user.avatarUrl} alt="" />
            ) : (
              <span className="skeleton size-8 shrink-0 rounded-full" />
            )}
          </a>
        </div>
      </div>
    </header>
  );
}
