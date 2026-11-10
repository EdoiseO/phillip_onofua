import { renderToStaticMarkup } from 'react-dom/server';
import { Privacy } from './pages/Privacy.jsx';
import { Terms } from './pages/Terms.jsx';
import { ReceiptSplitter } from './pages/ReceiptSplitter.jsx';

const pages = {
  'privacy.html': Privacy,
  'terms.html': Terms,
  'receipt-splitter.html': ReceiptSplitter,
};

export function renderStaticPage(filename) {
  const Page = pages[filename];
  if (!Page) throw new Error(`Missing React page for ${filename}`);
  return renderToStaticMarkup(<Page />);
}
