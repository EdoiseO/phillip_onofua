import { renderToStaticMarkup } from 'react-dom/server';
import { Privacy } from './pages/Privacy.jsx';
import { Terms } from './pages/Terms.jsx';
import { ReceiptSplitter } from './pages/ReceiptSplitter.jsx';
import { OverlayStudio } from './pages/OverlayStudio.jsx';
import { Home } from './pages/Home.jsx';
import { StudentMarket } from './pages/StudentMarket.jsx';
import { OffTheClock } from './pages/OffTheClock.jsx';

const pages = {
  'index.html': Home,
  'student-market.html': StudentMarket,
  'off-the-clock/index.html': OffTheClock,
  'privacy.html': Privacy,
  'terms.html': Terms,
  'receipt-splitter.html': ReceiptSplitter,
  'overlay-studio.html': OverlayStudio,
};

export function renderStaticPage(filename) {
  const Page = pages[filename];
  if (!Page) throw new Error(`Missing React page for ${filename}`);
  return renderToStaticMarkup(<Page />);
}
