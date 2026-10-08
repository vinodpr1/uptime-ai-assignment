import type { ActivityData } from "../types";

export type DistributionAxisKey = "commits" | "reviews" | "issues" | "pulls";

export interface ActivityCounts {
  commits: number;
  reviews: number;
  issues: number;
  pulls: number;
}

export interface ContributedReposSummary {
  empty: boolean;
  shown: string[];
  rest: number;
}

export interface DistributionLabel {
  key: DistributionAxisKey;
  percent: number;
  label: string;
  x: number;
  y: number;
  textAnchor: "start" | "middle" | "end";
  labelDy: number;
  active: boolean;
  color: string;
}

export interface ActivityDistributionModel {
  total: number;
  counts: ActivityCounts;
  percents: Record<DistributionAxisKey, number>;
  polygonPath: string | null;
  center: { x: number; y: number };
  radius: number;
  labels: DistributionLabel[];
}

export const DISTRIBUTION_AXIS: Record<
  DistributionAxisKey,
  { label: string; angle: number }
> = {
  commits: { label: "Commits", angle: Math.PI },
  reviews: { label: "Code review", angle: -Math.PI / 2 },
  issues: { label: "Issues", angle: 0 },
  pulls: { label: "Pull requests", angle: Math.PI / 2 },
};

const AXIS_ORDER: DistributionAxisKey[] = ["commits", "reviews", "issues", "pulls"];

const CHART_CENTER = { x: 200, y: 112 };
const CHART_RADIUS = 68;

function percent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

/** Pull count fields used for the overview chart from API `ActivityData`. */
export function activityCountsFromData(activity: ActivityData | null | undefined): ActivityCounts {
  return {
    commits: activity?.commits ?? 0,
    reviews: activity?.reviews ?? 0,
    issues: activity?.issues ?? 0,
    pulls: activity?.pullRequests ?? 0,
  };
}

/** Repo list for the “Contributed to …” line (from search activity). */
export function contributedReposSummary(repos: string[] | undefined): ContributedReposSummary {
  const list = repos ?? [];
  if (list.length === 0) {
    return { empty: true, shown: [], rest: 0 };
  }
  const shown = list.slice(0, 3);
  return { empty: false, shown, rest: list.length - shown.length };
}

function pointOnAxis(
  key: DistributionAxisKey,
  percents: Record<DistributionAxisKey, number>,
  cx: number,
  cy: number,
  radius: number,
): { x: number; y: number } {
  const len = (percents[key] / 100) * radius;
  const { angle } = DISTRIBUTION_AXIS[key];
  return { x: cx + Math.cos(angle) * len, y: cy + Math.sin(angle) * len };
}

function labelForAxis(
  key: DistributionAxisKey,
  percent: number,
  cx: number,
  cy: number,
  radius: number,
): DistributionLabel {
  const active = percent > 0;
  const color = active ? "#1a7f37" : "#656d76";
  const { label, angle } = DISTRIBUTION_AXIS[key];
  const end = {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };

  let x = end.x;
  let y = end.y;
  let textAnchor: DistributionLabel["textAnchor"] = "middle";
  let labelDy = active ? 16 : 4;

  if (key === "commits") {
    textAnchor = "end";
    x = end.x - 10;
    y = end.y - 2;
  } else if (key === "reviews") {
    y = end.y - 16;
    labelDy = active ? 16 : 12;
  } else if (key === "issues") {
    textAnchor = "start";
    x = end.x + 10;
    y = end.y - 2;
  } else {
    y = end.y + 20;
    labelDy = active ? 16 : 12;
  }

  return {
    key,
    percent,
    label,
    x,
    y,
    textAnchor,
    labelDy,
    active,
    color,
  };
}

/** Builds SVG-ready distribution model (GitHub profile quadrant chart). */
export function buildActivityDistribution(counts: ActivityCounts): ActivityDistributionModel {
  const total = counts.commits + counts.reviews + counts.issues + counts.pulls;
  const percents: Record<DistributionAxisKey, number> = {
    commits: percent(counts.commits, total),
    reviews: percent(counts.reviews, total),
    issues: percent(counts.issues, total),
    pulls: percent(counts.pulls, total),
  };

  const { x: cx, y: cy } = CHART_CENTER;
  const radius = CHART_RADIUS;

  const polygonPath =
    total > 0
      ? (() => {
          const points = AXIS_ORDER.map((key) => pointOnAxis(key, percents, cx, cy, radius));
          return `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")} Z`;
        })()
      : null;

  const labels = AXIS_ORDER.map((key) => labelForAxis(key, percents[key], cx, cy, radius));

  return {
    total,
    counts,
    percents,
    polygonPath,
    center: CHART_CENTER,
    radius: CHART_RADIUS,
    labels,
  };
}

export function buildActivityDistributionFromData(
  activity: ActivityData | null | undefined,
): ActivityDistributionModel {
  return buildActivityDistribution(activityCountsFromData(activity));
}
