import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchActivity,
  fetchContributions,
  fetchOrgs,
  fetchRepos,
  fetchStarred,
  fetchUser,
  GitHubApiError,
  isAbortError,
} from "../api";
import type {
  ActivityData,
  ContributionData,
  GitHubOrg,
  GitHubRepo,
  GitHubUser,
} from "../types";

export interface ProfileState {
  user: GitHubUser | null;
  repos: GitHubRepo[];
  starred: GitHubRepo[];
  orgs: GitHubOrg[];
  contributions: ContributionData | null;
  activity: ActivityData | null;
  loading: boolean;
  userError: string | null;
  contributionError: string | null;
  retry: () => void;
}

function userErrorMessage(error: unknown): string {
  if (error instanceof GitHubApiError) return error.message;
  if (error instanceof TypeError) {
    return "Network error while loading GitHub. Check your connection and try again.";
  }
  return "Couldn't load this GitHub profile.";
}

export function useGitHubProfile(username: string): ProfileState {
  const [attempt, setAttempt] = useState(0);
  const loadIdRef = useRef(0);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [starred, setStarred] = useState<GitHubRepo[]>([]);
  const [orgs, setOrgs] = useState<GitHubOrg[]>([]);
  const [contributions, setContributions] = useState<ContributionData | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [contributionError, setContributionError] = useState<string | null>(null);

  const retry = useCallback(() => {
    setLoading(true);
    setUserError(null);
    setContributionError(null);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    const loadId = ++loadIdRef.current;
    const stale = () => loadId !== loadIdRef.current;

    async function load() {
      setLoading(true);
      setUserError(null);

      try {
        const profile = await fetchUser(username);
        if (stale()) return;
        setUser(profile);
        setUserError(null);
        setLoading(false);
      } catch (error) {
        if (stale() || isAbortError(error)) return;
        setUser(null);
        setUserError(userErrorMessage(error));
        setLoading(false);
        return;
      }

      const [repoResult, starResult, orgResult, contributionResult, activityResult] =
        await Promise.allSettled([
          fetchRepos(username),
          fetchStarred(username),
          fetchOrgs(username),
          fetchContributions(username),
          fetchActivity(username),
        ]);

      if (stale()) return;

      setRepos(repoResult.status === "fulfilled" ? repoResult.value : []);
      setStarred(starResult.status === "fulfilled" ? starResult.value : []);
      setOrgs(orgResult.status === "fulfilled" ? orgResult.value : []);

      if (contributionResult.status === "fulfilled") {
        setContributions(contributionResult.value);
        setContributionError(null);
      } else if (!isAbortError(contributionResult.reason)) {
        setContributions(null);
        setContributionError("Couldn't load the contribution graph.");
      }

      setActivity(activityResult.status === "fulfilled" ? activityResult.value : null);
    }

    void load();
  }, [username, attempt]);

  return {
    user,
    repos,
    starred,
    orgs,
    contributions,
    activity,
    loading,
    userError,
    contributionError,
    retry,
  };
}
