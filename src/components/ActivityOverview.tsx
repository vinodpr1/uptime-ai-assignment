import { useMemo } from "react";
import { buildActivityDistributionFromData } from "../activity/overviewData";
import type { ActivityData, GitHubOrg } from "../types";
import { ActivityDistributionChart } from "./ActivityDistributionChart";
import { ContributedReposLine } from "./ContributedReposLine";

interface ActivityOverviewProps {
  activity: ActivityData | null;
  loading: boolean;
  orgs: GitHubOrg[];
}

export function ActivityOverview({ activity, loading, orgs }: ActivityOverviewProps) {
  const distribution = useMemo(() => buildActivityDistributionFromData(activity), [activity]);

  return (
    <div className="-mx-4 mt-4 border-t border-border px-4 pt-4 pb-2">
      {orgs.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {orgs.map((org) => (
            <a
              key={org.login}
              href={org.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-canvas px-2.5 py-0.5 text-xs font-medium text-fg no-underline hover:border-[#afb8c1] hover:no-underline"
            >
              <img src={org.avatarUrl} alt="" className="size-4 rounded-full" />
              @{org.login}
            </a>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(200px,42%)] md:items-center">
        <div className="min-w-0 md:pr-3">
          <h3 className="m-0 mb-3 text-base font-semibold text-fg">Activity overview</h3>
          {loading ? (
            <>
              <div className="skeleton h-4 w-[85%]" />
              <div className="skeleton mt-2 h-4 w-[60%]" />
            </>
          ) : (
            <ContributedReposLine repos={activity?.repos ?? []} />
          )}
        </div>
        <div className="flex justify-center border-border md:border-l md:pl-3 md:justify-end">
          {!loading && <ActivityDistributionChart model={distribution} />}
        </div>
      </div>
    </div>
  );
}
