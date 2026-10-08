import type { GitHubOrg, GitHubUser } from "../types";
import { profileMetaItems } from "../profileLinks";
import { sectionTitle } from "../ui/layout";
import {
  BuildingIcon,
  LinkIcon,
  LinkedInIcon,
  LocationIcon,
  MailIcon,
  PeopleIcon,
  XIcon,
} from "./Icons";

interface SidebarProps {
  user: GitHubUser | null;
  orgs: GitHubOrg[];
  loading: boolean;
}

function MetaIcon({ kind }: { kind: ReturnType<typeof profileMetaItems>[number]["icon"] }) {
  switch (kind) {
    case "company":
      return <BuildingIcon />;
    case "location":
      return <LocationIcon />;
    case "email":
      return <MailIcon />;
    case "linkedin":
      return <LinkedInIcon />;
    case "twitter":
      return <XIcon />;
    case "hireable":
      return <PeopleIcon />;
    default:
      return <LinkIcon />;
  }
}

export function Sidebar({ user, orgs, loading }: SidebarProps) {
  if (loading || !user) {
    return (
      <aside className="min-w-0">
        <div className="skeleton aspect-square w-full rounded-full" />
        <div className="skeleton mt-3 h-4 w-[80%]" />
        <div className="skeleton mt-3 h-4 w-[55%]" />
        <div className="skeleton mt-4 h-8" />
        <div className="skeleton mt-3 h-4 w-[55%]" />
        <div className="skeleton mt-3 h-4 w-[80%]" />
      </aside>
    );
  }

  const meta = profileMetaItems(user);

  return (
    <aside className="min-w-0">
      <div className="w-full">
        <img
          className="block aspect-square w-full rounded-full border border-border bg-subtle object-cover"
          src={user.avatarUrl}
          alt="profile picture"
        />
      </div>
      <h1 className="mt-4 text-2xl font-semibold leading-tight max-[1012px]:text-xl">{user.name ?? user.login}</h1>
      <p className="m-0 text-xl font-light leading-tight text-muted max-[1012px]:text-base">{user.login}</p>

      {user.bio?.trim() && (
        <div className="mt-4 whitespace-pre-wrap break-words text-base leading-normal">{user.bio.trim()}</div>
      )}

      <a
        className="mt-4 block w-full max-w-80 rounded-md border border-[rgba(31,35,40,0.15)] bg-subtle px-4 py-[5px] text-center font-medium text-fg no-underline hover:bg-[#eff2f5] hover:no-underline"
      >
        Edit profile
      </a>

      <p className="mt-4 flex flex-wrap items-center gap-1 text-fg [&_a]:text-muted [&_a:hover]:text-accent [&_a:hover_strong]:text-accent [&_strong]:font-semibold [&_strong]:text-accent [&_svg]:text-muted">
        <PeopleIcon />
        <a href={`${user.url}?tab=followers`} target="_blank" rel="noreferrer">
          <strong>{user.followers.toLocaleString()}</strong> followers
        </a>
        <span className="text-muted">·</span>
        <a href={`${user.url}?tab=following`} target="_blank" rel="noreferrer">
          <strong>{user.following.toLocaleString()}</strong> following
        </a>
      </p>

      {meta.length > 0 && (
        <ul className="mt-4 flex list-none flex-col gap-1 p-0">
          {meta.map((item) => (
            <li key={item.id} className="flex min-w-0 items-start gap-2">
              <span className="mt-0.5 shrink-0 text-muted">
                <MetaIcon kind={item.icon} />
              </span>
              {item.href ? (
                <a
                  className="min-w-0 break-words text-fg [overflow-wrap:anywhere] hover:text-accent"
                >
                  {item.label}
                </a>
              ) : (
                <span className="min-w-0 break-words leading-[1.45] [overflow-wrap:anywhere]">{item.label}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {user.achievements.length > 0 && (
        <section className="mt-6 border-t border-border pt-4">
          <h2 className={sectionTitle}>Achievements</h2>
          <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
            {user.achievements.map((badge) => (
              <li key={`${badge.title}-${badge.imageUrl}`} className="size-16 shrink-0">
                <img
                  className="block size-16 rounded-full"
                  src={badge.imageUrl}
                  alt={badge.title}
                  title={badge.title}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {orgs.length > 0 && (
        <section className="mt-6 border-t border-border pt-4">
          <h2 className={sectionTitle}>Organizations</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {orgs.map((org) => (
              <a key={org.login} title={org.login}>
                <img className="block size-8 rounded-md" src={org.avatarUrl} alt={org.login} />
              </a>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
