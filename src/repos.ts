import type { GitHubRepo } from "./types";

export function popularRepos(repos: GitHubRepo[]): GitHubRepo[] {
  return [...repos]
    .sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      if (Number(a.fork) !== Number(b.fork)) return Number(a.fork) - Number(b.fork);
      const described = Number(Boolean(b.description)) - Number(Boolean(a.description));
      if (described !== 0) return described;
      return b.pushedAt.localeCompare(a.pushedAt);
    })
    .slice(0, 6);
}

export function displayUrl(value: string): string {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function withProtocol(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

export function plural(count: number, singular: string, pluralForm?: string): string {
  const word = count === 1 ? singular : (pluralForm ?? `${singular}s`);
  return `${count.toLocaleString()} ${word}`;
}
