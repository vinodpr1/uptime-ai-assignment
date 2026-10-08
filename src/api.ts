import type {
  Achievement,
  ActivityData,
  ActivityItem,
  ContributionData,
  ContributionDay,
  GitHubOrg,
  GitHubRepo,
  GitHubUser,
} from "./types";

const GITHUB_API = import.meta.env.DEV ? "/github-api" : "https://api.github.com";

const GITHUB_HEADERS: HeadersInit = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

export class GitHubApiError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? `GitHub API request failed (${status})`);
    this.name = "GitHubApiError";
    this.status = status;
  }
}

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  return error instanceof Error && error.name === "AbortError";
}

// GitHub's contribution calendar is not on the public REST API. It is exposed
// by the GraphQL contributionsCollection field, which requires a token. This
// endpoint returns that same calendar as JSON and allows browser requests.
const CONTRIBUTION_API = "https://github-contributions-api.jogruber.de/v4";

interface UserResponse {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  email: string | null;
  blog: string | null;
  twitter_username: string | null;
  hireable: boolean | null;
  followers: number;
  following: number;
  public_repos: number;
}

interface SocialAccountResponse {
  provider: string;
  url: string;
}

interface RepoResponse {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  homepage: string | null;
  pushed_at: string | null;
  private: boolean;
  parent?: { full_name: string };
}

interface OrgResponse {
  login: string;
  avatar_url: string;
  html_url?: string;
}

interface ContributionResponse {
  total: Record<string, number>;
  contributions: ContributionDay[];
}

interface CommitSearchResponse {
  total_count: number;
  items: Array<{
    sha: string;
    html_url: string;
    commit: { message: string; author: { date: string } | null };
    repository: { full_name: string };
  }>;
}

interface IssueSearchResponse {
  total_count: number;
  items: Array<{
    id: number;
    title: string;
    html_url: string;
    state: string;
    created_at: string;
    repository_url: string;
    pull_request?: { merged_at: string | null };
  }>;
}

function nextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const part = linkHeader.split(",").find((entry) => entry.includes('rel="next"'));
  return part?.match(/<([^>]+)>/)?.[1] ?? null;
}

async function githubFetch(url: string, signal?: AbortSignal): Promise<Response> {
  const response = await fetch(url, { signal, headers: GITHUB_HEADERS });
  if (response.status === 403 || response.status === 429) {
    throw new GitHubApiError(
      response.status,
      response.status === 403
        ? "GitHub API rate limit reached. Wait a minute and try again."
        : "GitHub API is busy. Please try again shortly.",
    );
  }
  if (!response.ok) {
    throw new GitHubApiError(response.status);
  }
  return response;
}

async function fetchJson<T>(url: string, signal?: AbortSignal, github = true): Promise<T> {
  const response = github
    ? await githubFetch(url, signal)
    : await fetch(url, { signal, headers: { Accept: "application/json" } }).then(async (res) => {
        if (!res.ok) throw new GitHubApiError(res.status);
        return res;
      });
  return (await response.json()) as T;
}

function mapUser(user: UserResponse): GitHubUser {
  return {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    url: user.html_url,
    bio: user.bio,
    company: user.company,
    location: user.location,
    email: user.email,
    blog: user.blog?.trim() ? user.blog.trim() : null,
    twitter: user.twitter_username,
    hireable: user.hireable,
    social: [],
    achievements: [],
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
  };
}

export async function fetchSocialAccounts(
  username: string,
  signal?: AbortSignal,
): Promise<SocialAccountResponse[]> {
  try {
    return await fetchJson<SocialAccountResponse[]>(
      `${GITHUB_API}/users/${username}/social_accounts`,
      signal,
    );
  } catch {
    return [];
  }
}

interface GraphQLAchievementNode {
  title: string;
  imageUrl?: string;
  imageURL?: string;
}

export async function fetchAchievements(username: string, signal?: AbortSignal): Promise<Achievement[]> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        achievements(first: 20) {
          nodes {
            title
            imageUrl
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`${GITHUB_API}/graphql`, {
      method: "POST",
      signal,
      headers: {
        ...GITHUB_HEADERS,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { login: username } }),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      data?: { user?: { achievements?: { nodes?: GraphQLAchievementNode[] } } };
    };
    const nodes = payload.data?.user?.achievements?.nodes ?? [];
    return nodes
      .map((node) => {
        const imageUrl = node.imageUrl ?? node.imageURL;
        if (!node.title || !imageUrl) return null;
        return { title: node.title, imageUrl };
      })
      .filter((node): node is Achievement => node !== null);
  } catch {
    return [];
  }
}

function mapRepo(repo: RepoResponse): GitHubRepo {
  return {
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    description: repo.description,
    fork: repo.fork,
    parent: repo.parent?.full_name ?? null,
    language: repo.language,
    stars: repo.stargazers_count,
    homepage: repo.homepage?.trim() ? repo.homepage.trim() : null,
    pushedAt: repo.pushed_at ?? "",
  };
}

const USER_CACHE_MS = 5 * 60 * 1000;

function readUserCache(username: string): GitHubUser | null {
  try {
    const raw = sessionStorage.getItem(`gh-user-v3:${username}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { expires: number; user: GitHubUser };
    if (parsed.expires <= Date.now()) return null;
    return parsed.user;
  } catch {
    return null;
  }
}

function writeUserCache(username: string, user: GitHubUser): void {
  try {
    sessionStorage.setItem(
      `gh-user-v3:${username}`,
      JSON.stringify({ expires: Date.now() + USER_CACHE_MS, user }),
    );
  } catch {
    // Ignore quota / private mode errors.
  }
}

export async function fetchUser(username: string, signal?: AbortSignal): Promise<GitHubUser> {
  const cached = readUserCache(username);
  if (cached) return cached;

  const [user, social, achievements] = await Promise.all([
    fetchJson<UserResponse>(`${GITHUB_API}/users/${username}`, signal),
    fetchSocialAccounts(username, signal),
    fetchAchievements(username, signal),
  ]);
  const mapped = { ...mapUser(user), social, achievements };
  writeUserCache(username, mapped);
  return mapped;
}

export async function fetchRepos(username: string, signal?: AbortSignal): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let url: string | null = `${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated&type=owner`;

  while (url) {
    const response = await githubFetch(url, signal);
    const batch = (await response.json()) as RepoResponse[];
    repos.push(...batch.filter((repo) => !repo.private).map(mapRepo));
    url = nextPageUrl(response.headers.get("Link"));
  }

  return repos;
}

export async function fetchStarred(username: string, signal?: AbortSignal): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let url: string | null = `${GITHUB_API}/users/${username}/starred?per_page=100`;

  while (url) {
    const response = await githubFetch(url, signal);
    const batch = (await response.json()) as RepoResponse[];
    repos.push(...batch.map(mapRepo));
    url = nextPageUrl(response.headers.get("Link"));
  }

  return repos;
}

export async function fetchOrgs(username: string, signal?: AbortSignal): Promise<GitHubOrg[]> {
  const orgs = await fetchJson<OrgResponse[]>(`${GITHUB_API}/users/${username}/orgs`, signal);
  return orgs.map((org) => ({
    login: org.login,
    avatarUrl: org.avatar_url,
    url: org.html_url ?? `https://github.com/${org.login}`,
  }));
}

export async function fetchContributions(username: string, signal?: AbortSignal): Promise<ContributionData> {
  const [lastYear, allYears] = await Promise.all([
    fetchJson<ContributionResponse>(`${CONTRIBUTION_API}/${username}?y=last`, signal, false),
    fetchJson<ContributionResponse>(`${CONTRIBUTION_API}/${username}?y=all`, signal, false),
  ]);

  const totalsByYear: Record<string, number> = {};
  for (const [key, value] of Object.entries(allYears.total)) {
    if (/^\d{4}$/.test(key)) totalsByYear[key] = value;
  }

  return {
    lastYearTotal: lastYear.total.lastYear ?? 0,
    lastYear: lastYear.contributions,
    totalsByYear,
    allDays: allYears.contributions,
  };
}

function repoFromApiUrl(url: string): string {
  const parts = url.split("/");
  const name = parts[parts.length - 1] ?? "";
  const owner = parts[parts.length - 2] ?? "";
  return `${owner}/${name}`;
}

async function search<T extends { total_count: number; items: unknown[] }>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  try {
    const response = await githubFetch(url, signal);
    return (await response.json()) as T;
  } catch (error) {
    if (isAbortError(error)) throw error;
    return { total_count: 0, items: [] } as unknown as T;
  }
}

function oneYearAgo(): string {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  return date.toISOString().slice(0, 10);
}

export async function fetchActivity(username: string, signal?: AbortSignal): Promise<ActivityData> {
  const since = oneYearAgo();
  const commitUrl = `${GITHUB_API}/search/commits?q=${encodeURIComponent(
    `author:${username} committer-date:>${since}`,
  )}&sort=author-date&order=desc&per_page=40`;
  const pullUrl = `${GITHUB_API}/search/issues?q=${encodeURIComponent(
    `author:${username} type:pr created:>${since}`,
  )}&sort=created&order=desc&per_page=20`;
  const issueUrl = `${GITHUB_API}/search/issues?q=${encodeURIComponent(
    `author:${username} type:issue created:>${since}`,
  )}&sort=created&order=desc&per_page=10`;
  const reviewUrl = `${GITHUB_API}/search/issues?q=${encodeURIComponent(
    `reviewed-by:${username} type:pr updated:>${since}`,
  )}&sort=updated&order=desc&per_page=10`;

  const [commits, pulls, issues, reviews] = await Promise.all([
    search<CommitSearchResponse>(commitUrl, signal),
    search<IssueSearchResponse>(pullUrl, signal),
    search<IssueSearchResponse>(issueUrl, signal),
    search<IssueSearchResponse>(reviewUrl, signal),
  ]);

  const unavailable =
    commits.total_count === 0 &&
    pulls.total_count === 0 &&
    issues.total_count === 0 &&
    reviews.total_count === 0 &&
    commits.items.length === 0 &&
    pulls.items.length === 0;

  const items: ActivityItem[] = [
    ...commits.items.map((item) => ({
      id: `commit-${item.sha}`,
      kind: "commit" as const,
      title: item.commit.message.split("\n")[0] || "Commit",
      repo: item.repository.full_name,
      url: item.html_url,
      date: item.commit.author?.date ?? since,
      state: "commit" as const,
    })),
    ...pulls.items.map((item) => ({
      id: `pull-${item.id}`,
      kind: "pull" as const,
      title: item.title,
      repo: repoFromApiUrl(item.repository_url),
      url: item.html_url,
      date: item.created_at,
      state: item.pull_request?.merged_at ? ("merged" as const) : item.state === "open" ? ("open" as const) : ("closed" as const),
    })),
    ...issues.items.map((item) => ({
      id: `issue-${item.id}`,
      kind: "issue" as const,
      title: item.title,
      repo: repoFromApiUrl(item.repository_url),
      url: item.html_url,
      date: item.created_at,
      state: item.state === "open" ? ("open" as const) : ("closed" as const),
    })),
    ...reviews.items.map((item) => ({
      id: `review-${item.id}`,
      kind: "review" as const,
      title: item.title,
      repo: repoFromApiUrl(item.repository_url),
      url: item.html_url,
      date: item.created_at,
      state: "commit" as const,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const repos: string[] = [];
  for (const item of items) {
    if ((item.kind === "commit" || item.kind === "pull") && !repos.includes(item.repo)) {
      repos.push(item.repo);
    }
  }

  return {
    commits: commits.total_count,
    pullRequests: pulls.total_count,
    issues: issues.total_count,
    reviews: reviews.total_count,
    items,
    repos,
    unavailable,
  };
}
