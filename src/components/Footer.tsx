import { MarkIcon } from "./Icons";

const footerItems = [
  "Terms",
  "Privacy",
  "Security",
  "Status",
  "Community",
  "Docs",
  "Contact",
  "Manage cookies",
  "Do not share my personal information",
] as const;

export function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 border-t border-border px-4 pt-8 pb-10 text-xs text-muted">
      <a
        className="inline-flex text-muted no-underline hover:text-fg hover:no-underline"
      >
        <MarkIcon />
      </a>
      <span className="text-xs font-bold">© {new Date().getFullYear()} GitHub, Inc.</span>
      <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {footerItems.map((label) => (
          <span className="text-xs font-bold" key={label}>
            {label}
          </span>
        ))}
      </nav>
    </footer>
  );
}
