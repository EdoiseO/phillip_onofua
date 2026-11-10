export function MarketLightbox() {
  return (
    <dialog
      className="case-study-lightbox"
      data-gallery-dialog=""
      aria-labelledby="gallery-dialog-title"
    >
      <div className="case-study-lightbox-shell">
        <header className="case-study-lightbox-header">
          <div>
            <p data-gallery-group-label="">Implementation evidence</p>
            <h2 id="gallery-dialog-title" data-gallery-title="">
              Student Market interface
            </h2>
          </div>
          <button type="button" data-gallery-close="" aria-label="Close gallery">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18"></path>
            </svg>
          </button>
        </header>
        <div className="case-study-lightbox-stage">
          <figure className="case-study-lightbox-figure">
            <img
              data-gallery-image=""
              src="/assets/student-market-browse-desktop.png"
              alt="Student Market marketplace"
              width="1440"
              height="1000"
            />
          </figure>
          <button
            className="case-study-lightbox-arrow case-study-lightbox-arrow--previous"
            type="button"
            data-gallery-prev=""
            aria-label="Show previous image"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7"></path>
            </svg>
          </button>
          <button
            className="case-study-lightbox-arrow case-study-lightbox-arrow--next"
            type="button"
            data-gallery-next=""
            aria-label="Show next image"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
        <div className="case-study-lightbox-footer">
          <div
            className="case-study-lightbox-thumbnails"
            data-gallery-thumbnails=""
            role="group"
            aria-label="Choose gallery image"
          ></div>
          <div className="case-study-lightbox-zoom" role="group" aria-label="Image zoom controls">
            <button type="button" data-gallery-zoom-out="" aria-label="Zoom out" disabled>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14"></path>
              </svg>
            </button>
            <output data-gallery-zoom-level="" aria-live="polite">
              100%
            </output>
            <button type="button" data-gallery-zoom-in="" aria-label="Zoom in">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M12 5v14"></path>
              </svg>
            </button>
          </div>
          <a
            data-gallery-original=""
            href="/assets/student-market-browse-desktop.png"
            target="_blank"
            rel="noreferrer"
          >
            Open full resolution
          </a>
        </div>
      </div>
    </dialog>
  );
}
