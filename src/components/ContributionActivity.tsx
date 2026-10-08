import { useState, type ReactNode } from "react";
import type { ActivityData, ActivityItem } from "../types";
import { plural } from "../repos";
import { cn } from "../lib/cn";
import { sectionTitle } from "../ui/layout";
import { ChevronIcon, CommitIcon, IssueIcon, PullRequestIcon } from "./Icons";

interface ContributionActivityProps {
  activity: ActivityData | null;
  loading: boolean;
}

interface PullRow {
  repo: string;
  merged: number;
  open: number;
  closed: number;
}

interface MonthGroup {
  id: string;
  label: string;
  commits: ActivityItem[];
  pulls: ActivityItem[];
  issues: ActivityItem[];
  reviews: ActivityItem[];
}

function groupMonths(items: ActivityItem[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const item of items) {
    const date = new Date(item.date);
    const id = `${date.getFullYear()}-${date.getMonth()}`;
    const existing = groups.get(id);
    const group =
      existing ??
      {
        id,
        label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        commits: [],
        pulls: [],
        issues: [],
        reviews: [],
      };
    if (item.kind === "commit") group.commits.push(item);
    else if (item.kind === "pull") group.pulls.push(item);
    else if (item.kind === "issue") group.issues.push(item);
    else group.reviews.push(item);
    groups.set(id, group);
  }
  return [...groups.values()];
}

function uniqueRepos(items: ActivityItem[]): number {
  return new Set(items.map((item) => item.repo)).size;
}

function pullRows(items: ActivityItem[]): PullRow[] {
  const rows = new Map<string, PullRow>();
  for (const item of items) {
    const row = rows.get(item.repo) ?? { repo: item.repo, merged: 0, open: 0, closed: 0 };
    if (item.state === "merged") row.merged += 1;
    else if (item.state === "open") row.open += 1;
    else row.closed += 1;
    rows.set(item.repo, row);
  }
  return [...rows.values()];
}

function ActivityRow({
  icon,
  summary,
  open,
  onToggle,
  children,
}: {
  icon: ReactNode;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 border-0 bg-transparent px-1 py-2.5 text-left hover:bg-subtle"
        onClick={onToggle}
      >
        <span className="inline-flex min-w-0 items-center gap-2 [&_svg]:shrink-0 [&_svg]:text-muted">
          {icon}
          {summary}
        </span>
        <ChevronIcon className={cn("shrink-0 transition-transform duration-150", open && "rotate-180")} />
      </button>
      {open && <div className="px-2 pb-3 pl-8 max-md:pl-2">{children}</div>}
    </div>
  );
}

export function ContributionActivity({ activity, loading }: ContributionActivityProps) {
  const [visibleMonths, setVisibleMonths] = useState(1);
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});
  const months = groupMonths(activity?.items ?? []);
  const shown = months.slice(0, visibleMonths);

  const isOpen = (key: string, index: number, kind: string) => {
    if (key in openKeys) return openKeys[key];
    return index === 0 && kind === "pull";
  };

  const toggle = (key: string, index: number, kind: string) => {
    setOpenKeys((current) => {
      const currently = key in current ? current[key] : index === 0 && kind === "pull";
      return { ...current, [key]: !currently };
    });
  };

  return (
    <section>
      <h2 id="activity-heading" className={cn(sectionTitle, "mb-2")}>
        Contribution activity
      </h2>
      {loading ? (
        <div className="skeleton mt-3 h-[120px]" />
      ) : months.length === 0 ? (
        <p className="mt-2 text-muted">No public contribution activity in the last year.</p>
      ) : (
        <>
          {shown.map((month, index) => (
            <article key={month.id} className="mt-4">
              <h3 className="m-0 mb-2 text-sm font-semibold">{month.label}</h3>
              {month.commits.length > 0 && (
                <ActivityRow
                  icon={<CommitIcon />}
                  summary={`Created ${plural(month.commits.length, "commit")} in ${plural(uniqueRepos(month.commits), "repository", "repositories")}`}
                  open={isOpen(`${month.id}-commits`, index, "commit")}
                  onToggle={() => toggle(`${month.id}-commits`, index, "commit")}
                >
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {month.commits.map((commit) => (
                      <li key={commit.id} className="flex flex-wrap items-baseline gap-2">
                        <a href={commit.url} target="_blank" rel="noreferrer">
                          {commit.title}
                        </a>
                        <span className="text-xs text-muted">{commit.repo}</span>
                      </li>
                    ))}
                  </ul>
                </ActivityRow>
              )}
              {month.pulls.length > 0 && (
                <ActivityRow
                  icon={<PullRequestIcon />}
                  summary={`Opened ${plural(month.pulls.length, "pull request")} in ${plural(uniqueRepos(month.pulls), "repository", "repositories")}`}
                  open={isOpen(`${month.id}-pulls`, index, "pull")}
                  onToggle={() => toggle(`${month.id}-pulls`, index, "pull")}
                >
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {pullRows(month.pulls).map((row) => (
                      <li key={row.repo} className="flex flex-wrap items-baseline justify-between gap-2">
                        <a href={`https://github.com/${row.repo}`} target="_blank" rel="noreferrer">
                          {row.repo}
                        </a>
                        <span className="inline-flex flex-wrap gap-1.5">
                          {row.merged > 0 && (
                            <span className="inline-flex items-center rounded-full bg-[#fbefff] px-2 text-xs font-medium leading-5 text-[#8250df]">
                              merged {row.merged}
                            </span>
                          )}
                          {row.open > 0 && (
                            <span className="inline-flex items-center rounded-full bg-[#dafbe1] px-2 text-xs font-medium leading-5 text-green">
                              open {row.open}
                            </span>
                          )}
                          {row.closed > 0 && (
                            <span className="inline-flex items-center rounded-full bg-[#ffebe9] px-2 text-xs font-medium leading-5 text-danger">
                              closed {row.closed}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </ActivityRow>
              )}
              {month.issues.length > 0 && (
                <ActivityRow
                  icon={<IssueIcon />}
                  summary={`Opened ${plural(month.issues.length, "issue")} in ${plural(uniqueRepos(month.issues), "repository", "repositories")}`}
                  open={isOpen(`${month.id}-issues`, index, "issue")}
                  onToggle={() => toggle(`${month.id}-issues`, index, "issue")}
                >
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {month.issues.map((issue) => (
                      <li key={issue.id} className="flex flex-wrap items-baseline gap-2">
                        <a href={issue.url} target="_blank" rel="noreferrer">
                          {issue.title}
                        </a>
                        <span className="text-xs text-muted">{issue.repo}</span>
                      </li>
                    ))}
                  </ul>
                </ActivityRow>
              )}
              {month.reviews.length > 0 && (
                <ActivityRow
                  icon={<PullRequestIcon />}
                  summary={`Reviewed ${plural(month.reviews.length, "pull request")} in ${plural(uniqueRepos(month.reviews), "repository", "repositories")}`}
                  open={isOpen(`${month.id}-reviews`, index, "review")}
                  onToggle={() => toggle(`${month.id}-reviews`, index, "review")}
                >
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {month.reviews.map((review) => (
                      <li key={review.id} className="flex flex-wrap items-baseline gap-2">
                        <a href={review.url} target="_blank" rel="noreferrer">
                          {review.title}
                        </a>
                        <span className="text-xs text-muted">{review.repo}</span>
                      </li>
                    ))}
                  </ul>
                </ActivityRow>
              )}
            </article>
          ))}
          {visibleMonths < months.length && (
            <button
              type="button"
              className="mt-4 w-full rounded-md border border-border bg-subtle px-4 py-2 font-medium text-accent hover:bg-[#eff2f5]"
              onClick={() => setVisibleMonths(months.length)}
            >
              Show more activity
            </button>
          )}
        </>
      )}
    </section>
  );
}
