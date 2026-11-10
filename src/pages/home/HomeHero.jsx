export function HomeHero() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" aria-hidden="true"></span>
            {' Full-stack developer · Toronto'}
          </p>
          <h1 id="hero-title">
            <span className="sr-only">Building full-stack products for real people</span>{' '}
            <span className="hero-visual" aria-hidden="true">
              Building
              <br />
              <span className="hero-highlight">
                full-stack
                <br />
                products
              </span>
              <span className="hero-motion-line">
                <span
                  id="hero-motion"
                  className="hero-motion-text"
                  data-phrases="for real people|from idea to launch|for web and mobile|with reliable systems"
                >
                  for real people
                </span>
              </span>
            </span>
          </h1>
          <p className="hero-description">
            From realtime messaging and secure databases to native desktop integrations — I like
            making the parts people see work reliably with the systems underneath.
          </p>
          <div className="actions">
            <a className="button primary" href="#projects">
              {'Explore my work '}
              <span aria-hidden="true">↓</span>
            </a>
            <a
              className="button secondary"
              href="/assets/phillip-onofua-resume.pdf"
              target="_blank"
              rel="noreferrer"
            >
              {'View résumé '}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="hero-meta">
            <p className="availability">
              <span className="status-dot" aria-hidden="true"></span>
              {' Seeking a co-op or internship · Summer 2027 · Toronto / Remote'}
            </p>
            <button id="hero-motion-toggle" className="motion-toggle" type="button" hidden>
              Pause animation
            </button>
          </div>
        </div>
        <div className="hero-work" aria-label="A preview of my selected projects">
          <span className="preview-label mono">
            {'A FEW THINGS I’VE BUILT '}
            <span aria-hidden="true">↘</span>
          </span>{' '}
          <a
            className="preview-window preview-market"
            href="student-market.html"
            aria-label="Read the Student Market of Toronto case study"
          >
            <div className="window-bar" aria-hidden="true">
              <span className="window-dots">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span>Student Market of Toronto</span>
              <span>↗</span>
            </div>
            <img
              src="/assets/student-market-browse-desktop.png"
              alt="Student Market marketplace showing categories and student listings"
              width="1440"
              height="1000"
              fetchPriority="high"
            />
          </a>{' '}
          <a
            className="preview-window preview-overlay"
            href="overlay-studio.html"
            aria-label="Read the Overlay Studio case study"
          >
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
              alt="Overlay Studio’s desktop customizer and live overlay preview"
              width="1280"
              height="720"
            />
          </a>
          <div className="preview-note mono">
            <span aria-hidden="true">↳</span>
            {' From browser to desktop.'}
            <br />
            <span className="preview-note-indent">Built end to end.</span>
          </div>
        </div>
      </section>
      <div className="hero-bottom">
        <nav className="work-strip" aria-label="Project types">
          <a href="#student-market">Web</a>
          <span aria-hidden="true">/</span> <a href="#overlay-studio">Desktop</a>
          <span aria-hidden="true">/</span> <a href="#restaurant-guide">Mobile</a>
          <span aria-hidden="true">/</span> <a href="off-the-clock/">3D</a>
        </nav>
        <a href="#projects">
          {'Selected work '}
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </>
  );
}
