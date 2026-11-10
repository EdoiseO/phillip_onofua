export function MarketConclusion() {
  return (
    <section className="case-study-end" aria-label="Student Market project conclusion">
      <div className="case-study-result">
        <p className="eyebrow">What this project demonstrates</p>
        <h2>A marketplace built around reliable state.</h2>
        <p>
          This project connects the work users see with the rules beneath it: authenticated server
          rendering, recoverable writes, realtime messaging, and auditable moderation. Database
          tests exercise the actual PostgreSQL migration chain.
        </p>
      </div>
      <p>Continue exploring</p>
      <nav aria-label="Project navigation">
        <a href="overlay-studio.html">Explore how Overlay Studio works</a>{' '}
        <a href="index.html#projects">All featured projects</a>
      </nav>
    </section>
  );
}
