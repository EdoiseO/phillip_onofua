import { SiteShell } from '../components/SiteShell.jsx';
import { MarketIntro } from './student-market/MarketIntro.jsx';
import { MarketInterface } from './student-market/MarketInterface.jsx';
import { MarketEngineering } from './student-market/MarketEngineering.jsx';
import { MarketLightbox } from './student-market/MarketLightbox.jsx';
import { MarketConclusion } from './student-market/MarketConclusion.jsx';

export function StudentMarket() {
  return (
    <>
      <a className="case-study-skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteShell section="case-study" backHref="index.html#projects" backLabel="Back to projects">
        <main className="case-study-main" id="main-content" tabIndex={-1}>
          <MarketIntro />
          <div className="case-study-sections">
            <MarketInterface />
            <MarketEngineering />
          </div>
          <MarketLightbox />
          <MarketConclusion />
        </main>
      </SiteShell>
    </>
  );
}
