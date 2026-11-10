export function CompactsDialog() {
  return (
    <dialog className="compact-dialog" id="compact-dialog" aria-labelledby="compact-title">
      <header className="compact-header">
        <button className="back-button" id="compact-close" type="button">
          {'← '}
          <span>Back to comics</span>
        </button>
        <button className="back-button" id="compact-return" type="button" hidden>
          {'← '}
          <span>Back to display</span>
        </button>
        <div>
          <p>A CLOSER LOOK AT THE COLLECTION</p>
          <h2 id="compact-title">Compact Comics</h2>
        </div>
        <span>01 / 04</span>
      </header>
      <div
        className="compact-inspect-controls"
        hidden
        role="group"
        aria-label="Paperback viewing angle"
      >
        <button type="button" data-view="front" aria-pressed="true">
          Front
        </button>
        <button type="button" data-view="back" aria-pressed="false">
          Back
        </button>
        <button type="button" data-view="spine" aria-pressed="false">
          Spine
        </button>
      </div>
      <div
        className="compact-canvas"
        id="compact-canvas"
        tabIndex="0"
        role="region"
        aria-label="Paperback display. Select a book to inspect it."
      ></div>
      <p className="compact-note" id="compact-note">
        Click a book to take a closer look.
      </p>
      <div className="compact-book-controls" role="group" aria-label="Choose a paperback">
        <button type="button" data-book="0">
          Inspect Static: Season One
        </button>
        <button type="button" data-book="1">
          Inspect Green Arrow: Year One
        </button>
      </div>
    </dialog>
  );
}
