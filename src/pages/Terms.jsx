import { LegalPage } from '../components/LegalPage.jsx';

export function Terms() {
  return (
    <LegalPage
      title="Terms of use"
      intro="These terms explain the permitted use of this portfolio and the material published on it."
      footerLink={{ href: 'privacy.html', label: 'Privacy' }}
    >
      <section aria-labelledby="terms-purpose">
        <h2 id="terms-purpose">Purpose</h2>
        <p>This website presents my professional background, projects, and contact information. You may browse it and share links to its public pages for personal, educational, recruiting, or professional purposes.</p>
      </section>

      <section aria-labelledby="terms-ownership">
        <h2 id="terms-ownership">Ownership and reuse</h2>
        <p>Unless otherwise stated, the portfolio design, written content, and original project materials belong to Phillip Onofua. Project names, product screenshots, logos, and third-party technologies may also be subject to their respective owners' rights. Do not republish substantial portions of this site as your own work.</p>
      </section>

      <section aria-labelledby="terms-accuracy">
        <h2 id="terms-accuracy">Accuracy and availability</h2>
        <p>I aim to keep project descriptions and professional information accurate, but the site may contain errors or become temporarily unavailable. Content may be updated, replaced, or removed as my work evolves.</p>
      </section>

      <section aria-labelledby="terms-links">
        <h2 id="terms-links">External services</h2>
        <p>This portfolio links to GitHub repositories, live projects, downloadable documents, and other third-party services. I am not responsible for the availability, security, or content of external websites.</p>
      </section>

      <section aria-labelledby="terms-liability">
        <h2 id="terms-liability">No warranty</h2>
        <p>The website and its materials are provided for general information and demonstration purposes. They are provided without guarantees about uninterrupted access, suitability for a particular purpose, or results from relying on the content.</p>
      </section>

      <section aria-labelledby="terms-contact">
        <h2 id="terms-contact">Questions</h2>
        <p>For questions about these terms, contact me at <a href="mailto:phillip.onofua@gmail.com">phillip.onofua@gmail.com</a>.</p>
      </section>
    </LegalPage>
  );
}
