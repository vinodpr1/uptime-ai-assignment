import type { GitHubRepo } from "../types";
import { languageColor } from "../languageColors";
import { displayUrl, withProtocol } from "../repos";
import { sectionTitle } from "../ui/layout";
import { StarIcon } from "./Icons";

interface PopularReposProps {
  repos: GitHubRepo[];
  loading: boolean;
  profileUrl: string;
}

export function PopularRepos({ repos, loading, profileUrl }: PopularReposProps) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 id="popular-heading" className={sectionTitle}>
          Popular repositories
        </h2>
        <a href={profileUrl} target="_blank" rel="noreferrer">
          Customize your pins
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="skeleton min-h-[118px]" />
          ))}
        </div>
      ) : repos.length === 0 ? (
        <p className="mt-2 text-muted">No public repositories yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          {repos.map((repo) => (
            <article
              key={repo.fullName}
              className="flex min-h-[118px] min-w-0 flex-col overflow-hidden rounded-md border border-border bg-white p-4 hover:border-[#afb8c1]"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="m-0 min-w-0 text-sm font-semibold">
                  <a className="break-words" href={repo.url} target="_blank" rel="noreferrer">
                    {repo.name}
                  </a>
                </h3>
                <span className="shrink-0 rounded-full border border-border px-[7px] text-xs font-medium leading-[18px] text-fg">
                  Public
                </span>
              </div>
              {repo.fork && (
                <p className="mt-1 text-xs text-muted">
                  {repo.parent ? (
                    <>
                      Forked from{" "}
                      <a className="text-muted" href={`https://github.com/${repo.parent}`} target="_blank" rel="noreferrer">
                        {repo.parent}
                      </a>
                    </>
                  ) : (
                    "Forked repository"
                  )}
                </p>
              )}
              {repo.description && (
                <p className="mt-2 line-clamp-2 text-xs text-muted">{repo.description}</p>
              )}
              {repo.homepage && (
                <a
                  className="mt-1.5 block truncate text-xs"
                  href={withProtocol(repo.homepage)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {displayUrl(repo.homepage)}
                </a>
              )}
              <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-muted">
                {repo.language && (
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="inline-block size-3 rounded-full"
                      style={{ background: languageColor(repo.language) }}
                    />
                    {repo.language}
                  </span>
                )}
                {repo.stars > 0 && (
                  <span className="inline-flex items-center gap-1 [&_svg]:size-3.5">
                    <StarIcon />
                    {repo.stars.toLocaleString()}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
