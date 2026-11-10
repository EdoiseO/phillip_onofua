export function InspectionDialog() {
  return (
    <dialog
      className="inspection"
      id="inspection"
      aria-labelledby="inspection-title"
      aria-describedby="inspection-instructions"
    >
      <header className="inspection-header">
        <button className="back-button" id="return-button">
          {'← '}
          <span>Back to the box</span>
        </button>
        <div>
          <p className="eyebrow">A CLOSER LOOK</p>
          <h2 id="inspection-title"></h2>
          <p id="inspection-variant"></p>
        </div>
        <span className="inspection-number" id="inspection-number"></span>
      </header>
      <div className="comic-views" role="group" aria-label="Comic viewing angle">
        <button id="view-front">Front</button>
        <button id="view-comic">Inspect comic</button>
        <button id="view-back">Back</button>
      </div>
      <p className="back-image-note" id="back-image-note" hidden></p>
      <div className="inspection-stage" id="inspection-stage">
        <ol className="pull-list" id="pull-list" aria-label="What I pulled" hidden></ol>
      </div>
      <p className="sr-only" aria-live="polite" id="inspection-announcement"></p>
      <footer className="inspection-footer">
        <p id="inspection-instructions">Drag to turn the comic. Click it to open the sleeve.</p>
        <button className="primary sleeve-button" id="sleeve-button">
          {'Slide out of sleeve '}
          <span aria-hidden="true">↑</span>
        </button>
        <span className="sleeve-status" id="sleeve-status">
          BAGGED &amp; BOARDED
        </span>
      </footer>
    </dialog>
  );
}
