export function MarketIntro() {
  return (
    <>
      <section className="case-study-hero" aria-labelledby="case-study-title">
        <p className="eyebrow">01 / Selected work · Full-stack web application</p>
        <h1 id="case-study-title">Student Market of Toronto</h1>
        <p className="case-study-lead">
          A place for Toronto students to buy and sell, message each other, and manage their
          listings. I led a team of five and built the full-stack workflows behind the exchange.
        </p>
        <p className="case-study-stack">
          {'Next.js '}
          <span aria-hidden="true">/</span>
          {' React '}
          <span aria-hidden="true">/</span>
          {' Supabase '}
          <span aria-hidden="true">/</span>
          {' PostgreSQL'}
        </p>
        <div className="case-study-actions">
          <a
            className="button button--primary button--small"
            href="https://student-market-of-toronto.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            {'Open live project '}
            <svg
              className="button-icon button-icon--external"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"
              ></path>
              <path
                fillRule="evenodd"
                d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"
              ></path>
            </svg>
          </a>{' '}
          <a
            className="button button--secondary button--small"
            href="https://github.com/EdoiseO/student-market-of-toronto"
            target="_blank"
            rel="noreferrer"
          >
            {'View source '}
            <svg className="button-icon button-icon--github" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.3c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.5 5.9 18.5 6.2 18.5 6.2c.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z"></path>
            </svg>
          </a>
        </div>
        <p className="case-study-demo-note">
          {
            'The project’s deployment notes flag an unfinished private-message media rollout and advise against account deletion until it is complete. '
          }
          <a href="https://github.com/EdoiseO/student-market-of-toronto/blob/main/docs/deployment.md">
            Read the deployment notes
          </a>
          .
        </p>
        <nav className="case-study-jump-nav" aria-label="On this page">
          <span>Explore the project</span>{' '}
          <a href="#interface-gallery">
            {'The interface '}
            <span aria-hidden="true">↘</span>
          </a>{' '}
          <a href="#engineering-details">
            {'The engineering '}
            <span aria-hidden="true">↘</span>
          </a>
        </nav>
      </section>
      <figure className="case-study-product-preview">
        <button
          type="button"
          data-gallery-group="marketplace"
          aria-label="Open marketplace screenshots"
        >
          <span className="case-study-preview-bar" aria-hidden="true">
            <span className="case-study-preview-dot"></span>
            {' Student Market of Toronto '}
            <span className="case-study-preview-enlarge">View full size ↗</span>
          </span>{' '}
          <img
            src="/assets/student-market-browse-desktop.png"
            alt="Student Market desktop marketplace showing student listings, prices, campuses, search, and categories"
            width="1440"
            height="1000"
            fetchPriority="high"
          />
        </button>
        <figcaption>
          <span>From browsing to the first conversation.</span>
          <span>Desktop marketplace · Actual product interface</span>
        </figcaption>
      </figure>
      <section className="case-study-at-a-glance" aria-label="Project at a glance">
        <article>
          <p className="eyebrow">The problem</p>
          <h2>Connect the whole exchange.</h2>
          <p>
            Bring discovery, seller profiles, listings, and conversations into one student
            marketplace, with clear account and moderation controls.
          </p>
        </article>
        <article>
          <p className="eyebrow">My contribution</p>
          <h2>Five-person team. Full-stack work.</h2>
          <p>
            I led development and worked across the interface, server routes, and database,
            connecting the marketplace to messaging and moderation workflows.
          </p>
        </article>
        <article>
          <p className="eyebrow">Engineering focus</p>
          <h2>Make the important writes reliable.</h2>
          <p>
            Listings can recover from interrupted requests, permissions are checked in the database,
            and messaging updates in real time.
          </p>
        </article>
      </section>
    </>
  );
}
