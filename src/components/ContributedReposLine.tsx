import { contributedReposSummary } from "../activity/overviewData";
import { BookIcon } from "./Icons";

interface ContributedReposLineProps {
  repos: string[];
}

export function ContributedReposLine({ repos }: ContributedReposLineProps) {
  const summary = contributedReposSummary(repos);

  if (summary.empty) {
    return <p className="m-0 text-sm text-fg">No public contributions in the last year.</p>;
  }

  const { shown, rest } = summary;

  return (
    <p className="m-0 flex items-start gap-2 text-sm text-fg">
      <BookIcon className="mt-0.5 shrink-0 text-muted" />
      <span>
        Contributed to{" "}
        {shown.map((repo, index) => {
          const isLast = index === shown.length - 1;
          let separator = "";
          if (index > 0) {
            separator = isLast && rest === 0 ? " and " : ", ";
          }
          return (
            <span key={repo}>
              {separator}
              <a href={`https://github.com/${repo}`} target="_blank" rel="noreferrer">
                {repo}
              </a>
            </span>
          );
        })}
        {rest > 0 && (
          <>
            {" "}
            and {rest} other {rest === 1 ? "repository" : "repositories"}
          </>
        )}
      </span>
    </p>
  );
}
