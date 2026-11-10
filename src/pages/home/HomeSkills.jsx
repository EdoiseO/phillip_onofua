export function HomeSkills() {
  return (
    <section id="skills" className="section skills" aria-labelledby="skills-title">
      <div className="section-title">
        <p className="eyebrow">02 / Toolkit</p>
        <h2 id="skills-title">The tools behind the work.</h2>
      </div>
      <div className="toolkit-grid">
        <div className="toolkit">
          <span className="toolkit-number mono">01</span>
          <h3>Interfaces</h3>
          <p>Responsive web experiences, from reusable components to complete product flows.</p>
          <ul>
            <li>JavaScript &amp; TypeScript</li>
            <li>React &amp; Next.js</li>
            <li>Tailwind CSS &amp; shadcn/ui</li>
            <li>Kotlin &amp; Jetpack Compose</li>
          </ul>
          <a href="student-market.html#market-responsive">
            {'In Student Market '}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="toolkit">
          <span className="toolkit-number mono">02</span>
          <h3>Data &amp; backends</h3>
          <p>
            The authentication, data models, and realtime features that keep an application
            connected.
          </p>
          <ul>
            <li>SQL databases &amp; REST APIs</li>
            <li>Supabase (PostgreSQL, Auth, Storage)</li>
            <li>Express.js &amp; MongoDB</li>
            <li>Python &amp; WebSockets</li>
          </ul>
          <a href="student-market.html#market-system-flow">
            {'Inside the architecture '}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="toolkit">
          <span className="toolkit-number mono">03</span>
          <h3>Beyond the browser</h3>
          <p>
            Desktop integrations and the workflow that takes a project from local development to
            release.
          </p>
          <ul>
            <li>WebView2 &amp; aiohttp</li>
            <li>Git &amp; GitHub</li>
            <li>Cloudflare, Vercel &amp; Microsoft Azure</li>
            <li>Vite</li>
          </ul>
          <a href="overlay-studio.html">
            {'Inside Overlay Studio '}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <p className="additional-tools">
        <span className="mono">ADDITIONAL FRAMEWORKS</span>
        {' ASP.NET · React Native'}
      </p>
      <p className="additional-tools">
        <span className="mono">CONCEPTS &amp; COLLABORATION</span>
        {
          ' Data Structures and Algorithms · Authentication · Responsive Design · Agile collaboration · Code Reviews'
        }
      </p>
    </section>
  );
}
