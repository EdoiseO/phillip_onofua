import { SiteShell } from './SiteShell.jsx';

export function LegalPage({ title, intro, footerLink, children }) {
  return (
    <SiteShell section="legal" backHref="index.html" backLabel="Back to portfolio" footerLinks={[footerLink]}>
      <main className="legal-content">
        <p className="eyebrow">Effective August 16, 2026</p>
        <h1>{title}</h1>
        <p className="legal-intro">{intro}</p>
        <div className="legal-sections">
          {children}
        </div>
      </main>
    </SiteShell>
  );
}
