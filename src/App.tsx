import { useEffect, useState } from "react";
import { GITHUB_USERNAME } from "./config";
import { useGitHubProfile } from "./hooks/useGitHubProfile";
import type { TabId } from "./types";
import { EmptyTab } from "./components/EmptyTab";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Overview } from "./components/Overview";
import { ProfileNav } from "./components/ProfileNav";
import { cn } from "./lib/cn";
import { pageContainer } from "./ui/layout";

const App = () => {
  const [tab, setTab] = useState<TabId>("overview");
  const profile = useGitHubProfile(GITHUB_USERNAME);

  useEffect(() => {
    const login = profile.user?.login ?? GITHUB_USERNAME;
    const name = profile.user?.name;
    document.title = name ? `${login} (${name})` : login;
  }, [profile.user]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={profile.user} onNavigate={setTab} />
      <ProfileNav
        tab={tab}
        onTab={setTab}
        repoCount={profile.user?.publicRepos}
        starCount={profile.loading ? undefined : profile.starred.length}
      />
      <main className={cn(pageContainer, "flex-1 py-6 pb-12")}>
        {profile.userError && !profile.user ? (
          <div className="flex min-h-60 flex-col items-start gap-3">
            <p>{profile.userError}</p>
            <p className="mt-2 text-muted">
              If this keeps happening, wait a minute (GitHub rate limit) or add{" "}
              <code>VITE_GITHUB_TOKEN</code> in <code>.env.local</code> and restart{" "}
              <code>npm run dev</code>.
            </p>
            <button
              type="button"
              className="mt-4 block w-full max-w-80 rounded-md border border-[rgba(31,35,40,0.15)] bg-subtle px-4 py-[5px] text-center font-medium text-fg no-underline hover:bg-[#eff2f5] hover:no-underline"
              onClick={profile.retry}
            >
              Try again
            </button>
          </div>
        ) : tab === "overview" ? (
          <Overview profile={profile} />
        ) : (
          <EmptyTab tab={tab} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
