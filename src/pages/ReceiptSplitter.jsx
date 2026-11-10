import { CaseStudyPage } from '../components/CaseStudyPage.jsx';

export function ReceiptSplitter() {
  return (
    <CaseStudyPage>
      <section className="case-study-hero" aria-labelledby="case-study-title">
        <p className="eyebrow">Project plan · Work in progress</p>
        <h1 id="case-study-title">Receipt Splitter</h1>
        <p className="case-study-lead">A proposed mobile app for turning a shared receipt into clear individual totals by assigning items, tax, and tip across a group.</p>

        <dl className="case-study-meta">
          <div><dt>Status</dt><dd>Concept and workflow definition</dd></div>
          <div><dt>Primary problem</dt><dd>Shared totals are tedious and easy to calculate incorrectly</dd></div>
          <div><dt>Planned experience</dt><dd>Capture, confirm, assign, calculate, and share</dd></div>
        </dl>
      </section>

      <div className="case-study-sections">
        <section className="case-study-row" aria-labelledby="splitter-problem">
          <figure className="case-study-media">
            <div className="case-study-concept-board">
              <div className="receipt-concept" aria-hidden="true">
                <p>Shared dinner</p>
                <div className="receipt-line"><span>Phillip</span><strong>$24.60</strong></div>
                <div className="receipt-line"><span>Melvin</span><strong>$31.25</strong></div>
                <div className="receipt-line"><span>Wesley</span><strong>$27.15</strong></div>
                <div className="receipt-total"><span>Total split</span><strong>$83.00</strong></div>
              </div>
            </div>
            <figcaption>This is a concept illustration, not a screenshot of a finished application.</figcaption>
          </figure>
          <div className="case-study-copy">
            <p className="eyebrow">01 · Problem</p>
            <h2 id="splitter-problem">Make a shared bill understandable</h2>
            <p>A group receipt becomes difficult when people ordered different items, shared some of them, and still need to divide tax and tip fairly.</p>
            <p>The product goal is to replace manual calculator work with a flow that every person can review before anyone pays.</p>
          </div>
        </section>

        <section className="case-study-row case-study-row--reverse" aria-labelledby="splitter-flow">
          <figure className="case-study-media">
            <div className="case-study-concept-board">
              <div className="case-study-flow" aria-label="Proposed Receipt Splitter workflow">
                <div><span>Step 01</span><strong>Scan or upload the receipt</strong></div>
                <div><span>Step 02</span><strong>Confirm items and prices</strong></div>
                <div><span>Step 03</span><strong>Assign items to people</strong></div>
                <div><span>Step 04</span><strong>Review tax, tip, and totals</strong></div>
              </div>
            </div>
            <figcaption>The proposed workflow prioritizes verification before calculation.</figcaption>
          </figure>
          <div className="case-study-copy">
            <p className="eyebrow">02 · Proposed workflow</p>
            <h2 id="splitter-flow">Keep correction inside the process</h2>
            <p>Receipt recognition can be imperfect, so the experience should never treat scanned text as unquestionable. People need a clear confirmation step before assigning items.</p>
            <p>Shared items also need to support more than one person, while tax, tip, discounts, and rounding remain visible rather than hidden behind a final number.</p>
          </div>
        </section>

        <section className="case-study-row" aria-labelledby="splitter-decisions">
          <div className="case-study-media case-study-concept-board">
            <div className="case-study-flow" aria-label="Open technical decisions">
              <div><span>Input</span><strong>OCR accuracy and manual correction</strong></div>
              <div><span>Calculation</span><strong>Shared items, discounts, tax, tip, and rounding</strong></div>
              <div><span>Privacy</span><strong>Minimize retention of receipt images</strong></div>
              <div><span>Output</span><strong>Clear, shareable totals for each person</strong></div>
            </div>
          </div>
          <div className="case-study-copy">
            <p className="eyebrow">03 · Technical direction</p>
            <h2 id="splitter-decisions">Resolve the risky parts before choosing the stack</h2>
            <p>The architecture is intentionally not presented as finished. The first technical work should test receipt extraction, calculation rules, and privacy requirements.</p>
            <p>Those results will determine whether processing belongs on-device or behind a service, and which mobile framework best fits the product.</p>
          </div>
        </section>

        <section className="case-study-row case-study-row--reverse" aria-labelledby="splitter-next">
          <div className="case-study-media case-study-concept-board">
            <div className="case-study-flow" aria-label="Receipt Splitter next milestones">
              <div><span>Milestone 01</span><strong>Test calculations against real receipts</strong></div>
              <div><span>Milestone 02</span><strong>Prototype item confirmation and assignment</strong></div>
              <div><span>Milestone 03</span><strong>Evaluate scanning accuracy on mobile</strong></div>
              <div><span>Milestone 04</span><strong>Build and test the smallest complete flow</strong></div>
            </div>
          </div>
          <div className="case-study-copy">
            <p className="eyebrow">04 · Next steps</p>
            <h2 id="splitter-next">Turn the concept into evidence</h2>
            <p>The next milestone is not a polished marketing screen. It is a working calculation model and a small prototype that shows whether people can correct a receipt and assign items without confusion.</p>
            <p>Real screenshots and implementation details will replace these planning artifacts as the application is built.</p>
          </div>
        </section>
      </div>

      <section className="case-study-end" aria-label="Receipt Splitter project status">
        <div className="case-study-result">
          <h2>Current status</h2>
          <p>Receipt Splitter is a work in progress. This page documents the product reasoning and proposed validation plan without presenting the concept as completed software.</p>
        </div>
        <p>Continue exploring</p>
        <nav aria-label="Project navigation">
          <a href="student-market.html">Explore how Student Market works</a>
          <a href="overlay-studio.html">Explore how Overlay Studio works</a>
          <a href="index.html#projects">All featured projects</a>
        </nav>
      </section>
    </CaseStudyPage>
  );
}
