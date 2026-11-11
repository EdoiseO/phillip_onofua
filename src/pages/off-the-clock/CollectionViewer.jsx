import { CompactsDialog } from './CompactsDialog.jsx';

export function CollectionViewer({ stageRef }) {
  return (
    <section
      className="viewer"
      data-open="false"
      data-ready="false"
      aria-label="Interactive 3D collection"
    >
      <div className="comics-panel collection-panel collection-fade">
        <div
          className="stage"
          id="stage"
          tabIndex="0"
          role="region"
          aria-label="Comic box. Enter opens or closes. Arrow keys browse; I inspects. Drag the box to turn or drag the lid to move and tilt it. Click the raised cover for a closer look. Click the lid to close. Escape closes."
          ref={stageRef}
        >
          <div className="stage-glow" aria-hidden="true"></div>
          <div className="loading" id="loading">
            <span></span>
            <p>Unpacking a few worlds</p>
          </div>
          <div className="unavailable" id="unavailable" hidden>
            <h2>A little more graphics power, please.</h2>
            <p>
              This 3D experiment needs WebGL 2. Try another browser or enable hardware acceleration.
            </p>
          </div>
          <span className="stage-label" aria-hidden="true">
            EST. OFF THE CLOCK
          </span>
        </div>
        <label className="series-jump" id="series-jump" hidden>
          <select id="series-select" disabled aria-label="Jump to series"></select>
        </label>
        <div className="browse-controls" id="browse-controls" hidden>
          <button className="arrow" id="previous" aria-label="Previous comic">
            ←
          </button>
          <div className="comic-tabs" id="comic-tabs" role="group" aria-label="Select a comic"></div>
          <button className="arrow" id="next" aria-label="Next comic">
            →
          </button>
        </div>
        <p className="open-cue" id="open-cue">
          <svg className="tap-icon" viewBox="0 0 28 28" aria-hidden="true">
            <circle className="tap-ring" cx="10" cy="9" r="7"></circle>
            <path d="M8 17V9a2 2 0 0 1 4 0v5l2-1 2 1 2-1 3 2v5l-3 5h-8l-5-6a2 2 0 0 1 3-2Z"></path>
          </svg>
          <span id="open-cue-label">Click the box to explore</span>
        </p>
        <p className="gesture-hint" id="gesture-hint" hidden>
          <span className="mouse-icon" aria-hidden="true"></span>
          {'Click the box to open '}
          <span className="hint-dot">·</span>
          {' Drag to turn'}
        </p>
        <div className="mobile-collection" id="mobile-collection" hidden>
          <label htmlFor="comic-ruler">
            <span id="comic-ruler-caption">BROWSE</span>
            <output id="comic-ruler-value" htmlFor="comic-ruler">
              01 / 24
            </output>
          </label>
          <input
            id="comic-ruler"
            type="range"
            min="0"
            max="23"
            step="1"
            defaultValue="0"
            aria-label="Browse comics"
            disabled
          />
        </div>
        <p className="mobile-collection-note" id="comic-ruler-note" hidden></p>
      </div>
      <CompactsDialog />
    </section>
  );
}
