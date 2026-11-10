export function StickerDialog() {
  return (
    <dialog
      className="sticker-studio"
      id="sticker-studio"
      aria-labelledby="sticker-studio-title"
      aria-describedby="sticker-feedback"
    >
      <header className="sticker-studio-header">
        <button className="back-button" id="sticker-close">
          {'← '}
          <span>Back to the box</span>
        </button>
        <div>
          <p className="eyebrow">A LITTLE MORE YOU</p>
          <h2 id="sticker-studio-title">
            Make it yours
            <span>.</span>
          </h2>
        </div>
        <span className="sticker-edition">
          {'THE STICKER CLUB '}
          <span>/ 001</span>
        </span>
      </header>
      <div className="sticker-workspace">
        <section className="sticker-canvas-area" aria-label="Decorate your comic box">
          <div className="sticker-stage" id="sticker-stage"></div>
          <aside
            className="sticker-mobile-rail"
            id="sticker-mobile-rail"
            aria-label="Sticker adjustment ruler"
          >
            <div className="sticker-ruler-switch" role="group" aria-label="Ruler control">
              <button
                id="sticker-ruler-size"
                aria-pressed="true"
                aria-controls="sticker-size-field"
              >
                Size
              </button>
              <button
                id="sticker-ruler-angle"
                aria-pressed="false"
                aria-controls="sticker-angle-field"
              >
                Angle
              </button>
            </div>
          </aside>
          <div className="sticker-canvas-controls">
            <p id="sticker-placement-note">Pick a sticker to see it on the box</p>
            <p className="sticker-drag-help" id="sticker-drag-help">
              Pick a sticker. Try it on.
            </p>
            <p id="sticker-stage-hint">Tap a sticker to preview · Or drag one onto the box</p>
            <div className="sticker-faces" role="group" aria-label="View a box surface">
              <button id="sticker-face-front">Front</button>
              <button id="sticker-face-right">Right</button>
              <button id="sticker-face-back">Back</button>
              <button id="sticker-face-left">Left</button>
              <button id="sticker-face-lid">Lid ↗</button>
            </div>
          </div>
        </section>
        <section className="sticker-panel" aria-label="Sticker pack and placement controls">
          <div className="sticker-view-dock" id="sticker-view-dock">
            <span className="sticker-view-label">BOX VIEW</span>
          </div>
          <div className="sticker-panel-tabs" role="tablist" aria-label="Sticker tools">
            <button
              id="sticker-tab-pack"
              role="tab"
              aria-selected="true"
              aria-controls="sticker-pack-panel"
            >
              Stickers
            </button>
            <button
              id="sticker-tab-adjust"
              role="tab"
              aria-selected="false"
              aria-controls="sticker-adjust-panel"
              tabIndex="-1"
            >
              Adjust
            </button>
          </div>
          <div className="sticker-collection-dock" id="sticker-collection-dock"></div>
          <div className="sticker-panel-scroll">
            <div
              id="sticker-pack-panel"
              className="sticker-tool-panel"
              role="tabpanel"
              aria-labelledby="sticker-tab-pack"
            >
              <div className="sticker-panel-heading" id="sticker-pack-heading">
                <div className="sticker-collections" role="group" aria-label="Sticker collection">
                  <button
                    id="sticker-collection-originals"
                    aria-pressed="true"
                    aria-controls="sticker-pack"
                  >
                    Originals
                  </button>
                  <button
                    id="sticker-collection-code"
                    aria-pressed="false"
                    aria-controls="sticker-pack"
                  >
                    {'Code '}
                    <span>06</span>
                  </button>
                </div>
                <span id="sticker-count">00 / 24</span>
              </div>
              <div
                className="sticker-pack"
                id="sticker-pack"
                role="group"
                aria-label="Choose a sticker"
              ></div>
              <div className="sticker-selected">
                <h3 id="sticker-selected-name">Choose a sticker</h3>
                <p id="sticker-selected-note">See it on the box before you stick it.</p>
              </div>
            </div>
            <div
              id="sticker-adjust-panel"
              className="sticker-tool-panel"
              role="tabpanel"
              aria-labelledby="sticker-tab-adjust"
            >
              <div className="sticker-adjustments">
                <div className="sticker-ruler-field" id="sticker-size-field">
                  <label htmlFor="sticker-size">
                    <span>Size</span>
                    <output id="sticker-size-value" htmlFor="sticker-size">
                      100%
                    </output>
                  </label>
                  <input
                    id="sticker-size"
                    type="range"
                    min="0.45"
                    max="1.65"
                    step="0.01"
                    defaultValue="1"
                    disabled
                  />
                </div>
                <div className="sticker-ruler-field" id="sticker-angle-field">
                  <label htmlFor="sticker-angle">
                    <span>Angle</span>
                    <output id="sticker-angle-value" htmlFor="sticker-angle">
                      −8°
                    </output>
                  </label>
                  <input
                    id="sticker-angle"
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    defaultValue="-8"
                    disabled
                  />
                </div>
              </div>
              <p className="sticker-rail-tip">
                Pick or drop a sticker to preview it. Use the right ruler to adjust, then tap Stick
                here.
              </p>
              <div className="sticker-finish" role="group" aria-label="Sticker finish">
                <span>Finish</span>
                <button id="sticker-gloss" disabled aria-pressed="true">
                  Gloss
                </button>
                <button id="sticker-holo" disabled aria-pressed="false">
                  ✧ Holo
                </button>
              </div>
            </div>
          </div>
          <div className="sticker-panel-footer">
            <p className="sticker-drop-help">
              {'Pick a sticker to preview '}
              <span>adjust it on the box, then stick it</span>
            </p>
            <div className="sticker-preview-actions">
              <button className="primary sticker-place" id="sticker-place" disabled>
                {'Stick here '}
                <span aria-hidden="true">↘</span>
              </button>
              <button id="sticker-cancel" disabled aria-label="Cancel sticker preview">
                ✕
              </button>
            </div>
            <div className="sticker-history">
              <button id="sticker-undo" disabled>
                ↶ Undo
              </button>
              <button id="sticker-clear" disabled>
                Clear box
              </button>
            </div>
            <p className="sticker-feedback" id="sticker-feedback" aria-live="polite">
              Pick or drop a sticker. Adjust its preview, then Stick here.
            </p>
            <p className="sticker-save-note" id="sticker-save-note">
              Saved on this device. Your box, your stickers.
            </p>
          </div>
        </section>
      </div>
    </dialog>
  );
}
