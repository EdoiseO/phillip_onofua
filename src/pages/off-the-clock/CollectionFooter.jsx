export function CollectionFooter() {
  return (
    <>
      <footer className="footer">
        <span>
          {'THE SHORT BOX '}
          <span className="footer-number">/ 001</span>
        </span>
        <span className="footer-center">
          <i></i>
          <span id="scene-status">WAITING TO BE OPENED</span>
        </span>
        <button className="motion-toggle" id="motion-toggle" aria-pressed="false">
          Motion on
        </button>
      </footer>
      <p className="sr-only" aria-live="polite" id="announcement"></p>
    </>
  );
}
