// Configuration & constants

const LETTER_PARAGRAPHS = [
  "Hoy cumplimos 4 meses, y no sabes lo bonito que se siente mirar todo lo que hemos vivido en tan poquito tiempo. Justo empiezan algunas de las épocas más bonitas del año, y me emociona muchísimo pensar en todo lo que viene para nosotros: disfrazarnos juntos, salir más, conocer lugares nuevos, hacer planes sencillos y otros más especiales, y seguir disfrutando de tantas cosas a tu lado.",
  "Quiero darte las gracias por seguir conmigo, por hacerme feliz, por quererme y, sobre todo, por algo que valoro muchísimo: por dedicarme tu tiempo y tu cariño. Sé que el tiempo es de las cosas más valiosas que podemos darle a alguien, y me hace sentir muy afortunado que elijas compartir una parte del tuyo conmigo.",
  "He pensado mucho en lo bonito que es lo nuestro y en todo lo que seguimos construyendo poco a poco. Me encanta recordar cada una de nuestras salidas, porque contigo he aprendido que no importa qué tan grande o sencillo sea el plan. Puede ser una cita preparada con días de anticipación o simplemente pasar un rato juntos; al final, lo que hace especial cada momento es poder vivirlo contigo.",
  "Me encanta seguir conociéndote, descubrir cosas nuevas de ti y darme cuenta de que cada día encuentro una razón más para quererte. Me sigues encantando, me sigues haciendo feliz y sigo sintiéndome increíblemente afortunado de poder estar a tu lado.",
  "Y estos meses que vienen me hacen todavía más ilusión porque serán nuestras primeras veces viviendo juntos épocas tan bonitas: nuestro primer Halloween, nuestro primer Día de Muertos, nuestra primera Navidad y nuestro primer Año Nuevo. Tal vez me estoy adelantando un poquito, pero la verdad es que cuando pienso en todo lo que viene, me emociona imaginarte ahí conmigo.",
  "Quiero seguir haciendo recuerdos contigo, seguir riéndome a tu lado, seguir conociendo lugares, acompañarte en tus días buenos y también en los que no lo sean tanto. Quiero seguir cuidando esto tan bonito que tenemos y seguir eligiéndote todos los días.",
  "Y sí, quizá suene cursi, pero cuando pienso en el futuro, me gusta imaginar que algún día podremos mirar hacia atrás, ya viejitos, y recordar todas estas primeras veces, todas nuestras citas, nuestros viajes, nuestras tonterías y cada pequeño momento que nos fue trayendo hasta ahí.",
  "No quiero estar con nadie más.",
  "Gracias por estos 4 meses, por tu tiempo, por tu cariño, por cada abrazo, cada sonrisa y cada momento que me has regalado.",
  "Te quiero muchísimo, te adoro y me encantas. Y si estos cuatro meses han sido así de bonitos, no puedo evitar emocionarme por todo lo que todavía nos falta vivir juntos. ❤️",
];

const FLOWERS = [
  ["wine", 260, 116, 1.08],
  ["violet", 158, 164, 0.92],
  ["pumpkin", 356, 164, 0.97],
  ["moon", 99, 244, 0.78],
  ["pumpkin", 204, 230, 1.04],
  ["wine", 310, 236, 1.13],
  ["violet", 422, 252, 0.83],
  ["wine", 139, 318, 0.91],
  ["moon", 251, 328, 0.94],
  ["pumpkin", 367, 328, 0.92],
  ["violet", 199, 397, 0.72],
  ["wine", 307, 402, 0.76],
];

const FOLIAGE_SPRIGS = [
  [144, 172, -45],
  [370, 185, 45],
  [151, 291, -65],
  [365, 306, 60],
  [218, 393, -40],
  [301, 397, 40],
];

const BACKGROUND_PUMPKINS = [
  [1, 80, 115],
  [89, 79, 105],
  [8, 43, 65],
  [87, 35, 73],
  [19, 89, 60],
  [73, 87, 70],
  [1, 18, 45],
  [94, 14, 48],
  [32, 93, 42],
  [62, 92, 48],
];

// State

let litCount = 0;
let letterStarted = false;
let activePumpkinLaugh = null;
let activeAmbientSound = null;
let ambientTimer = null;
let lastAmbientIndex = -1;
let ambientBlocked = false;

// DOM elements

const scenes = {
  intro: document.getElementById("intro-scene"),
  wish: document.getElementById("wish-scene"),
  bouquet: document.getElementById("bouquet-scene"),
  letter: document.getElementById("letter-scene"),
  final: document.getElementById("final-scene"),
};

const startButton = document.getElementById("start-button");
const fireflies = [...document.querySelectorAll(".firefly")];
const ritualStatus = document.getElementById("ritual-status");
const openLetterButton = document.getElementById("open-letter-button");
const finishLetterButton = document.getElementById("finish-letter-button");
const replayButton = document.getElementById("replay-button");
const backgroundMusic = document.getElementById("background-music");
const pumpkinLaughs = [...document.querySelectorAll(".pumpkin-laugh")];
const ambientSounds = [...document.querySelectorAll(".ambient-sound")];
const magicChimes = document.getElementById("magic-chimes");
const letterBody = document.getElementById("letter-body");
const letterSignature = document.querySelector(".signature");

// Helper functions

function updateBackgroundMusicVolume() {
  backgroundMusic.volume = activePumpkinLaugh ? 0.35 : activeAmbientSound ? 0.6 : 1;
}

function scheduleAmbientSound(delay = 25000 + Math.random() * 20000) {
  window.clearTimeout(ambientTimer);
  ambientTimer = window.setTimeout(playAmbientSound, delay);
}

function playAmbientClip(sound) {
  activeAmbientSound = sound;
  sound.currentTime = 0;
  sound.volume = 0.5;
  updateBackgroundMusicVolume();
  sound
    .play()
    .then(() => {
      ambientBlocked = false;
    })
    .catch((error) => {
      if (activeAmbientSound === sound) {
        activeAmbientSound = null;
        updateBackgroundMusicVolume();
        if (ambientSounds.includes(sound) && error.name === "NotAllowedError") {
          ambientBlocked = true;
        }
        scheduleAmbientSound();
      }
    });
}

function playAmbientSound() {
  ambientTimer = null;
  if (document.hidden || activePumpkinLaugh || activeAmbientSound) {
    scheduleAmbientSound(7000);
    return;
  }

  let index = Math.floor(Math.random() * ambientSounds.length);
  if (index === lastAmbientIndex) {
    index =
      (index + 1 + Math.floor(Math.random() * (ambientSounds.length - 1))) %
      ambientSounds.length;
  }
  lastAmbientIndex = index;

  playAmbientClip(ambientSounds[index]);
}

function stopAmbientSound() {
  if (activeAmbientSound) {
    activeAmbientSound.pause();
    activeAmbientSound.currentTime = 0;
    activeAmbientSound = null;
    updateBackgroundMusicVolume();
  }
}

function retryAmbientAfterInteraction() {
  if (ambientBlocked && !activeAmbientSound && !activePumpkinLaugh) {
    ambientBlocked = false;
    window.clearTimeout(ambientTimer);
    playAmbientSound();
  }
}

function playMagicChimes() {
  window.clearTimeout(ambientTimer);
  ambientTimer = null;
  stopAmbientSound();
  if (activePumpkinLaugh) {
    activePumpkinLaugh.pause();
    activePumpkinLaugh = null;
  }
  playAmbientClip(magicChimes);
}

function updateRitualStatus(remaining) {
  ritualStatus.textContent = remaining
    ? `Falta${remaining === 1 ? "" : "n"} ${remaining} calabaza${remaining === 1 ? "" : "s"} por encender.`
    : "Cumpliré tus deseos.";
}

function buildStars() {
  const stars = document.getElementById("stars");
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 54; index += 1) {
    const star = document.createElement("i");
    star.className = "star";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 82}%`;
    star.style.setProperty("--size", `${1 + Math.random() * 3}px`);
    star.style.setProperty("--opacity", `${0.25 + Math.random() * 0.7}`);
    star.style.setProperty("--duration", `${1.6 + Math.random() * 3}s`);
    fragment.appendChild(star);
  }

  stars.appendChild(fragment);
}

function createPumpkin() {
  const pumpkin = document.createElement("div");
  pumpkin.className = "jack-o-lantern";
  pumpkin.innerHTML =
    '<i class="pumpkin-stalk"></i><i class="pumpkin-rib rib-left"></i><i class="pumpkin-rib rib-right"></i><i class="pumpkin-rib rib-center"></i><div class="pumpkin-face"><i class="pumpkin-eye eye-left"></i><i class="pumpkin-eye eye-right"></i><i class="pumpkin-mouth"></i></div>';

  return pumpkin;
}

function createHalloweenBackground() {
  const background = document.querySelector(".halloween-background");

  for (let index = 0; index < 16; index += 1) {
    const bat = document.createElement("div");
    const left =
      index < 36
        ? index % 2 === 0
          ? 1 + ((index * 13) % 27)
          : 72 + ((index * 17) % 25)
        : 32 + ((index * 19) % 36);
    const top = index < 36 ? 7 + ((index * 23) % 82) : 3 + ((index * 7) % 12);

    bat.className = "night-bat";
    bat.style.cssText = `left:${left}%;top:${top}%;--size:${30 + (index % 5) * 11}px;--flight:${6 + (index % 7)}s;--phase:${-index * 1.7}s;--tilt:${index % 2 ? 12 : -12}deg;--depth:${0.6 + (index % 4) * 0.1};--flap:${0.7 + (index % 3) * 0.22}s`;
    bat.innerHTML =
      '<svg viewBox="0 0 100 48" aria-hidden="true" focusable="false"><path class="bat-wing wing-left" d="M50 23 C39 13 25 6 4 11 C13 15 13 22 4 29 C17 24 21 29 21 35 C28 28 32 29 36 38 C40 29 45 27 50 30 Z"/><path class="bat-wing wing-right" d="M50 23 C61 13 75 6 96 11 C87 15 87 22 96 29 C83 24 79 29 79 35 C72 28 68 29 64 38 C60 29 55 27 50 30 Z"/><path class="bat-vein wing-left" d="M48 25 Q28 14 9 13 M46 27 Q29 23 21 32"/><path class="bat-vein wing-right" d="M52 25 Q72 14 91 13 M54 27 Q71 23 79 32"/><path class="bat-body" d="M44 19 L44 11 L48 16 Q50 14 52 16 L56 11 L56 19 Q61 28 55 40 Q50 45 45 40 Q39 28 44 19 Z"/><circle class="bat-eye" cx="47" cy="23" r="1.3"/><circle class="bat-eye" cx="53" cy="23" r="1.3"/></svg>';
    background.appendChild(bat);
  }

  BACKGROUND_PUMPKINS.forEach(([x, y, size], index) => {
    const pumpkin = createPumpkin();
    pumpkin.classList.add("floating-pumpkin");
    pumpkin.style.cssText = `left:${x}%;top:${y}%;--size:clamp(30px, ${size / 12}vw, ${size}px);--phase:${-index * 1.3}s;--flight:${7 + (index % 4)}s;--glow-time:${4 + (index % 3)}s`;
    background.appendChild(pumpkin);
  });
}

function createRose(type, x, y, scale, index) {
  const baseX = 260 + ((index % 5) - 2) * 3;
  const baseY = 512;
  const length = Math.hypot(x - baseX, baseY - y);
  const angle = (Math.atan2(x - baseX, baseY - y) * 180) / Math.PI;
  const stem = document.createElement("div");
  const flower = document.createElement("div");
  const head = document.createElement("div");
  const particles = document.createElement("div");

  stem.className = "stem";
  stem.style.cssText = `left:${baseX}px;top:${baseY - length}px;height:${length}px;--angle:${angle}deg;--delay:${index * 0.13}s`;
  stem.innerHTML = '<i class="leaf"></i><i class="leaf leaf-other"></i>';

  flower.className = `halloween-rose halloween-rose--${type}`;
  flower.style.cssText = `left:${x}px;top:${y}px;--rose-scale:${scale};--rose-turn:${index % 2 ? -12 : 14}deg;--delay:${index * 0.13 + 0.38}s;--phase:${-index * 0.7}s`;

  head.className = "halloween-rose__head";
  particles.className = "halloween-rose__particles";

  for (let layer = 0; layer < 3; layer += 1) {
    for (let petal = 0; petal < 5; petal += 1) {
      const element = document.createElement("i");
      element.className = `halloween-rose__petal halloween-rose__petal--${layer}`;
      element.style.setProperty(
        "--petal-angle",
        `${petal * 72 + layer * 36}deg`,
      );
      head.appendChild(element);
    }
  }

  const center = document.createElement("b");
  center.className = "halloween-rose__center";
  head.appendChild(center);

  for (let particleIndex = 0; particleIndex < 10; particleIndex += 1) {
    const particle = document.createElement("i");
    particle.style.cssText = `--petal-angle:${particleIndex * 36 + index * 17}deg;--distance:${43 + particleIndex * 9}px;--phase:${-(index * 0.37 + particleIndex * 0.51)}s;--flight:${4.5 + particleIndex * 0.3}s;--size:${5 + (particleIndex % 4) * 2}px`;
    particles.appendChild(particle);
  }

  flower.append(head, particles);

  return { stem, flower };
}

function createFoliage() {
  const foliage = document.createElement("div");
  foliage.className = "bouquet-foliage";

  FOLIAGE_SPRIGS.forEach(([x, y, angle]) => {
    const sprig = document.createElement("div");
    sprig.className = "bouquet-sprig";
    sprig.style.cssText = `left:${x}px;top:${y}px;transform:rotate(${angle}deg)`;
    sprig.innerHTML = "<i></i><i></i><i></i><i></i><b></b>";
    foliage.appendChild(sprig);
  });

  return foliage;
}

function createBouquetMagic() {
  const magic = document.createElement("div");
  magic.className = "bouquet-magic";

  for (let index = 0; index < 16; index += 1) {
    const spark = document.createElement("i");
    spark.style.cssText = `left:${55 + ((index * 79) % 410)}px;top:${75 + ((index * 61) % 370)}px;--phase:${-index * 0.43}s;--flight:${3 + (index % 4)}s`;
    magic.appendChild(spark);
  }

  return magic;
}

function createFlowers() {
  const art = document.querySelector(".bouquet-art");
  const motion = art.querySelector(".bouquet-motion");
  const stems = art.querySelector(".bouquet-stems");
  const blooms = art.querySelector(".bouquet-flowers");

  FLOWERS.forEach(([type, x, y, scale], index) => {
    const { stem, flower } = createRose(type, x, y, scale, index);
    stems.appendChild(stem);
    blooms.appendChild(flower);
  });

  const foliage = createFoliage();
  const wrap = document.createElement("div");

  wrap.className = "bouquet-wrap";
  wrap.innerHTML = '<i class="bouquet-wrap__fold"></i><span>✦</span>';

  motion.insertBefore(foliage, blooms);
  motion.insertBefore(wrap, blooms);
  motion.appendChild(createBouquetMagic());

  [
    [35, 474, 103],
    [397, 492, 85],
  ].forEach(([x, y, size], index) => {
    const pumpkin = createPumpkin();
    pumpkin.classList.add("bouquet-pumpkin");
    pumpkin.style.cssText = `left:${x}px;top:${y}px;--size:${size}px;--phase:${-index * 3}s`;
    motion.appendChild(pumpkin);
  });

  const host = document.querySelector(".bouquet");
  new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    art.style.setProperty(
      "--art-scale",
      Math.max(0, Math.min(width / 520, height / 590)),
    );
  }).observe(host);
}

// Main functions

function showScene(scene) {
  Object.values(scenes).forEach((item) => {
    item.classList.remove("is-active", "is-exiting");
  });
  scene.classList.add("is-active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function buildBouquet() {
  const bouquet = document.querySelector(".bouquet");

  if (bouquet) {
    bouquet.classList.add("is-building");
  }
}

function showLetter() {
  showScene(scenes.letter);

  if (letterStarted) {
    return;
  }

  letterStarted = true;

  const scrollArea = document.querySelector(".letter-content");
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const wait = (time) =>
    new Promise((resolve) => window.setTimeout(resolve, time));

  async function writeParagraph(text) {
    const paragraph = document.createElement("p");
    paragraph.className = "is-typing";
    letterBody.appendChild(paragraph);

    for (const character of text) {
      paragraph.textContent += character;
      scrollArea.scrollTop = scrollArea.scrollHeight;

      if (!reducedMotion) {
        await wait(character === "." || character === "," ? 85 : 18);
      }
    }

    paragraph.classList.remove("is-typing");
  }

  (async () => {
    for (const paragraph of LETTER_PARAGRAPHS) {
      await writeParagraph(paragraph);

      if (!reducedMotion) {
        await wait(380);
      }
    }

    letterSignature.hidden = false;
    finishLetterButton.hidden = false;
    scrollArea.scrollTo({
      top: scrollArea.scrollHeight,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  })();
}

function updateCounter() {
  const start = new Date(2026, 5, 5, 0, 0, 0).getTime();
  const elapsed = Math.max(0, Date.now() - start);
  const pad = (value) => String(value).padStart(2, "0");

  document.getElementById("days").textContent = Math.floor(elapsed / 86400000);
  document.getElementById("hours").textContent = pad(
    Math.floor((elapsed % 86400000) / 3600000),
  );
  document.getElementById("minutes").textContent = pad(
    Math.floor((elapsed % 3600000) / 60000),
  );
  document.getElementById("seconds").textContent = pad(
    Math.floor((elapsed % 60000) / 1000),
  );
}

// Event handlers

function handleStartClick() {
  backgroundMusic.play();
  showScene(scenes.wish);
}

function handleFireflyClick(firefly, index) {
  if (firefly.classList.contains("is-lit")) {
    return;
  }

  if (activePumpkinLaugh) {
    activePumpkinLaugh.pause();
  }
  stopAmbientSound();
  scheduleAmbientSound(12000 + Math.random() * 12000);
  const pumpkinLaugh = pumpkinLaughs[index];
  activePumpkinLaugh = pumpkinLaugh;
  pumpkinLaugh.currentTime = 0;
  updateBackgroundMusicVolume();
  pumpkinLaugh.play().catch(() => {
    if (activePumpkinLaugh === pumpkinLaugh) {
      activePumpkinLaugh = null;
      updateBackgroundMusicVolume();
    }
  });
  firefly.classList.add("is-lit");
  firefly.disabled = true;
  litCount += 1;

  const remaining = fireflies.length - litCount;
  updateRitualStatus(remaining);

  if (!remaining) {
    scenes.wish.classList.add("is-completed");

    window.setTimeout(() => {
      scenes.wish.classList.add("is-exiting");

      window.setTimeout(() => {
        scenes.wish.classList.remove("is-completed", "is-exiting");
        showScene(scenes.bouquet);
        window.setTimeout(buildBouquet, 150);
      }, 750);
    }, 2100);
  }
}

function handleOpenLetterClick() {
  playMagicChimes();
  showLetter();
}

function handleFinishLetterClick() {
  showScene(scenes.final);
}

function handleReplayClick() {
  window.location.reload();
}

// Event listeners

startButton.addEventListener("click", handleStartClick);
document.addEventListener("click", retryAmbientAfterInteraction);
document.addEventListener("keydown", retryAmbientAfterInteraction);

pumpkinLaughs.forEach((pumpkinLaugh) => {
  pumpkinLaugh.addEventListener("ended", () => {
    if (activePumpkinLaugh === pumpkinLaugh) {
      activePumpkinLaugh = null;
      updateBackgroundMusicVolume();
    }
  });
});

[...ambientSounds, magicChimes].forEach((sound) => {
  sound.addEventListener("ended", () => {
    if (activeAmbientSound === sound) {
      activeAmbientSound = null;
      updateBackgroundMusicVolume();
      scheduleAmbientSound();
    }
  });
});

fireflies.forEach((firefly, index) =>
  firefly.addEventListener("click", () => handleFireflyClick(firefly, index)),
);

openLetterButton.addEventListener("click", handleOpenLetterClick);
finishLetterButton.addEventListener("click", handleFinishLetterClick);
replayButton.addEventListener("click", handleReplayClick);

// Initialization

createFlowers();
createHalloweenBackground();
buildStars();
updateCounter();
scheduleAmbientSound(3000 + Math.random() * 6000);
window.setInterval(updateCounter, 1000);
