import { LegalPage } from '../components/LegalPage.jsx';

export function Privacy() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="This portfolio is designed to share my work without collecting more information than necessary."
      footerLink={{ href: 'terms.html', label: 'Terms' }}
    >
      <section aria-labelledby="privacy-collection">
        <h2 id="privacy-collection">Information this site collects</h2>
        <p>This site does not use account registration, contact forms, advertising cookies, or analytics scripts. I do not intentionally collect personal information through the website.</p>
      </section>

      <section aria-labelledby="privacy-hosting">
        <h2 id="privacy-hosting">Hosting data</h2>
        <p>The site is hosted by Vercel. Like most hosting providers, Vercel may process standard request information such as an IP address, browser details, requested pages, and timestamps for security and service operation. Their handling of that data is governed by their own privacy practices.</p>
      </section>

      <section aria-labelledby="privacy-links">
        <h2 id="privacy-links">Email and external links</h2>
        <p>Selecting the email link opens your email application. Any message you choose to send is handled by your email provider and mine. Links to GitHub and project websites hosted on Cloudflare or Vercel take you to services with their own privacy policies.</p>
      </section>

      <section aria-labelledby="privacy-contact">
        <h2 id="privacy-contact">Questions</h2>
        <p>For questions about this policy, contact me at <a href="mailto:phillip.onofua@gmail.com">phillip.onofua@gmail.com</a>.</p>
      </section>
    </LegalPage>
  );
}
