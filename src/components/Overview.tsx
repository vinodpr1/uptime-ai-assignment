import { useMemo } from "react";
import type { ProfileState } from "../hooks/useGitHubProfile";
import { popularRepos } from "../repos";
import { ContributionActivity } from "./ContributionActivity";
import { ContributionGraph } from "./ContributionGraph";
import { PopularRepos } from "./PopularRepos";
import { Sidebar } from "./Sidebar";

export function Overview({ profile }: { profile: ProfileState }) {
  const pins = useMemo(() => popularRepos(profile.repos), [profile.repos]);
  const profileUrl = profile.user?.url ?? "https://github.com/vinodpr1";

  return (
    <div className="grid items-start gap-6 max-[1012px]:grid-cols-1 grid-cols-[296px_minmax(0,1fr)]">
      <Sidebar user={profile.user} orgs={profile.orgs} loading={profile.loading && !profile.user} />
      <div className="flex min-w-0 flex-col gap-6">
        <PopularRepos repos={pins} loading={profile.loading && profile.repos.length === 0} profileUrl={profileUrl} />
        <ContributionGraph
          data={profile.contributions}
          activity={profile.activity}
          orgs={profile.orgs}
          loading={profile.loading && !profile.contributions}
          activityLoading={profile.loading && !profile.activity}
          error={profile.contributionError}
        />
        <ContributionActivity activity={profile.activity} loading={profile.loading && !profile.activity} />
        <p className="mt-2 text-center text-xs text-muted">
          Seeing something unexpected? Take a look at the{" "}
          <a
            href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/about-your-profile"
            target="_blank"
            rel="noreferrer"
          >
            GitHub profile guide
          </a>
          .
        </p>
      </div>
    </div>
  );
}
