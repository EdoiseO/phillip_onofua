// Build and open the preview's /off-the-clock/ in Playwright CLI, then run:
// playwright-cli run-code --filename=tests/collection-switch.browser.js
async page => {
  const browser = page.context().browser();
  const url = new URL('/off-the-clock/', page.url()).href;
  const results = [];
  const selectors = {
    heading: '#title',
    description: '#description',
    comics: '#collection-comics',
    compacts: '#collection-compacts',
    viewer: '.viewer',
    footer: '.footer',
  };

  for (const [width, height, hasTouch] of [[1280, 900, false], [390, 844, true]]) {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch, reducedMotion });
      try {
        const target = await context.newPage();
        const requests = [];
        const errors = [];
        target.on('request', request => requests.push(request.url()));
        target.on('pageerror', error => errors.push(error.message));
        await target.addInitScript(() => {
          window.policyViolations = [];
          document.addEventListener('securitypolicyviolation', event => {
            window.policyViolations.push(event.violatedDirective);
          });
        });
        await target.goto(url);
        const stage = target.locator('#stage[data-box-painted="true"]');
        await stage.waitFor();
        const compactRequests = () => requests.filter(request => /\/(?:compacts-display\.js|compacts\.css)\?/.test(request));
        if (compactRequests().length) throw new Error('Compacts must load on selection');

        const switchTo = async mode => {
          const button = target.locator('#collection-' + mode);
          if (hasTouch) await button.tap(); else await button.click();
          await target.locator('#experience[data-collection="' + mode + '"]').waitFor();
        };
        for (const boxOpen of [false, true]) {
          if (boxOpen) {
            await stage.press('Enter');
            await target.locator('.viewer[data-open="true"]').waitFor();
            await target.locator('.comics-panel').evaluate(async node => {
              await Promise.all(node.getAnimations().map(animation => animation.finished));
            });
          }
          const before = await target.evaluate(selectors => {
            return Object.fromEntries(Object.entries(selectors).map(([key, selector]) => {
              const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
              return [key, [x, y, width, height]];
            }));
          }, selectors);
          const checkTransition = async mode => {
            // Start sampling before clicking so this catches a transient jump,
            // even when the two end positions happen to match.
            await target.evaluate(({ selectors, before }) => {
              window.collectionSamples = [];
              const sample = () => {
                for (const [key, selector] of Object.entries(selectors)) {
                  const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
                  if ([x, y, width, height].some((value, i) => Math.abs(value - before[key][i]) > .05)) {
                    window.collectionSamples.push(`${key} moved to ${[x, y, width, height]}`);
                  }
                }
                window.collectionSampleFrame = requestAnimationFrame(sample);
              };
              sample();
            }, { selectors, before });
            await switchTo(mode);
            const toCompacts = mode === 'compacts';
            const state = await target.evaluate(async ({ toCompacts, hasTouch, reduced }) => {
              const panel = document.querySelector('.comics-panel');
              const shelf = document.querySelector('#compact-dialog');
              const comicActions = ['#inspect-button', '#decorate-button', '#reading-progress'].map(s => document.querySelector(s));
              const outgoing = toCompacts ? [panel, ...comicActions] : [shelf];
              if (outgoing.some(node => !node.inert || node.getAttribute('aria-hidden') !== 'true')) {
                return 'Inactive controls must leave keyboard and screen reader navigation immediately';
              }
              const active = toCompacts ? shelf : panel;
              if (active.inert || active.hasAttribute('aria-hidden')) return 'Incoming panel is inaccessible';
              const transitions = [panel, shelf].flatMap(node => node.getAnimations()
                .filter(animation => animation.transitionProperty === 'opacity'));
              if (reduced && transitions.length) return 'Reduced motion started a fade';
              if (!reduced && transitions.length !== 2) return 'Expected overlapping panel fades';
              await Promise.all(transitions.map(animation => animation.finished));
              await new Promise(requestAnimationFrame);
              if (outgoing.some(node => getComputedStyle(node).visibility !== 'hidden')) {
                return 'Outgoing controls are visible after the fade';
              }
              if (toCompacts) {
                const verb = hasTouch ? 'Tap' : 'Click';
                const storyHint = document.querySelector('#compact-left-hint');
                const shelfHint = document.querySelector('#compact-note-label');
                if (storyHint.textContent !== verb + ' a book to take a closer look.'
                    || shelfHint.textContent !== verb + ' a book to take a closer look') return 'Wrong Compacts hint';
              }
              return 'ok';
            }, { toCompacts, hasTouch, reduced: reducedMotion === 'reduce' });
            const shifts = await target.evaluate(() => {
              cancelAnimationFrame(window.collectionSampleFrame);
              return [...new Set(window.collectionSamples)];
            });
            if (state !== 'ok' || shifts.length) throw new Error([state, ...shifts].join('\n'));
          };

          await checkTransition('compacts');
          await checkTransition('comics');
          await target.locator('#compact-canvas canvas').waitFor({ state: 'detached' });
          if (await target.locator('.viewer').getAttribute('data-open') !== String(boxOpen)) {
            throw new Error('Switching changed the comic box lid');
          }
          results.push({ width, reducedMotion, boxOpen, rects: before });
        }
        if (compactRequests().length !== 2) throw new Error('Expected the Compacts module and CSS to load once');

        if (reducedMotion === 'no-preference') {
          await switchTo('compacts');
          const interrupted = await target.evaluate(async () => {
            const shelf = document.querySelector('#compact-dialog');
            await Promise.all(shelf.getAnimations().map(animation => animation.finished));
            const canvas = shelf.querySelector('canvas');
            document.querySelector('#collection-comics').click();
            await new Promise(resolve => setTimeout(resolve, 70));
            document.querySelector('#collection-compacts').click();
            await Promise.all(shelf.getAnimations().map(animation => animation.finished));
            return document.querySelector('#experience').dataset.collection === 'compacts'
              && !shelf.inert && shelf.querySelector('canvas') === canvas;
          });
          if (!interrupted) throw new Error('Changing direction during the fade must keep the selected display');
        }
        const violations = await target.evaluate(() => window.policyViolations);
        if (errors.length || violations.length) throw new Error([...errors, ...violations].join('\n'));
      } finally {
        await context.close();
      }
    }
  }
  return results;
}
