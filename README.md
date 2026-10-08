# GitHub Profile (Uptime Assignment)

A responsive **GitHub-style user profile** built with React, TypeScript, Vite, and Tailwind CSS. The UI mirrors GitHub’s profile layout: header, tab navigation, sidebar, pinned repositories, contribution heatmap, activity overview chart, and contribution activity timeline.

Live data is loaded from the **GitHub REST API** (and related endpoints) for the configured user. Styling uses **Tailwind CSS v4** utility classes.

Default profile: **[vinodpr1](https://github.com/vinodpr1)** — change via `src/config.ts`.

## Features

- **Header** — navigation menu, avatar, username, search, and GitHub-like action icons
- **Profile tabs** — Overview, Repositories, Projects, Packages, Stars (non-overview tabs show placeholders)
- **Sidebar** — avatar, bio, followers/following, profile metadata, achievements (GraphQL), organizations
- **Popular repositories** — pinned-style repo cards with language and star counts
- **Contribution graph** — ECharts heatmap with year selector (calendar data from [jogruber.de](https://github-contributions-api.jogruber.de/v4) contribution API)
- **Activity overview** — contributed repos list and quadrant distribution chart (commits, PRs, issues, code reviews)
- **Contribution activity** — monthly grouped commits, pull requests, issues, and reviews from GitHub search APIs

## Tech stack

| Layer | Choice |
|--------|--------|
| UI | React 19, TypeScript |
| Build | Vite 8 |
| Styles | Tailwind CSS 4 (`@tailwindcss/vite`) |
| Charts | Apache ECharts (contribution heatmap) |
| Icons | Inline SVG (Octicons-style paths) |

## Getting started

### Prerequisites

- Node.js 20+ (recommended)
- npm

### Install and run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Build and preview

```bash
npm run build
npm run preview
```

### Lint

```bash
npm run lint
```

## GitHub API and rate limits

In development, requests go through a Vite proxy at `/github-api` → `api.github.com`, with optional authentication.

Without a token, GitHub’s **anonymous rate limit** is low; the app loads the user first and caches profile data in `sessionStorage` to reduce duplicate calls.

### Optional: personal access token (local only)

1. Copy the example file:

   ```bash
   cp .env.example .env.local
   ```

2. Add a fine-grained or classic PAT with at least **public** read access:

   ```env
   VITE_GITHUB_TOKEN=ghp_xxxxxxxx
   ```

3. Restart the dev server.

**Never commit `.env` or `.env.local`.** They are gitignored. Use `.env.example` as the committed template only.

If a token was ever committed, **revoke it** on GitHub and create a new one.

## Change profile username

Edit `src/config.ts`:

```ts
export const GITHUB_USERNAME = "your-github-login";
```

## Project structure

```
src/
├── api.ts                 # GitHub REST/GraphQL fetch helpers
├── config.ts              # Profile login constant
├── hooks/
│   └── useGitHubProfile.ts
├── activity/
│   └── overviewData.ts    # Activity overview counts & chart model
├── components/            # UI sections (Header, Sidebar, graphs, …)
├── calendar.ts            # Contribution calendar grid helpers
├── profileLinks.ts        # Sidebar metadata from user + social accounts
├── types.ts
├── index.css              # Tailwind import, theme tokens, skeleton utility
└── App.tsx
```

## Data sources (summary)

| Feature | Source |
|---------|--------|
| User, repos, orgs, starred | GitHub REST `/users`, `/repos`, `/orgs`, `/starred` |
| Achievements | GitHub GraphQL `user.achievements` |
| Contribution calendar | Third-party contributions API (public calendar) |
| Activity counts & timeline | GitHub search API (commits, PRs, issues, reviews) |

## License

Private assignment project unless otherwise specified by your organization.
