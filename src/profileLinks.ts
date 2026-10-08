import type { GitHubUser, SocialAccount } from "./types";
import { displayUrl, withProtocol } from "./repos";

export interface ProfileMetaItem {
  id: string;
  icon: "company" | "location" | "email" | "link" | "linkedin" | "twitter" | "hireable";
  label: string;
  href: string | null;
}

function normalizeUrl(url: string): string {
  return withProtocol(url).replace(/\/$/, "").toLowerCase();
}

function linkedinLabel(url: string): string {
  const match = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
  return match ? `in/${match[1]}` : displayUrl(url);
}

function twitterHandle(url: string): string | null {
  const match = url.match(/(?:twitter|x)\.com\/([^/?#]+)/i);
  return match ? match[1] : null;
}

function companyMeta(company: string): ProfileMetaItem {
  const trimmed = company.trim();
  const slug = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed.replace(/\s+/g, "");
  const href = slug ? `https://github.com/${slug}` : null;
  return { id: "company", icon: "company", label: trimmed, href };
}

function externalLinkLabel(url: string): string {
  return url.trim();
}

export function profileMetaItems(user: GitHubUser): ProfileMetaItem[] {
  const items: ProfileMetaItem[] = [];
  const linked = new Set<string>();

  if (user.company?.trim()) {
    items.push(companyMeta(user.company));
  }
  if (user.location?.trim()) {
    items.push({ id: "location", icon: "location", label: user.location.trim(), href: null });
  }
  if (user.email?.trim()) {
    items.push({
      id: "email",
      icon: "email",
      label: user.email.trim(),
      href: `mailto:${user.email.trim()}`,
    });
  }
  if (user.hireable) {
    items.push({ id: "hireable", icon: "hireable", label: "Available for hire", href: null });
  }
  if (user.blog?.trim()) {
    const href = withProtocol(user.blog.trim());
    linked.add(normalizeUrl(href));
    items.push({ id: "blog", icon: "link", label: displayUrl(user.blog.trim()), href });
  }

  const socialByProvider = new Map<string, SocialAccount>();
  for (const account of user.social) {
    socialByProvider.set(account.provider.toLowerCase(), account);
  }

  const linkedin = socialByProvider.get("linkedin");
  if (linkedin?.url) {
    linked.add(normalizeUrl(linkedin.url));
    items.push({
      id: "linkedin",
      icon: "linkedin",
      label: linkedinLabel(linkedin.url),
      href: linkedin.url,
    });
  }

  const twitterSocial = socialByProvider.get("twitter") ?? socialByProvider.get("x");
  if (twitterSocial?.url) {
    linked.add(normalizeUrl(twitterSocial.url));
    const handle = twitterHandle(twitterSocial.url) ?? user.twitter;
    items.push({
      id: "twitter-social",
      icon: "twitter",
      label: handle ? `@${handle}` : displayUrl(twitterSocial.url),
      href: twitterSocial.url,
    });
  } else if (user.twitter?.trim()) {
    const handle = user.twitter.trim().replace(/^@/, "");
    const href = `https://twitter.com/${handle}`;
    if (!linked.has(normalizeUrl(href))) {
      items.push({
        id: "twitter",
        icon: "twitter",
        label: `@${handle}`,
        href,
      });
    }
  }

  for (const account of user.social) {
    const provider = account.provider.toLowerCase();
    if (provider === "linkedin" || provider === "twitter" || provider === "x") continue;
    if (!account.url?.trim()) continue;
    const href = withProtocol(account.url.trim());
    if (linked.has(normalizeUrl(href))) continue;
    linked.add(normalizeUrl(href));
    items.push({
      id: `social-${provider}`,
      icon: "link",
      label: externalLinkLabel(account.url),
      href,
    });
  }

  return items;
}
