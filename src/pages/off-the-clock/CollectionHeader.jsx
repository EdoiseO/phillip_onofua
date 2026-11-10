export function CollectionHeader() {
  return (
    <>
      <a className="skip-link" href="#experience">
        Skip to the comic collection
      </a>
      <div className="portfolio-header-wrap portfolio-width">
        <header className="portfolio-header">
          <a className="identity" href="/" aria-label="Phillip Onofua, home">
            <img
              className="identity-photo"
              src="../assets/profile-photo.jpg"
              width="44"
              height="44"
              alt="Phillip Onofua"
            />{' '}
            <span>
              Phillip Onofua
              <span className="identity-role">Full-stack developer</span>
            </span>
          </a>
          <nav className="navigation" aria-label="Primary navigation">
            <a href="/#projects">Work</a> <a href="/#about">About</a>{' '}
            <a href="/off-the-clock/" aria-current="page">
              Off the clock
            </a>{' '}
            <a href="/#contact">
              {'Contact '}
              <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </header>
      </div>
    </>
  );
}
