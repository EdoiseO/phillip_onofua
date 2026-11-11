export function CollectionStory() {
  return (
    <section className="story" aria-labelledby="title">
      <p className="eyebrow" id="eyebrow">
        04 / OFF THE CLOCK
      </p>
      <h1 id="title">
        My comic
        <br />
        collection
        <span className="period">.</span>
      </h1>
      <p className="description" id="description">
        Away from coding, I collect comics. Take a look through my short box.
      </p>
      <div className="actions">
        <button className="inspect-button collection-fade" id="inspect-button" hidden>
          {'Take a closer look '}
          <span aria-hidden="true">⤢</span>
        </button>
        <button className="decorate-button collection-fade" id="decorate-button" disabled>
          <span className="sticker-icon" aria-hidden="true">
            ✦
          </span>
          {' Make it yours '}
          <span className="sticker-button-note">STICKER PACK / 01</span>
        </button>
        <div className="compact-collection-switch" role="group" aria-label="Choose collection">
          <button type="button" id="collection-comics" aria-pressed="true">
            Comics
          </button>
          <button type="button" id="collection-compacts" aria-pressed="false" disabled>
            Compacts
          </button>
        </div>
        <p className="small-hint collection-hint">
          <span className="collection-fade" id="left-hint">
            A SMALL COLLECTION. A FEW BIG ADVENTURES.
          </span>
          <span className="collection-fade" id="compact-left-hint" inert aria-hidden="true">
            Click a book to take a closer look.
          </span>
        </p>
      </div>
      <div className="reading-progress collection-fade" id="reading-progress" hidden>
        <span id="issue-count">01 / 05</span>
        <div className="progress-track">
          <div id="progress-fill"></div>
        </div>
        <span>THE COLLECTION</span>
      </div>
    </section>
  );
}
