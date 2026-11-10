import { SiteShell } from './SiteShell.jsx';

export function CaseStudyPage({ children }) {
  return (
    <SiteShell section="case-study" backHref="index.html#projects" backLabel="Back to projects">
      <main className="case-study-main">{children}</main>
    </SiteShell>
  );
}
