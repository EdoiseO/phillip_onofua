export function HomeHeader() {
  return (
    <header className="portfolio-header">
      <a className="identity" href="#top" aria-label="Phillip Onofua, back to top">
        <img
          className="identity-photo"
          src="/assets/profile-photo.jpg"
          width="44"
          height="44"
          alt="Phillip Onofua"
        />
        <span>
          Phillip Onofua
          <span className="identity-role">Full-stack developer</span>
        </span>
      </a>
      <nav className="navigation" aria-label="Primary navigation">
        <a href="#projects">Work</a>
        <a href="#about">About</a> <a href="off-the-clock/">Off the clock</a>{' '}
        <a href="#contact">
          {'Contact '}
          <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </header>
  );
}
