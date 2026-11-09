// Warms the browser cache for the Off the clock comic box while the homepage
// sits idle, so opening it from the nav skips most of its downloads.
// Only the files the box needs before it can appear are fetched here (about
// 7.5 MB); comic covers still stream in on that page. Visitors with Data Saver
// or a slow connection are left alone, and nothing runs until the page is idle.
(() => {
  const base = "/off-the-clock/";
  const files = [
    ["", "document"],
    ["vendor/three.core.js", "script"],
    ["vendor/three.module.js", "script"],
    ["vendor/addons/loaders/GLTFLoader.js", "script"],
    ["vendor/addons/utils/BufferGeometryUtils.js", "script"],
    ["vendor/addons/utils/SkeletonUtils.js", "script"],
    ["vendor/addons/geometries/RoundedBoxGeometry.js", "script"],
    ["vendor/addons/environments/RoomEnvironment.js", "script"],
    ["assets/models/comic-set.glb", "fetch"],
    ["assets/models/blind-bag.glb", "fetch"],
    ["assets/materials/cardboard-color.jpg", "image"],
    ["assets/materials/cardboard-normal.jpg", "image"],
    ["assets/materials/cardboard-roughness.jpg", "image"],
    ["assets/geist.woff", "font"],
    ["assets/geist-mono.woff", "font"],
  ];

  const connection = navigator.connection;
  const slow =
    connection?.saveData ||
    /(^|-)(2g|3g)$/.test(connection?.effectiveType ?? "") ||
    matchMedia("(prefers-reduced-data: reduce)").matches;
  if (slow) return;

  let started = false;
  function preload() {
    if (started) return;
    started = true;
    for (const [path, as] of files) {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = base + path;
      if (as !== "document") link.as = as;
      if (as === "font" || as === "fetch") link.crossOrigin = "anonymous";
      document.head.append(link);
    }
  }

  // Someone heading for the page gets it straight away.
  for (const link of document.querySelectorAll('a[href^="off-the-clock"], a[href^="/off-the-clock"]')) {
    link.addEventListener("pointerenter", preload, { once: true });
    link.addEventListener("focus", preload, { once: true });
    link.addEventListener("touchstart", preload, { once: true, passive: true });
  }

  // Otherwise, wait until the homepage has finished and the browser is idle.
  const whenIdle = () =>
    "requestIdleCallback" in window ? requestIdleCallback(preload, { timeout: 8000 }) : setTimeout(preload, 3000);
  if (document.readyState === "complete") setTimeout(whenIdle, 1500);
  else addEventListener("load", () => setTimeout(whenIdle, 1500), { once: true });
})();
