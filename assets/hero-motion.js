(() => {
  const hero = document.getElementById("hero-motion");
  const toggle = document.getElementById("hero-motion-toggle");
  const phrases = (hero?.dataset.phrases || "")
    .split("|")
    .map((phrase) => phrase.trim())
    .filter(Boolean);

  if (toggle) toggle.hidden = true;
  if (
    !hero ||
    phrases.length < 2 ||
    !window.matchMedia ||
    !window.CSS?.supports("animation-name", "hero-motion-character-in")
  )
    return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const enterDuration = 620;
  const leaveDuration = 520;
  const characterStagger = 34;
  const phraseHold = 4200;
  const settlingTime = 80;
  let phraseIndex = Math.max(0, phrases.indexOf(hero.textContent.trim()));
  let userPaused = false;
  let timer = null;

  const isPaused = () => userPaused || motionQuery.matches || document.hidden;

  const stop = () => {
    window.clearTimeout(timer);
    timer = null;
    hero.classList.remove("is-leaving", "is-entering");
  };

  const schedule = (callback, delay) => {
    if (!isPaused()) timer = window.setTimeout(callback, delay);
  };

  const renderCharacters = () => {
    const characters = Array.from(phrases[phraseIndex]);
    const fragment = document.createDocumentFragment();

    characters.forEach((character, index) => {
      const span = document.createElement("span");
      span.className = "hero-motion-character";
      span.style.setProperty(
        "--char-delay-index",
        characters.length - index - 1,
      );
      span.textContent = character === " " ? "\u00a0" : character;
      fragment.appendChild(span);
    });

    hero.replaceChildren(fragment);
  };

  const transitionDuration = (duration) =>
    duration +
    settlingTime +
    Math.max(Array.from(phrases[phraseIndex]).length - 1, 0) * characterStagger;

  const finishEntering = () => {
    hero.classList.remove("is-entering");
    schedule(rotatePhrase, phraseHold);
  };

  const enterNextPhrase = () => {
    phraseIndex = (phraseIndex + 1) % phrases.length;
    hero.classList.remove("is-leaving");
    renderCharacters();
    hero.classList.add("is-entering");
    schedule(finishEntering, transitionDuration(enterDuration));
  };

  const rotatePhrase = () => {
    hero.classList.add("is-leaving");
    schedule(enterNextPhrase, transitionDuration(leaveDuration));
  };

  const sync = () => {
    stop();

    if (toggle) {
      toggle.hidden = motionQuery.matches;
      toggle.textContent = isPaused() ? "Play animation" : "Pause animation";
    }

    if (motionQuery.matches) {
      hero.textContent = phrases[phraseIndex];
      return;
    }

    // A pause always leaves the entire current phrase readable.
    renderCharacters();
    schedule(rotatePhrase, phraseHold);
  };

  toggle?.addEventListener("click", () => {
    userPaused = !userPaused;
    sync();
  });

  document.addEventListener("visibilitychange", sync);
  if (motionQuery.addEventListener) {
    motionQuery.addEventListener("change", sync);
  } else {
    motionQuery.addListener(sync);
  }

  sync();
})();
