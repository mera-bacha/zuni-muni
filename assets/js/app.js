(() => {
  "use strict";

  const config = window.PROPOSAL_CONFIG || {};
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = {
    scene: 1,
    previousScene: 1,
    audioEnabled: config.audio?.enabledByDefault !== false,
    audioStarted: false,
    bookPage: 0,
    letterStarted: false,
    noAttempts: 0,
    logoClicks: 0,
    celebrationActive: false,
    animationFrame: 0,
    visibilityPaused: false
  };

  const dom = {
    body: document.body,
    scenes: [...document.querySelectorAll(".scene")],
    progress: document.getElementById("progressDots"),
    timeline: document.getElementById("timeline"),
    gallery: document.getElementById("gallery"),
    reasons: document.getElementById("reasonsGrid"),
    book: document.getElementById("book"),
    bookPrev: document.getElementById("bookPrev"),
    bookNext: document.getElementById("bookNext"),
    bookCounter: document.getElementById("bookCounter"),
    countdown: document.getElementById("countdown"),
    countdownCaption: document.getElementById("countdownCaption"),
    letterText: document.getElementById("letterText"),
    letterSignature: document.getElementById("letterSignature"),
    letterContinue: document.getElementById("letterContinue"),
    yes: document.getElementById("yesButton"),
    no: document.getElementById("noButton"),
    noMessage: document.getElementById("noMessage"),
    audioToggle: document.getElementById("audioToggle"),
    heartLogo: document.getElementById("heartLogo"),
    easterEgg: document.getElementById("easterEgg"),
    transitionVeil: document.getElementById("transitionVeil"),
    restart: document.getElementById("restartButton"),
    lightbox: document.getElementById("lightbox"),
    lightboxImage: document.getElementById("lightboxImage"),
    lightboxCaption: document.getElementById("lightboxCaption"),
    lightboxClose: document.getElementById("lightboxClose"),
    heartLayer: document.getElementById("floatingHearts"),
    fireflyLayer: document.getElementById("fireflies"),
    petalLayer: document.getElementById("petalLayer"),
    starCanvas: document.getElementById("starCanvas"),
    particleCanvas: document.getElementById("particleCanvas"),
    celebrationCanvas: document.getElementById("celebrationCanvas")
  };

  if (prefersReducedMotion) dom.body.classList.add("reduced-motion");

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const random = (min, max) => Math.random() * (max - min) + min;
  const wait = (ms) => new Promise(resolve => window.setTimeout(resolve, ms));

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    })[character]);
  }

  function renderTimeline() {
    const items = Array.isArray(config.timeline) ? config.timeline : [];
    dom.timeline.innerHTML = items.map(item => `
      <article class="timeline-item">
        <span class="timeline-dot" aria-hidden="true"></span>
        <div class="timeline-card">
          <time>${escapeHtml(item.date)}</time>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
        </div>
      </article>
    `).join("");
  }

  function renderGallery() {
    const items = Array.isArray(config.gallery) ? config.gallery : [];
    dom.gallery.innerHTML = items.map((item, index) => `
      <button class="gallery-card" type="button" data-gallery-index="${index}" aria-label="Open ${escapeHtml(item.caption)}">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.caption)}" loading="lazy" decoding="async" />
        <span class="gallery-caption">${escapeHtml(item.caption)}</span>
      </button>
    `).join("");
  }

  function renderReasons() {
    const items = Array.isArray(config.reasons) ? config.reasons.slice(0, 10) : [];
    dom.reasons.innerHTML = items.map((item, index) => `
      <article class="reason-card" tabindex="0" role="button" aria-label="Reveal reason: ${escapeHtml(item.title)}" data-reason-index="${index}">
        <div class="reason-card-inner">
          <div class="reason-face reason-front">
            <div class="reason-icon" aria-hidden="true">♥</div>
            <h3>${escapeHtml(item.title)}</h3>
          </div>
          <div class="reason-face reason-back">
            <p>${escapeHtml(item.detail)}</p>
          </div>
        </div>
      </article>
    `).join("");
  }

  function renderBook() {
    const pages = Array.isArray(config.memoryBook) ? config.memoryBook : [];
    dom.book.innerHTML = pages.map((page, index) => `
      <article class="book-page${index === 0 ? " is-current" : ""}" data-page="${index}" aria-hidden="${index === 0 ? "false" : "true"}">
        <div class="book-image" style="background-image:url('${escapeHtml(page.image)}')" role="img" aria-label="${escapeHtml(page.title)}"></div>
        <div class="book-copy">
          <h3>${escapeHtml(page.title)}</h3>
          <p>${escapeHtml(page.message)}</p>
          <span class="book-decoration" aria-hidden="true">♥</span>
        </div>
      </article>
    `).join("");
    updateBookControls();
  }

  function renderProgress() {
    dom.progress.innerHTML = dom.scenes.map((_, index) => `
      <span class="progress-dot${index === 0 ? " is-active" : ""}" aria-hidden="true"></span>
    `).join("");
  }

  function renderCountdown() {
    const units = ["Days", "Hours", "Minutes", "Seconds"];
    dom.countdown.innerHTML = units.map(unit => `
      <div class="countdown-item">
        <span class="countdown-number" data-unit="${unit.toLowerCase()}">00</span>
        <span class="countdown-label">${unit}</span>
      </div>
    `).join("");
    dom.countdownCaption.textContent = config.countdownLabel || "Until our next beautiful chapter";
    updateCountdown();
  }

  function updateCountdown() {
    const target = new Date(config.specialDate || Date.now() + 86400000).getTime();
    const distance = Math.max(0, target - Date.now());
    const values = {
      days: Math.floor(distance / 86400000),
      hours: Math.floor((distance % 86400000) / 3600000),
      minutes: Math.floor((distance % 3600000) / 60000),
      seconds: Math.floor((distance % 60000) / 1000)
    };
    Object.entries(values).forEach(([unit, value]) => {
      const element = dom.countdown.querySelector(`[data-unit="${unit}"]`);
      if (element) element.textContent = String(value).padStart(2, "0");
    });
    if (distance === 0) dom.countdownCaption.textContent = "Our beautiful chapter begins now";
  }

  function updateBookControls() {
    const count = Array.isArray(config.memoryBook) ? config.memoryBook.length : 0;
    dom.bookCounter.textContent = count ? `${state.bookPage + 1} / ${count}` : "0 / 0";
    dom.bookPrev.disabled = state.bookPage <= 0;
    dom.bookNext.disabled = state.bookPage >= count - 1;
    dom.bookPrev.style.opacity = dom.bookPrev.disabled ? ".45" : "1";
    dom.bookNext.style.opacity = dom.bookNext.disabled ? ".45" : "1";
  }

  async function turnBook(direction) {
    const pages = [...dom.book.querySelectorAll(".book-page")];
    const nextIndex = clamp(state.bookPage + direction, 0, pages.length - 1);
    if (nextIndex === state.bookPage) return;
    playClick(0.45);
    const current = pages[state.bookPage];
    const next = pages[nextIndex];
    current.classList.add(direction > 0 ? "is-leaving-next" : "is-leaving-prev");
    current.classList.remove("is-current");
    current.setAttribute("aria-hidden", "true");
    next.classList.add("is-current");
    next.setAttribute("aria-hidden", "false");
    state.bookPage = nextIndex;
    updateBookControls();
    await wait(prefersReducedMotion ? 10 : 760);
    current.classList.remove("is-leaving-next", "is-leaving-prev");
  }

  function openLightbox(index) {
    const item = config.gallery?.[index];
    if (!item) return;
    dom.lightboxImage.src = item.image;
    dom.lightboxImage.alt = item.caption;
    dom.lightboxCaption.textContent = item.caption;
    dom.lightbox.hidden = false;
    playClick(0.55);
  }

  function closeLightbox() {
    dom.lightbox.hidden = true;
    dom.lightboxImage.src = "";
  }

  async function goToScene(sceneNumber, options = {}) {
    const target = clamp(Number(sceneNumber), 1, dom.scenes.length);
    if (target === state.scene && !options.force) return;
    if (target === 10 && !options.celebration) return;

    state.previousScene = state.scene;
    const current = dom.scenes[state.scene - 1];
    const next = dom.scenes[target - 1];

    if (!options.skipSound) playClick();
    if (!prefersReducedMotion) {
      dom.transitionVeil.classList.remove("flash");
      void dom.transitionVeil.offsetWidth;
      dom.transitionVeil.classList.add("flash");
      await wait(360);
    }

    current?.classList.remove("is-active");
    next?.classList.add("is-active");
    next?.scrollTo({ top: 0, behavior: "instant" });
    state.scene = target;
    updateProgress();
    onSceneEnter(target);
  }

  function updateProgress() {
    [...dom.progress.children].forEach((dot, index) => {
      dot.classList.toggle("is-active", index === state.scene - 1);
    });
  }

  function onSceneEnter(sceneNumber) {
    if (sceneNumber === 7) startLetterTyping();
    if (sceneNumber === 8) setHeartIntensity(26);
    if (sceneNumber === 9) {
      setHeartIntensity(34);
      resetNoButton();
    }
    if (sceneNumber < 8) setHeartIntensity(16);
    if (sceneNumber === 10) startCelebration();
  }

  async function startLetterTyping() {
    if (state.letterStarted) return;
    state.letterStarted = true;
    const text = config.letter || "My love, you are my favourite story.";
    dom.letterText.textContent = "";
    dom.letterText.classList.remove("is-complete");
    dom.letterSignature.textContent = config.signature || "Forever yours";

    if (prefersReducedMotion) {
      dom.letterText.textContent = text;
    } else {
      for (let index = 0; index < text.length; index += 1) {
        if (state.scene !== 7) return;
        dom.letterText.textContent += text[index];
        const punctuationPause = /[.,!?]/.test(text[index]) ? 70 : 0;
        await wait(25 + punctuationPause);
      }
    }

    dom.letterText.classList.add("is-complete");
    dom.letterSignature.classList.add("is-visible");
    dom.letterContinue.classList.remove("is-hidden");
  }

  function resetLetter() {
    state.letterStarted = false;
    dom.letterText.textContent = "";
    dom.letterText.classList.remove("is-complete");
    dom.letterSignature.classList.remove("is-visible");
    dom.letterContinue.classList.add("is-hidden");
  }

  function resetNoButton() {
    state.noAttempts = 0;
    dom.no.style.setProperty("--move-speed", ".32s");
    const width = dom.no.offsetWidth || 155;
    const height = dom.no.offsetHeight || 62;
    dom.no.style.left = `${clamp(window.innerWidth / 2 + 45, 16, window.innerWidth - width - 16)}px`;
    dom.no.style.top = `${clamp(window.innerHeight / 2 + 105, 90, window.innerHeight - height - 24)}px`;
    dom.no.style.transform = "rotate(0deg) scale(1)";
    dom.noMessage.textContent = "";
  }

  function moveNoButton() {
    if (state.scene !== 9) return;
    state.noAttempts += 1;
    const buttonWidth = dom.no.offsetWidth || 155;
    const buttonHeight = dom.no.offsetHeight || 62;
    const margin = 14;
    const headerSafe = 82;
    const maxX = Math.max(margin, window.innerWidth - buttonWidth - margin);
    const maxY = Math.max(headerSafe, window.innerHeight - buttonHeight - margin);
    const yesRect = dom.yes.getBoundingClientRect();

    let x = margin;
    let y = headerSafe;
    let tries = 0;
    do {
      x = random(margin, maxX);
      y = random(headerSafe, maxY);
      tries += 1;
    } while (
      tries < 18 &&
      x < yesRect.right + 60 &&
      x + buttonWidth > yesRect.left - 60 &&
      y < yesRect.bottom + 60 &&
      y + buttonHeight > yesRect.top - 60
    );

    const speed = Math.max(0.08, 0.34 - state.noAttempts * 0.025);
    const rotation = state.noAttempts % 3 === 0 ? random(-24, 24) : random(-8, 8);
    const scale = state.noAttempts % 4 === 0 ? random(0.7, 0.88) : random(0.9, 1.02);
    const jump = state.noAttempts % 5 === 0 ? -14 : 0;

    dom.no.style.setProperty("--move-speed", `${speed}s`);
    dom.no.style.left = `${x}px`;
    dom.no.style.top = `${y + jump}px`;
    dom.no.style.transform = `rotate(${rotation}deg) scale(${scale})`;
    dom.noMessage.style.opacity = "0";
    dom.noMessage.style.transform = "translateY(6px)";
    window.setTimeout(() => {
      const messages = config.noMessages || ["Nice try 😄"];
      dom.noMessage.textContent = messages[(state.noAttempts - 1) % messages.length];
      dom.noMessage.style.opacity = "1";
      dom.noMessage.style.transform = "none";
    }, 90);
    playTeaseSound();
  }

  function detectNoProximity(event) {
    if (state.scene !== 9 || event.pointerType === "touch") return;
    const rect = dom.no.getBoundingClientRect();
    const closestX = clamp(event.clientX, rect.left, rect.right);
    const closestY = clamp(event.clientY, rect.top, rect.bottom);
    const distance = Math.hypot(event.clientX - closestX, event.clientY - closestY);
    const triggerRadius = clamp(120 - state.noAttempts * 3, 72, 120);
    if (distance < triggerRadius) moveNoButton();
  }

  async function acceptProposal() {
    if (state.celebrationActive) return;
    playYesSound();
    dom.yes.disabled = true;
    dom.no.style.pointerEvents = "none";
    dom.scenes[8].style.filter = "brightness(1.18)";
    await wait(500);
    dom.scenes[8].style.filter = "";
    await goToScene(10, { celebration: true, skipSound: true });
  }

  function startCelebration() {
    state.celebrationActive = true;
    setHeartIntensity(42);
    createRosePetals();
    celebrationEngine.start();
    audioEngine.celebrationMode();
  }

  function stopCelebration() {
    state.celebrationActive = false;
    celebrationEngine.stop();
    dom.petalLayer.innerHTML = "";
    audioEngine.normalMode();
  }

  async function restartJourney() {
    stopCelebration();
    state.bookPage = 0;
    state.noAttempts = 0;
    dom.yes.disabled = false;
    dom.no.style.pointerEvents = "";
    resetLetter();
    [...dom.book.querySelectorAll(".book-page")].forEach((page, index) => {
      page.classList.toggle("is-current", index === 0);
      page.classList.remove("is-leaving-next", "is-leaving-prev");
      page.setAttribute("aria-hidden", index === 0 ? "false" : "true");
    });
    updateBookControls();
    await goToScene(1, { force: true });
  }

  function createFloatingHearts(count = 16) {
    dom.heartLayer.innerHTML = "";
    for (let index = 0; index < count; index += 1) {
      const heart = document.createElement("span");
      heart.className = "floating-heart";
      heart.textContent = "♥";
      heart.style.left = `${random(0, 100)}%`;
      heart.style.fontSize = `${random(10, 27)}px`;
      heart.style.setProperty("--duration", `${random(11, 23)}s`);
      heart.style.setProperty("--drift", `${random(-90, 90)}px`);
      heart.style.setProperty("--opacity", random(0.22, 0.68).toFixed(2));
      heart.style.animationDelay = `${random(-22, 0)}s`;
      dom.heartLayer.appendChild(heart);
    }
  }

  function setHeartIntensity(count) {
    if (dom.heartLayer.childElementCount !== count) createFloatingHearts(count);
  }

  function createFireflies(count = 22) {
    dom.fireflyLayer.innerHTML = "";
    for (let index = 0; index < count; index += 1) {
      const firefly = document.createElement("span");
      firefly.className = "firefly";
      firefly.style.left = `${random(2, 98)}%`;
      firefly.style.top = `${random(8, 92)}%`;
      firefly.style.setProperty("--duration", `${random(4, 10)}s`);
      firefly.style.setProperty("--x", `${random(-80, 80)}px`);
      firefly.style.setProperty("--y", `${random(-70, 70)}px`);
      firefly.style.animationDelay = `${random(-10, 0)}s`;
      dom.fireflyLayer.appendChild(firefly);
    }
  }

  function createRosePetals() {
    dom.petalLayer.innerHTML = "";
    const count = window.innerWidth < 600 ? 28 : 48;
    for (let index = 0; index < count; index += 1) {
      const petal = document.createElement("span");
      petal.className = "rose-petal";
      petal.style.left = `${random(0, 100)}%`;
      petal.style.opacity = random(0.45, 0.95).toFixed(2);
      petal.style.transform = `scale(${random(0.55, 1.15)})`;
      petal.style.setProperty("--duration", `${random(7, 14)}s`);
      petal.style.setProperty("--drift", `${random(-150, 150)}px`);
      petal.style.animationDelay = `${random(-13, 0)}s`;
      dom.petalLayer.appendChild(petal);
    }
  }

  function checkMidnightMode() {
    const hour = new Date().getHours();
    dom.body.classList.toggle("midnight-mode", hour >= 0 && hour < 6);
  }

  function showEasterEgg() {
    dom.easterEgg.classList.add("is-visible");
    playYesSound(0.45);
    window.setTimeout(() => dom.easterEgg.classList.remove("is-visible"), 4200);
  }

  const audioEngine = (() => {
    let context = null;
    let master = null;
    let musicGain = null;
    let timer = null;
    let noteIndex = 0;
    let celebrating = false;
    const softSequence = [
      [261.63, 329.63, 392.0],
      [220.0, 261.63, 329.63],
      [174.61, 220.0, 261.63],
      [196.0, 246.94, 293.66]
    ];

    function ensureContext() {
      if (context) return context;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
      master = context.createGain();
      musicGain = context.createGain();
      master.gain.value = state.audioEnabled ? Number(config.audio?.volume || 0.16) : 0;
      musicGain.gain.value = 0.7;
      musicGain.connect(master);
      master.connect(context.destination);
      return context;
    }

    function tone(frequency, start, duration, gainValue = 0.045, destination = musicGain, type = "sine") {
      if (!context || !destination) return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1800, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.05);
    }

    function playPhrase() {
      if (!context || context.state !== "running" || !state.audioEnabled) return;
      const now = context.currentTime;
      const chord = softSequence[noteIndex % softSequence.length];
      const length = celebrating ? 0.9 : 1.8;
      chord.forEach((note, index) => {
        tone(note, now + index * 0.22, length, celebrating ? 0.055 : 0.032);
        tone(note / 2, now + index * 0.22, length + 0.35, celebrating ? 0.024 : 0.015);
      });
      if (noteIndex % 2 === 0) tone(chord[1] * 2, now + 0.72, 0.9, 0.018);
      noteIndex += 1;
    }

    function beginScheduler() {
      if (timer) return;
      playPhrase();
      timer = window.setInterval(playPhrase, celebrating ? 1450 : 2800);
    }

    async function start() {
      const ctx = ensureContext();
      if (!ctx) return;
      if (ctx.state === "suspended") await ctx.resume();
      state.audioStarted = true;
      beginScheduler();
    }

    function setEnabled(enabled) {
      state.audioEnabled = enabled;
      const ctx = ensureContext();
      if (ctx && master) {
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(enabled ? Number(config.audio?.volume || 0.16) : 0, now + 0.35);
      }
      updateAudioButton();
      if (enabled) start();
    }

    function celebrationMode() {
      celebrating = true;
      if (timer) window.clearInterval(timer);
      timer = null;
      beginScheduler();
    }

    function normalMode() {
      celebrating = false;
      if (timer) window.clearInterval(timer);
      timer = null;
      if (state.audioStarted) beginScheduler();
    }

    function effect(notes, volume = 0.08, type = "sine") {
      const ctx = ensureContext();
      if (!ctx || !state.audioEnabled) return;
      if (ctx.state === "suspended") ctx.resume();
      const gain = ctx.createGain();
      gain.gain.value = 1;
      gain.connect(master);
      const now = ctx.currentTime;
      notes.forEach(([frequency, offset, duration]) => tone(frequency, now + offset, duration, volume, gain, type));
    }

    return { start, setEnabled, celebrationMode, normalMode, effect };
  })();

  function updateAudioButton() {
    dom.audioToggle.setAttribute("aria-pressed", String(!state.audioEnabled));
    dom.audioToggle.setAttribute("aria-label", state.audioEnabled ? "Mute background music" : "Play background music");
    dom.audioToggle.querySelector(".audio-icon").textContent = state.audioEnabled ? "♪" : "×";
  }

  function playClick(volume = 1) {
    audioEngine.effect([[523.25, 0, 0.08], [659.25, 0.055, 0.11]], 0.022 * volume, "sine");
  }

  function playTeaseSound() {
    audioEngine.effect([[420, 0, 0.06], [570, 0.07, 0.07]], 0.018, "triangle");
  }

  function playYesSound(volume = 1) {
    audioEngine.effect([
      [523.25, 0, 0.3],
      [659.25, 0.08, 0.34],
      [783.99, 0.16, 0.42],
      [1046.5, 0.28, 0.65]
    ], 0.065 * volume, "sine");
  }

  const ambientEngine = (() => {
    const starCtx = dom.starCanvas.getContext("2d");
    const particleCtx = dom.particleCanvas.getContext("2d");
    let stars = [];
    let particles = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let last = performance.now();

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      [dom.starCanvas, dom.particleCanvas].forEach(canvas => {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      });
      starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.round((width * height) / 10000) }, () => ({
        x: random(0, width), y: random(0, height), r: random(.4, 1.5), alpha: random(.2, .85), speed: random(.0005, .002)
      }));
      particles = Array.from({ length: Math.round((width * height) / 22000) }, () => ({
        x: random(0, width), y: random(0, height), r: random(1, 2.8), vy: random(-4, -12), drift: random(-5, 5), alpha: random(.08, .28)
      }));
    }

    function draw(now) {
      if (state.visibilityPaused) return;
      const delta = Math.min((now - last) / 1000, .05);
      last = now;
      starCtx.clearRect(0, 0, width, height);
      particleCtx.clearRect(0, 0, width, height);

      for (const star of stars) {
        star.alpha += Math.sin(now * star.speed) * .006;
        starCtx.beginPath();
        starCtx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        starCtx.fillStyle = `rgba(255,248,220,${clamp(star.alpha, .08, .95)})`;
        starCtx.fill();
      }

      for (const particle of particles) {
        particle.y += particle.vy * delta;
        particle.x += Math.sin(now * .0005 + particle.y) * particle.drift * delta;
        if (particle.y < -10) {
          particle.y = height + 10;
          particle.x = random(0, width);
        }
        particleCtx.beginPath();
        particleCtx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        particleCtx.fillStyle = `rgba(255,215,160,${particle.alpha})`;
        particleCtx.fill();
      }
      state.animationFrame = requestAnimationFrame(draw);
    }

    function start() {
      resize();
      if (!prefersReducedMotion) state.animationFrame = requestAnimationFrame(draw);
      else draw(performance.now());
    }

    return { start, resize };
  })();

  const celebrationEngine = (() => {
    const canvas = dom.celebrationCanvas;
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let dpr = 1;
    let running = false;
    let particles = [];
    let confetti = [];
    let frameId = 0;
    let lastBurst = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function addFirework(x = random(width * .12, width * .88), y = random(height * .12, height * .55)) {
      const hue = random(330, 410);
      const count = window.innerWidth < 600 ? 38 : 62;
      for (let index = 0; index < count; index += 1) {
        const angle = (Math.PI * 2 * index) / count + random(-.05, .05);
        const speed = random(70, 230);
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: random(.55, 1.05),
          size: random(1.2, 3.2),
          hue: hue + random(-18, 18)
        });
      }
    }

    function addConfetti() {
      const amount = window.innerWidth < 600 ? 70 : 130;
      for (let index = 0; index < amount; index += 1) {
        confetti.push({
          x: width / 2 + random(-80, 80),
          y: height * .42 + random(-40, 40),
          vx: random(-280, 280),
          vy: random(-380, -80),
          gravity: random(190, 290),
          rotation: random(0, Math.PI),
          vr: random(-8, 8),
          width: random(5, 10),
          height: random(9, 16),
          hue: random(325, 420),
          life: random(2.8, 5.2)
        });
      }
    }

    function draw(now) {
      if (!running || state.visibilityPaused) return;
      ctx.clearRect(0, 0, width, height);
      const dt = 1 / 60;

      if (now - lastBurst > 900) {
        addFirework();
        lastBurst = now;
      }

      ctx.globalCompositeOperation = "lighter";
      particles = particles.filter(particle => {
        particle.vy += 80 * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= .985;
        particle.vy *= .985;
        particle.life -= particle.decay * dt;
        if (particle.life <= 0) return false;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 90%, 72%, ${particle.life})`;
        ctx.fill();
        return true;
      });

      ctx.globalCompositeOperation = "source-over";
      confetti = confetti.filter(piece => {
        piece.vy += piece.gravity * dt;
        piece.x += piece.vx * dt;
        piece.y += piece.vy * dt;
        piece.rotation += piece.vr * dt;
        piece.life -= dt;
        if (piece.life <= 0 || piece.y > height + 30) return false;
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation);
        ctx.fillStyle = `hsl(${piece.hue}, 75%, 65%)`;
        ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
        ctx.restore();
        return true;
      });

      frameId = requestAnimationFrame(draw);
    }

    function start() {
      resize();
      running = true;
      particles = [];
      confetti = [];
      addConfetti();
      addFirework(width * .28, height * .34);
      addFirework(width * .72, height * .3);
      if (!prefersReducedMotion) frameId = requestAnimationFrame(draw);
      else draw(performance.now());
    }

    function stop() {
      running = false;
      cancelAnimationFrame(frameId);
      particles = [];
      confetti = [];
      ctx.clearRect(0, 0, width, height);
    }

    return { start, stop, resize, addFirework };
  })();

  function bindEvents() {
    document.addEventListener("click", event => {
      const nextButton = event.target.closest("[data-next]");
      if (nextButton) {
        if (!state.audioStarted && state.audioEnabled) audioEngine.start();
        goToScene(nextButton.dataset.next);
        return;
      }

      const galleryCard = event.target.closest("[data-gallery-index]");
      if (galleryCard) openLightbox(Number(galleryCard.dataset.galleryIndex));

      const reasonCard = event.target.closest(".reason-card");
      if (reasonCard) {
        reasonCard.classList.toggle("is-flipped");
        playClick(.4);
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !dom.lightbox.hidden) closeLightbox();
      const reasonCard = event.target.closest?.(".reason-card");
      if (reasonCard && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        reasonCard.classList.toggle("is-flipped");
      }
    });

    dom.bookPrev.addEventListener("click", () => turnBook(-1));
    dom.bookNext.addEventListener("click", () => turnBook(1));
    dom.lightboxClose.addEventListener("click", closeLightbox);
    dom.lightbox.addEventListener("click", event => {
      if (event.target === dom.lightbox) closeLightbox();
    });

    dom.audioToggle.addEventListener("click", () => audioEngine.setEnabled(!state.audioEnabled));
    dom.yes.addEventListener("click", acceptProposal);

    ["pointerdown", "click", "touchstart"].forEach(type => {
      dom.no.addEventListener(type, event => {
        event.preventDefault();
        event.stopPropagation();
        moveNoButton();
      }, { passive: false });
    });
    dom.no.addEventListener("pointerenter", moveNoButton);
    document.addEventListener("pointermove", detectNoProximity, { passive: true });

    dom.restart.addEventListener("click", restartJourney);
    dom.heartLogo.addEventListener("click", () => {
      state.logoClicks += 1;
      playClick(.35);
      if (state.logoClicks >= 5) {
        state.logoClicks = 0;
        showEasterEgg();
      }
    });

    window.addEventListener("resize", () => {
      ambientEngine.resize();
      celebrationEngine.resize();
      if (state.scene === 9) resetNoButton();
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      state.visibilityPaused = document.hidden;
      if (!document.hidden) {
        ambientEngine.start();
        if (state.celebrationActive) celebrationEngine.start();
      }
    });
  }

  function initialise() {
    renderTimeline();
    renderGallery();
    renderReasons();
    renderBook();
    renderProgress();
    renderCountdown();
    createFloatingHearts(16);
    createFireflies(22);
    checkMidnightMode();
    updateAudioButton();
    ambientEngine.start();
    bindEvents();
    window.setInterval(updateCountdown, 1000);
    window.setInterval(checkMidnightMode, 60000);
  }

  initialise();
})();
