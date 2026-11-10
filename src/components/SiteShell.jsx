const defaultFooterLinks = [
  { href: 'privacy.html', label: 'Privacy' },
  { href: 'terms.html', label: 'Terms' },
];

export function SiteShell({ section, backHref, backLabel, footerLinks = defaultFooterLinks, children }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="index.html" aria-label="Phillip Onofua portfolio home">
            <img src="/assets/profile-photo.jpg" width="44" height="44" alt="Phillip Onofua" />
            <span><strong>Phillip Onofua</strong><small>Full-Stack Developer</small></span>
          </a>
          <a className={`${section}-header-link`} href={backHref}>{backLabel}</a>
        </div>
      </header>

      {children}

      <footer className="site-footer">
        <p>© 2026 Phillip Onofua</p>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="index.html">Portfolio</a>
          {footerLinks.map(({ href, label }) => <a href={href} key={href}>{label}</a>)}
        </nav>
      </footer>
    </div>
  );
}
