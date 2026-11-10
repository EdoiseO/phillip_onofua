import { renderToStaticMarkup } from 'react-dom/server';
import { Privacy } from './pages/Privacy.jsx';
import { Terms } from './pages/Terms.jsx';

const pages = {
  'privacy.html': Privacy,
  'terms.html': Terms,
};

export function renderStaticPage(filename) {
  const Page = pages[filename];
  if (!Page) throw new Error(`Missing React page for ${filename}`);
  return renderToStaticMarkup(<Page />);
}
