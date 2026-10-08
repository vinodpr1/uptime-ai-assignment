import type { TabId } from "../types";
import { sectionTitle } from "../ui/layout";

const LABELS: Record<Exclude<TabId, "overview">, string> = {
  repositories: "Repositories",
  projects: "Projects",
  packages: "Packages",
  stars: "Stars",
};

interface EmptyTabProps {
  tab: Exclude<TabId, "overview">;
}

export function EmptyTab({ tab }: EmptyTabProps) {
  return (
    <section className="min-h-80 pt-2">
      <h2 className={sectionTitle}>{LABELS[tab]} Feature coming soom</h2>
    </section>
  );
}
