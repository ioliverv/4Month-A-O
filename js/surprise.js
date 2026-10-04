// Interactive growing pumpkin and full-screen explosion celebration

(() => {
  // Configuration & constants

  const TAPS_TO_BURST = 7;

  const HINTS = [
    "¡Tócame! 🎃",
    "Otra vez… ✨",
    "Está creciendo 👀",
    "¡Más grande! 🔮",
    "Uy… está temblando 😳",
    "¡Va a explotar! 💥",
    "¡Último toque! 🧡",
  ];

  const FINAL_MESSAGES = [
    {
      icon: "🎃💛",
      eyebrow: "BUUU",
      title: "¡BOOM! Me explotó el corazón.",
      text: "Así se siente cada vez que te veo algo que crece, crece y crece hasta que ya no cabe en ningún lado. Felices 4 meses.",
    },
  ];

  const CANDIES = ["🍬", "🍭", "🍫", "🎃", "👻", "💜", "🧡", "✨", "🦇", "🕸️", "⭐"];
  const SPARK_COLORS = ["#ffd27d", "#ff8c2e", "#c56aff", "#ffffff", "#ff5fa2"];

  const CRACKS_SVG =
    '<svg class="grow-pumpkin__cracks" viewBox="0 0 100 78" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    '<path d="M50 4 L46 14 L52 20 L47 30"/>' +
    '<path d="M14 30 L22 34 L19 42 L27 47"/>' +
    '<path d="M86 28 L79 35 L83 42 L75 48"/>' +
    '<path d="M30 70 L36 63 L33 57"/>' +
    '<path d="M70 71 L64 64 L68 58"/></svg>';

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // State

  let stage = null;
  let button = null;
  let hint = null;
  let meter = null;
  let fxLayer = null;
  let fxCanvas = null;
  let fxContext = null;
  let taps = 0;
  let busy = false;
  let explosions = 0;
  let audioCtx = null;
  let boomBuffer = null;
  let showTimer = null;
  let hasExploded = false;
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    ratio: Math.min(window.devicePixelRatio || 1, 2),
  };

  // Particle engine state
  const particles = [];
  const sprites = new Map();
  let rafId = null;
  let explosionFrame = null;
  let visualTime = 0;
  let previousFrame = null;
  let screenBurst = null;
  let candyRain = null;

  // Helper functions: Math & utilities

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const isMobile = () => viewport.width < 700;

  function restartClass(element, className) {
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  // Helper functions: Audio

  function getAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function playTapSound(level) {
    const ctx = getAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = 220 + level * 90;

    osc.type = "sine";
    osc.frequency.setValueAtTime(start, now);
    osc.frequency.exponentialRampToValueAtTime(start * 2.2, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(start * 0.6, now + 0.22);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  function prepareBoomSound() {
    const ctx = getAudio();
    if (!ctx || boomBuffer) return;
    const length = Math.floor(ctx.sampleRate * 1.8);
    boomBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = boomBuffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.2);
    }
  }

  function playBoomSound() {
    const ctx = getAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();
    noise.buffer = boomBuffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 1.6);
    noiseGain.gain.setValueAtTime(0.9, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.7);
    noise.connect(filter).connect(noiseGain).connect(ctx.destination);
    noise.start(now);

    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = "sine";
    thump.frequency.setValueAtTime(120, now);
    thump.frequency.exponentialRampToValueAtTime(28, now + 0.6);
    thumpGain.gain.setValueAtTime(0.9, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    thump.connect(thumpGain).connect(ctx.destination);
    thump.start(now);
    thump.stop(now + 0.72);

    [660, 880, 1100, 1320, 1760, 2200].forEach((freq, index) => {
      const t = now + 0.18 + index * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.62);
    });
  }

  function playLaugh() {
    if (typeof pumpkinLaughs === "undefined" || !pumpkinLaughs.length) return;
    const laugh = pick(pumpkinLaughs);
    laugh.currentTime = 0;
    laugh.volume = 0.6;
    laugh.play().catch(() => {});
  }

  function duckMusic(duration) {
    if (typeof backgroundMusic === "undefined") return;
    backgroundMusic.volume = 0.25;
    window.setTimeout(() => {
      if (typeof updateBackgroundMusicVolume === "function") {
        updateBackgroundMusicVolume();
      } else {
        backgroundMusic.volume = 1;
      }
    }, duration);
  }

  // Helper functions: Particle textures & DOM generators

  function spriteFor(element) {
    const kind = element.classList.contains("fx-candy")
      ? "candy"
      : element.classList.contains("fx-bat")
        ? "bat"
        : "spark";
    const size = Math.max(
      4,
      Math.round(parseFloat(element.style.getPropertyValue("--size")) / 8) * 8,
    );
    const color = element.style.getPropertyValue("--color");
    const key = `${kind}:${size}:${element.textContent}:${color}`;
    if (sprites.has(key)) return sprites.get(key);

    const image = document.createElement("canvas");
    const width = kind === "spark" ? size * 4 : size * 1.8;
    const height = kind === "bat" ? size : width;
    image.width = Math.ceil(width * 2);
    image.height = Math.ceil(height * 2);
    const ctx = image.getContext("2d");
    ctx.scale(2, 2);

    if (kind === "candy") {
      ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(element.textContent, width / 2, height / 2);
    } else if (kind === "spark") {
      const glow = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width / 2,
      );
      glow.addColorStop(0, color);
      glow.addColorStop(0.2, color);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.translate((width - size) / 2, (height - size * 0.48) / 2);
      ctx.scale(size / 100, size / 100);
      ctx.fillStyle = "#1a1028";
      ctx.strokeStyle = "#ff9e43";
      ctx.lineWidth = 1;
      [
        "M50 23 C39 13 25 6 4 11 C13 15 13 22 4 29 C17 24 21 29 21 35 C28 28 32 29 36 38 C40 29 45 27 50 30 Z",
        "M50 23 C61 13 75 6 96 11 C87 15 87 22 96 29 C83 24 79 29 79 35 C72 28 68 29 64 38 C60 29 55 27 50 30 Z",
        "M44 19 L44 11 L48 16 Q50 14 52 16 L56 11 L56 19 Q61 28 55 40 Q50 45 45 40 Q39 28 44 19 Z",
      ].forEach((path) => {
        const shape = new Path2D(path);
        ctx.fill(shape);
        ctx.stroke(shape);
      });
      ctx.fillStyle = "#ffcf5a";
      [47, 53].forEach((x) => {
        ctx.beginPath();
        ctx.arc(x, 23, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    const sprite = { image, width, height };
    sprites.set(key, sprite);
    return sprite;
  }

  function makeCandy(size) {
    const el = document.createElement("span");
    el.className = "fx-particle fx-candy";
    el.textContent = pick(CANDIES);
    el.style.setProperty("--size", `${size}px`);
    return el;
  }

  function makeSpark(size) {
    const el = document.createElement("span");
    el.className = "fx-particle fx-spark";
    el.style.setProperty("--size", `${size}px`);
    el.style.setProperty("--color", pick(SPARK_COLORS));
    return el;
  }

  function makeBat(size) {
    const el = document.createElement("span");
    el.className = "fx-particle fx-bat";
    el.style.setProperty("--size", `${size}px`);
    return el;
  }

  function startCandyRain(onCandiesFinished) {
    candyRain = {
      endsAt: visualTime + 2600,
      nextAt: visualTime + 350,
      onFinished: onCandiesFinished,
    };
  }

  function screenEffects(x, y) {
    screenBurst = { x, y, startedAt: visualTime };
    fxLayer.classList.add("is-bursting");

    const experience = document.querySelector(".experience");
    if (experience && !reducedMotion) {
      restartClass(experience, "boom-shake");
      window.setTimeout(() => experience.classList.remove("boom-shake"), 750);
    }
  }

  function drawScreenBurst(time, width, height) {
    if (!screenBurst) return;
    const elapsed = time - screenBurst.startedAt;
    if (elapsed >= 1400) {
      screenBurst = null;
      fxLayer.classList.remove("is-bursting");
      return;
    }
    const { x, y } = screenBurst;
    const radius = Math.hypot(width, height);
    fxContext.save();
    const glow = fxContext.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, "#fffbe8");
    glow.addColorStop(0.18, "#ffd27d");
    glow.addColorStop(0.42, "#ff7a1a");
    glow.addColorStop(1, "rgba(150, 50, 230, 0)");
    fxContext.globalAlpha =
      elapsed < 80
        ? lerp(0.45, 0.85, elapsed / 80)
        : 0.85 * Math.pow(1 - (elapsed - 80) / 1320, 2);
    fxContext.fillStyle = glow;
    fxContext.fillRect(0, 0, width, height);
    [
      ["#fff3c4", 0],
      ["#ff8c2e", 120],
      ["#c56aff", 260],
    ].forEach(([color, delay]) => {
      const progress = (elapsed - delay) / 1100;
      if (progress < 0 || progress > 1) return;
      fxContext.globalAlpha = 1 - progress;
      fxContext.strokeStyle = color;
      fxContext.lineWidth = lerp(6, 1, progress);
      fxContext.beginPath();
      fxContext.arc(
        x,
        y,
        lerp(6, radius, 1 - Math.pow(1 - progress, 3)),
        0,
        Math.PI * 2,
      );
      fxContext.stroke();
    });
    fxContext.restore();
  }

  // Layout & positioning

  function layout() {
    if (!button) return;

    const card = document.querySelector(".final-card");
    const progress = taps / (TAPS_TO_BURST - 1);
    const base = button.offsetWidth || 80;
    const maxGrow = Math.max(
      2,
      (Math.min(window.innerWidth, window.innerHeight) * 0.62) / base,
    );
    const grow = lerp(1, maxGrow, Math.pow(progress, 1.15));

    let startY = window.innerHeight * 0.22;
    if (card) {
      const rect = card.getBoundingClientRect();
      startY = rect.top + 42;
    }
    startY = Math.max(startY, base * 0.6 + 24);
    const y = lerp(startY, window.innerHeight / 2, Math.min(1, progress * 1.25));

    button.style.setProperty("--grow", grow.toFixed(3));
    button.style.setProperty("--heat", progress.toFixed(3));
    button.style.top = `${y}px`;
    meter.style.setProperty("--progress", progress.toFixed(3));
    stage.style.setProperty("--heat", progress.toFixed(3));
    stage.style.setProperty("--dim-y", `${(y / window.innerHeight) * 100}%`);
    hint.textContent = HINTS[Math.min(taps, HINTS.length - 1)];
    button.classList.toggle("is-critical", taps >= TAPS_TO_BURST - 2);
  }

  function showStage() {
    if (!stage) buildStage();
    taps = 0;
    busy = false;
    button.classList.remove("is-exploding", "is-critical", "is-swelling");
    button.style.opacity = "";
    const body = button.querySelector(".grow-pumpkin__body");
    body.getAnimations().forEach((animation) => animation.cancel());
    body.style.transform = "";
    body.style.filter = "";
    body.style.opacity = "";
    layout();
    stage.classList.add("is-visible");
    restartClass(button, "is-entering");
  }

  function hideStage() {
    window.clearTimeout(showTimer);
    if (stage) stage.classList.remove("is-visible");
  }

  // Main functions: Stage construction

  function buildStage() {
    stage = document.createElement("div");
    stage.className = "pumpkin-stage";
    stage.innerHTML = '<div class="pumpkin-stage__dim"></div>';

    button = document.createElement("button");
    button.type = "button";
    button.className = "grow-pumpkin";
    button.id = "grow-pumpkin";
    button.setAttribute("aria-label", "Toca la calabaza mágica");

    const body = document.createElement("span");
    body.className = "grow-pumpkin__body";
    body.innerHTML = '<span class="grow-pumpkin__aura"></span>';
    body.appendChild(createPumpkin());
    body.insertAdjacentHTML("beforeend", CRACKS_SVG);

    meter = document.createElement("span");
    meter.className = "grow-pumpkin__meter";
    meter.innerHTML = "<i></i>";

    hint = document.createElement("span");
    hint.className = "grow-pumpkin__hint";
    hint.setAttribute("aria-live", "polite");

    button.append(body, meter, hint);
    stage.appendChild(button);

    fxLayer = document.createElement("div");
    fxLayer.className = "boom-layer";
    fxLayer.setAttribute("aria-hidden", "true");
    fxCanvas = document.createElement("canvas");
    fxContext = fxCanvas.getContext("2d");
    fxLayer.appendChild(fxCanvas);

    document.body.append(stage, fxLayer);

    button.addEventListener("click", handleTap);
    button.addEventListener("animationend", handleEnterAnimationEnd);
    window.addEventListener("resize", handleResize);
  }

  // Main functions: Particle simulation & bursts

  function spawn(element, options) {
    particles.push({
      sprite: spriteFor(element),
      isCandy: element.classList.contains("fx-candy"),
      x: options.x,
      y: options.y,
      vx: options.vx || 0,
      vy: options.vy || 0,
      gravity: options.gravity || 0,
      drag: options.drag || 0.99,
      rot: options.rot || 0,
      vr: options.vr || 0,
      scale: options.scale || 1,
      grow: options.grow || 0,
      maxScale: options.maxScale || 1.2,
      tilt: options.tilt || false,
      life: 0,
      maxLife: options.maxLife || 100,
      updatedAt: options.time ?? visualTime,
    });
    if (!rafId) {
      rafId = requestAnimationFrame(tick);
    }
  }

  function tick(timestamp) {
    if (previousFrame !== null) {
      visualTime += Math.min(50, Math.max(0, timestamp - previousFrame));
    }
    previousFrame = timestamp;
    const time = visualTime;

    if (explosionFrame) explosionFrame(time);
    const { width, height, ratio } = viewport;
    if (
      fxCanvas.width !== Math.round(width * ratio) ||
      fxCanvas.height !== Math.round(height * ratio)
    ) {
      fxCanvas.width = Math.round(width * ratio);
      fxCanvas.height = Math.round(height * ratio);
    }
    fxContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    fxContext.clearRect(0, 0, width, height);
    drawScreenBurst(time, width, height);

    if (candyRain && time < candyRain.endsAt && time >= candyRain.nextAt) {
      candyRain.nextAt += 70;
      for (let i = 0; i < (isMobile() ? 2 : 4); i += 1) {
        spawn(makeCandy(rand(20, 34)), {
          x: rand(0, viewport.width),
          y: rand(-80, -30),
          vx: rand(-1.2, 1.2),
          vy: rand(2, 5),
          gravity: 0.1,
          drag: 0.995,
          rot: rand(0, 360),
          vr: rand(-6, 6),
          maxLife: 400,
        });
      }
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      const step = Math.max(0, (time - p.updatedAt) / 16.67);
      p.updatedAt = time;
      p.life += step;

      const offscreen =
        p.x < -150 || p.x > width + 150 || p.y > height + 150 || p.y < -400;
      if (p.life >= p.maxLife || offscreen) {
        particles.splice(i, 1);
        continue;
      }

      const drag = Math.pow(p.drag, step);
      const travel = (p.drag * (1 - drag)) / (1 - p.drag);
      const terminalVelocity = p.gravity / (1 - p.drag);
      p.x += p.vx * travel;
      p.y += (p.vy - terminalVelocity) * travel + terminalVelocity * step;
      p.vx *= drag;
      p.vy = terminalVelocity + (p.vy - terminalVelocity) * drag;
      p.rot += p.vr * step;
      p.scale = Math.min(p.maxScale, p.scale + p.grow * step);

      const fadeStart = p.maxLife - 25;
      const opacity =
        p.life > fadeStart ? Math.max(0, (p.maxLife - p.life) / 25) : 1;
      const angle = p.tilt ? Math.atan2(p.vy, p.vx) * 57.3 * 0.25 : p.rot;

      fxContext.save();
      fxContext.globalAlpha = opacity;
      fxContext.translate(p.x, p.y);
      fxContext.rotate((angle * Math.PI) / 180);
      fxContext.scale(p.scale, p.scale);
      fxContext.drawImage(
        p.sprite.image,
        -p.sprite.width / 2,
        -p.sprite.height / 2,
        p.sprite.width,
        p.sprite.height,
      );
      fxContext.restore();
    }

    if (
      candyRain &&
      time >= candyRain.endsAt &&
      !particles.some((particle) => particle.isCandy)
    ) {
      const finished = candyRain.onFinished;
      candyRain = null;
      finished();
    }
    if (particles.length || explosionFrame || candyRain || screenBurst) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
      previousFrame = null;
    }
  }

  function tapBurst(x, y, level) {
    const count = 8 + level * 3;
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(2, 5 + level);
      const isCandy = i % 4 === 0;
      spawn(isCandy ? makeCandy(rand(16, 24)) : makeSpark(rand(4, 8)), {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        gravity: 0.18,
        drag: 0.97,
        vr: rand(-10, 10),
        scale: 0.6,
        grow: 0.04,
        maxScale: 1,
        maxLife: rand(35, 55),
      });
    }
  }

  function prepareBigBurst(x, y, radius) {
    const pending = [];
    const enqueue = (element, options) => {
      const angle = Math.atan2(options.vy, options.vx);
      const spread = radius * rand(0.12, 0.55);
      options.x += Math.cos(angle) * spread;
      options.y += Math.sin(angle) * spread * 0.78;
      spriteFor(element);
      pending.push({ element, options });
    };
    const size = Math.max(viewport.width, viewport.height);
    const power = size / 55;
    const density = isMobile() ? 0.6 : 1;
    const batCount = Math.round(16 * density);
    const candyCount = Math.round(64 * density);
    const sparkCount = Math.round(40 * density);

    for (let i = 0; i < batCount; i += 1) {
      const angle = (i / batCount) * Math.PI * 2 + rand(-0.2, 0.2);
      const speed = power * rand(0.45, 0.95);
      enqueue(makeBat(rand(30, 60)), {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        gravity: -0.03,
        drag: 0.985,
        scale: 0.3,
        grow: 0.035,
        maxScale: rand(1, 1.6),
        tilt: true,
        maxLife: rand(110, 160),
      });
    }

    for (let i = 0; i < candyCount; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = power * rand(0.25, 1.1);
      enqueue(makeCandy(rand(22, 42)), {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - power * 0.25,
        gravity: rand(0.18, 0.32),
        drag: 0.975,
        rot: rand(0, 360),
        vr: rand(-14, 14),
        scale: 0.9,
        grow: 0.05,
        maxScale: rand(1, 1.4),
        maxLife: rand(130, 210),
      });
    }

    for (let i = 0; i < sparkCount; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = power * rand(0.4, 1.4);
      enqueue(makeSpark(rand(4, 11)), {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.08,
        drag: 0.96,
        maxLife: rand(50, 100),
      });
    }

    return (onCandiesFinished, time) => {
      pending.forEach(({ element, options }) => {
        options.time = time;
        spawn(element, options);
      });
      startCandyRain(onCandiesFinished);
    };
  }

  function showMessage() {
    const data = FINAL_MESSAGES[explosions % FINAL_MESSAGES.length];
    explosions += 1;

    const overlay = document.createElement("div");
    overlay.className = "boom-message";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "boom-message-title");
    overlay.innerHTML = `
      <div class="boom-message__card">
        <span class="boom-message__icon" aria-hidden="true">${data.icon}</span>
        <p class="boom-message__eyebrow">${data.eyebrow}</p>
        <h2 class="boom-message__title" id="boom-message-title">${data.title}</h2>
        <p class="boom-message__text">${data.text}</p>
        <p class="boom-message__sign">TE QUIERO</p>
        <button class="primary-button boom-message__button" id="boom-message-close" type="button">
          Cerrar
        </button>
      </div>`;
    document.body.appendChild(overlay);

    const close = overlay.querySelector("#boom-message-close");
    close.focus({ preventScroll: true });
    close.addEventListener("click", () => {
      overlay.classList.add("is-leaving");
      window.setTimeout(() => {
        overlay.remove();
      }, 400);

      const finalCard = document.querySelector(".final-card");
      if (finalCard) {
        finalCard.classList.remove("is-blurred");
      }
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        close.click();
      }
    });
  }

  function explode(x, y) {
    busy = true;
    document.body.classList.add("surprise-running");
    hasExploded = true;
    hint.textContent = "¡Se está inflando! 🎃";
    button.classList.remove("is-hit", "is-critical", "is-entering");
    const body = button.querySelector(".grow-pumpkin__body");
    const grow = Number(button.style.getPropertyValue("--grow")) || 1;
    const width = button.offsetWidth * grow;
    const height = button.offsetHeight * grow;
    const baseWidth = button.offsetWidth;
    const swell = Math.min(
      1.9,
      (window.innerWidth * 1.02) / width,
      (window.innerHeight * 0.94) / height,
    );
    const finalScale = Math.max(1, swell);
    playTapSound(TAPS_TO_BURST + 2);

    const rect = button.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
    const explosionY = window.innerHeight / 2;
    prepareBoomSound();
    const launchBurst = prepareBigBurst(x, explosionY, (width * finalScale) / 2);

    const burst = (time) => {
      button.classList.add("is-exploding");
      screenEffects(x, explosionY);
      launchBurst(() => {
        window.setTimeout(() => {
          stage.classList.remove("is-visible");
          document.body.classList.remove("surprise-running");
          showMessage();
        }, 300);
      }, time);
      playBoomSound();
      playLaugh();
      duckMusic(5750);
    };

    if (reducedMotion) {
      button.classList.add("is-swelling");
      button.style.top = `${explosionY}px`;
      burst(visualTime);
      return;
    }

    button.classList.add("is-swelling");
    const currentScale = rect.width / baseWidth;
    button.style.setProperty("--grow", currentScale.toFixed(3));
    button.style.top = `${y}px`;
    const inflationDuration = 1350;
    const burstDuration = 180;
    const currentFinalScale = (finalScale * grow) / currentScale;
    let startTime = null;
    let burstStarted = false;

    explosionFrame = (time) => {
      if (startTime === null) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / inflationDuration);
      const expansion = Math.max(
        0,
        Math.min(1, (elapsed - inflationDuration) / burstDuration),
      );
      const scale =
        1 +
        (currentFinalScale - 1) * progress * progress +
        currentFinalScale * 0.35 * expansion;
      if (Math.abs(y - explosionY) > 0.01) {
        button.style.top = `${lerp(y, explosionY, progress)}px`;
      }
      body.style.transform = `scale(${scale})`;
      body.style.opacity = `${1 - expansion}`;
      if (!burstStarted && elapsed >= inflationDuration) {
        burstStarted = true;
        burst(time);
      }
      if (expansion === 1) explosionFrame = null;
    };
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  // Event handlers

  function handleTap() {
    if (busy) return;

    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    taps += 1;

    if (taps >= TAPS_TO_BURST) {
      explode(x, y);
      return;
    }

    playTapSound(taps);
    if (taps === TAPS_TO_BURST - 2) playLaugh();
    restartClass(button, "is-hit");
    restartClass(hint, "is-pulse");
    tapBurst(x, y, taps);
    layout();

    const card = document.querySelector(".final-card");
    if (card && !reducedMotion) restartClass(card, "tap-shake");
  }

  function handleResize() {
    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;
    viewport.ratio = Math.min(window.devicePixelRatio || 1, 2);
    layout();
  }

  function handleEnterAnimationEnd(event) {
    if (event.animationName === "grow-pumpkin-enter") {
      button.classList.remove("is-entering");
    }
  }

  // Lifecycle & scene synchronization

  function syncWithFinalScene() {
    const active = scenes.final.classList.contains("is-active");
    window.clearTimeout(showTimer);
    if (active && !hasExploded) {
      showTimer = window.setTimeout(showStage, 1100);
    } else {
      hideStage();
    }
  }

  // Event listeners & initialization

  new MutationObserver(syncWithFinalScene).observe(scenes.final, {
    attributes: true,
    attributeFilter: ["class"],
  });
  syncWithFinalScene();
})();
