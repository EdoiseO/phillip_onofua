// Open the built preview's /off-the-clock/ in Playwright CLI, then run:
// playwright-cli run-code --filename=tests/pack-filing.browser.js
async page => {
  const url = new URL('/off-the-clock/', page.url()).href;
  const browser = page.context().browser();

  for (const [width, height, touch] of [[1280, 900, false], [390, 844, true]]) {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: touch,
      reducedMotion: touch ? 'reduce' : 'no-preference',
    });
    try {
      const target = await context.newPage();
      await target.bringToFront();
      await target.goto(url);
      const stage = target.locator('#stage');
      await target.locator('#stage[data-box-painted="true"]').waitFor();
      await stage.press('Enter');
      const tabs = target.locator('.comic-tab');
      const originalCount = await tabs.count();
      const bagIndex = await tabs.evaluateAll(nodes => nodes.findIndex(
        node => node.getAttribute('aria-label')?.includes('Premium Mystery Blind Bag'),
      ));
      if (bagIndex < 0) throw new Error('No mystery bag in the collection');
      const ruler = target.locator('#comic-ruler');
      await ruler.evaluate((input, index) => {
        input.value = String(index);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }, bagIndex);
      await stage.press('i');
      const tear = target.getByRole('button', { name: 'Tear the bag' });
      if (touch) await tear.tap(); else await tear.click();
      const add = target.getByRole('button', { name: 'Add to my box' });
      if (touch) await add.tap(); else await add.click();

      const firstPull = tabs.nth(originalCount);
      await firstPull.waitFor({ state: 'attached' });
      if (await tabs.count() !== originalCount + 3) throw new Error('Expected three filed pulls');
      if (await firstPull.getAttribute('aria-pressed') !== 'true'
          || await stage.getAttribute('data-active-index') !== String(originalCount)
          || await ruler.inputValue() !== String(originalCount)) {
        throw new Error('Filing should select the first new pull in the box, strip and ruler');
      }

      if (!touch) {
        await target.waitForFunction(index => {
          const strip = document.querySelector('#comic-tabs');
          const tab = strip.children[index].getBoundingClientRect();
          const view = strip.getBoundingClientRect();
          return strip.scrollLeft > 0 && tab.left >= view.left - 1 && tab.right <= view.right + 1;
        }, originalCount);
        await target.locator('#stage[data-motion-settled="true"]').waitFor();
      }

      await stage.press('i');
      const label = await firstPull.getAttribute('aria-label');
      const title = await target.locator('#inspection-title').textContent();
      const variant = await target.locator('#inspection-variant').textContent();
      if (label !== `${title}, ${variant}`) throw new Error('Inspection did not open the first pull');
    } finally {
      await context.close();
    }
  }
}
