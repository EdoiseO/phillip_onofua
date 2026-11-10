export function HomeProjects() {
  return (
    <section id="projects" className="section projects" aria-labelledby="projects-title">
      <div className="section-title">
        <p className="eyebrow">01 / Selected work</p>
        <h2 id="projects-title">From database to desktop.</h2>
        <p>
          A marketplace, a Windows desktop app, an Android prototype, and an interactive 3D project.
        </p>
      </div>
      <article className="project project-market" id="student-market">
        <a
          className="project-visual"
          href="student-market.html"
          aria-label="Explore the Student Market of Toronto case study"
        >
          <div className="project-browser">
            <div className="window-bar" aria-hidden="true">
              <span className="window-dots">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span>student-market-of-toronto.vercel.app</span>
              <span>↗</span>
            </div>
            <img
              src="/assets/student-market-browse-desktop.png"
              alt="Student Market’s working marketplace with product categories, prices, and campus information"
              width="1440"
              height="1000"
              loading="lazy"
              decoding="async"
            />
          </div>
        </a>
        <div className="project-copy">
          <p className="project-status">
            <span className="status-dot" aria-hidden="true"></span>
            {' Live web project'}
          </p>
          <h3>
            Student Market
            <br />
            {' of Toronto'}
          </h3>
          <p>
            A full-stack marketplace with realtime chat, reliable uploads, and role-based moderation
            backed by database-enforced permissions and audit logs.
          </p>
          <div className="contribution">
            <span className="mono">MY ROLE / TEAM LEAD &amp; DEVELOPER</span>
            <p>
              I led a team of five and developed the interface, database, authentication, messaging,
              and administration workflows.
            </p>
          </div>
          <ul className="stack" aria-label="Student Market technologies and testing">
            <li>Next.js</li>
            <li>React</li>
            <li>Supabase</li>
            <li>PostgreSQL</li>
            <li>75 test files</li>
            <li>56 migrations</li>
            <li>14 route handlers</li>
          </ul>
          <div className="project-links">
            <a className="text-link" href="student-market.html">
              {'Read case study '}
              <span aria-hidden="true">↗</span>
            </a>
            <a
              className="quiet-link"
              href="https://student-market-of-toronto.vercel.app/"
              target="_blank"
              rel="noreferrer"
            >
              {'Live site '}
              <span aria-hidden="true">↗</span>
            </a>
            <a
              className="quiet-link"
              href="https://github.com/EdoiseO/student-market-of-toronto"
              target="_blank"
              rel="noreferrer"
            >
              {'Source '}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </article>
      <article className="project project-overlay" id="overlay-studio">
        <a
          className="project-visual"
          href="overlay-studio.html"
          aria-label="Explore the Overlay Studio case study"
        >
          <div className="project-browser">
            <div className="window-bar" aria-hidden="true">
              <span className="window-dots">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span>Overlay Studio</span>
              <span>↗</span>
            </div>
            <img
              src="/assets/overlay-studio-customizer.png"
              alt="Overlay Studio with appearance controls and a live Twitch badge preview"
              width="1280"
              height="720"
              loading="lazy"
              decoding="async"
            />
          </div>
        </a>
        <div className="project-copy">
          <p className="project-status">
            <span className="status-dot status-dot--blue" aria-hidden="true"></span>
            {' Working application · Active development'}
          </p>
          <h3>Overlay Studio</h3>
          <p>
            A Windows desktop app for building and running live OBS overlays: 12 overlays,
            audio-reactive animation, and live WebSocket sync.
          </p>
          <div className="contribution">
            <span className="mono">MY ROLE / DESIGNER &amp; DEVELOPER</span>
            <p>
              I built the desktop interface, reusable overlay library, saved settings, and the live
              connection between Windows media and OBS.
            </p>
          </div>
          <ul className="stack" aria-label="Overlay Studio technologies">
            <li>Python</li>
            <li>aiohttp</li>
            <li>WebSockets</li>
            <li>WebView2</li>
            <li>28 test files</li>
          </ul>
          <div className="project-links">
            <a className="text-link" href="overlay-studio.html">
              {'Explore the project '}
              <span aria-hidden="true">↗</span>
            </a>
            <a className="quiet-link" href="overlay-studio.html#overlay-demo">
              {'Watch demo '}
              <span aria-hidden="true">↗</span>
            </a>
            {/* TODO: Add https://github.com/EdoiseO/overlay-studio after the owner confirms it is public. */}
          </div>
        </div>
      </article>
      <article className="project project-restaurant" id="restaurant-guide">
        <div className="project-visual">
          <div className="project-browser">
            <div className="window-bar" aria-hidden="true">
              <span className="window-dots">
                <i></i>
                <i></i>
                <i></i>
              </span>{' '}
              <span>Restaurant Guide · Android app</span>
              <span>↗</span>
            </div>
            <div className="restaurant-gallery" aria-label="Restaurant Guide app screens">
              <figure className="restaurant-gallery-home">
                <a
                  href="/assets/restaurant-guide/rg-home.jpg"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open the Restaurant Guide home screen"
                >
                  <img
                    src="/assets/restaurant-guide/rg-home.jpg"
                    alt="Restaurant Guide home screen with a saved count, search, tag filters and restaurant cards"
                    width="824"
                    height="1687"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
                <figcaption>Home</figcaption>
              </figure>
              <figure>
                <a
                  href="/assets/restaurant-guide/rg-detail.jpg"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open the Restaurant Guide details screen"
                >
                  <img
                    src="/assets/restaurant-guide/rg-detail.jpg"
                    alt="Restaurant details with a full-width photo, star rating, tags, photos, address and a Share, Open in Maps and Delete bar"
                    width="824"
                    height="1687"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
                <figcaption>Details</figcaption>
              </figure>
              <figure className="restaurant-gallery-rating">
                <a
                  href="/assets/restaurant-guide/rg-rating.jpg"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open the Restaurant Guide rating dialog"
                >
                  <img
                    src="/assets/restaurant-guide/rg-rating.jpg"
                    alt="Rating dialog showing 4.5 out of 5 stars, set by sliding across the stars"
                    width="824"
                    height="392"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
                <figcaption>Half-star rating</figcaption>
              </figure>
            </div>
          </div>
        </div>
        <div className="project-copy">
          <p className="project-status">
            <span className="status-dot status-dot--blue" aria-hidden="true"></span>
            {' Team project · Lead developer'}
          </p>
          <h3>Restaurant Guide</h3>
          <p>
            An Android app for saving the restaurants you visit, built with Kotlin and Jetpack
            Compose. Search and filter by tag, rate in half stars, add photos and visit notes, and
            share a restaurant.
          </p>
          <div className="contribution">
            <span className="mono">PROTOTYPE / ANDROID</span>
            <p>Records currently use session and saved UI state; durable storage is planned.</p>
          </div>
          <ul className="stack" aria-label="Restaurant Guide technologies">
            <li>Kotlin</li>
            <li>Jetpack Compose</li>
            <li>Android</li>
          </ul>
          <div className="project-links">
            <a
              className="text-link"
              href="https://github.com/EdoiseO/COMP3074-RestaurantGuide"
              target="_blank"
              rel="noreferrer"
            >
              {'View source '}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </article>
      <section className="smaller-builds" aria-labelledby="smaller-builds-title">
        <div className="smaller-builds-heading">
          <p className="eyebrow">More work</p>
          <h3 id="smaller-builds-title">Smaller builds</h3>
        </div>
        <ul className="build-list">
          <li>
            <a
              className="build-row"
              href="https://github.com/EdoiseO/chatgpt-read-aloud"
              target="_blank"
              rel="noreferrer"
            >
              <span className="build-name">ChatGPT Read Aloud</span>{' '}
              <span className="build-desc">
                A local read-aloud add-on for Codex conversations in ChatGPT for Mac.
              </span>{' '}
              <span className="build-tech mono">Python · Kokoro text-to-speech</span>{' '}
              <span className="build-arrow" aria-hidden="true">
                ↗
              </span>{' '}
              <span className="sr-only">(view source on GitHub)</span>
            </a>
          </li>
          <li>
            <a
              className="build-row"
              href="https://github.com/EdoiseO/101489064_COMP3123_Assignment1"
              target="_blank"
              rel="noreferrer"
            >
              <span className="build-name">Employee REST API</span>{' '}
              <span className="build-desc">
                User authentication and employee records with owner-scoped CRUD.
              </span>{' '}
              <span className="build-tech mono">Express.js · MongoDB</span>{' '}
              <span className="build-arrow" aria-hidden="true">
                ↗
              </span>{' '}
              <span className="sr-only">(view source on GitHub)</span>
            </a>
          </li>
          <li>
            <a
              className="build-row"
              href="https://github.com/EdoiseO/neetcode-submissions"
              target="_blank"
              rel="noreferrer"
            >
              <span className="build-name">NeetCode solutions</span>{' '}
              <span className="build-desc">Data structures and algorithms practice in Python.</span>{' '}
              <span className="build-tech mono">Python</span>{' '}
              <span className="build-arrow" aria-hidden="true">
                ↗
              </span>{' '}
              <span className="sr-only">(view source on GitHub)</span>
            </a>
          </li>
          <li>
            <a
              className="build-row"
              href="https://github.com/EdoiseO/COMP2080_Group_Project_2026_TIKTACTOE"
              target="_blank"
              rel="noreferrer"
            >
              <span className="build-name">TicTacToe</span>{' '}
              <span className="build-desc">A group-built Java game with a minimax opponent.</span>{' '}
              <span className="build-tech mono">Java</span>{' '}
              <span className="build-arrow" aria-hidden="true">
                ↗
              </span>{' '}
              <span className="sr-only">(view source on GitHub)</span>
            </a>
          </li>
        </ul>
      </section>
    </section>
  );
}
