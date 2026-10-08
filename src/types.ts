export type TabId = "overview" | "repositories" | "projects" | "packages" | "stars";

export interface SocialAccount {
  provider: string;
  url: string;
}

export interface Achievement {
  title: string;
  imageUrl: string;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatarUrl: string;
  url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  email: string | null;
  blog: string | null;
  twitter: string | null;
  hireable: boolean | null;
  social: SocialAccount[];
  achievements: Achievement[];
  followers: number;
  following: number;
  publicRepos: number;
}

export interface GitHubRepo {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  fork: boolean;
  parent: string | null;
  language: string | null;
  stars: number;
  homepage: string | null;
  pushedAt: string;
}

export interface GitHubOrg {
  login: string;
  avatarUrl: string;
  url: string;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

export interface ContributionData {
  lastYearTotal: number;
  lastYear: ContributionDay[];
  totalsByYear: Record<string, number>;
  allDays: ContributionDay[];
}

export type ActivityKind = "commit" | "pull" | "issue" | "review";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  repo: string;
  url: string;
  date: string;
  state: "open" | "merged" | "closed" | "commit";
}

export interface ActivityData {
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  items: ActivityItem[];
  repos: string[];
  unavailable: boolean;
}

export interface CalendarCell {
  week: number;
  day: number;
  date: string;
  count: number;
  level: number;
}

export interface CalendarModel {
  cells: CalendarCell[];
  weekCount: number;
  monthLabels: Record<number, string>;
}
