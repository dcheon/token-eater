(function () {
  const pet = document.getElementById('pet');
  const statusEl = document.getElementById('status');
  const tokensEl = document.getElementById('tokens');
  const levelEl = document.getElementById('level');
  const stageNameEl = document.getElementById('stageName');
  const xpFillEl = document.getElementById('xpFill');
  const xpTextEl = document.getElementById('xpText');
  const burstEl = document.getElementById('burst');

  const STATUS = {
    idle: '😴 자는 중...',
    typing: '🐾 타이핑 감지!',
    digesting: '😌 사료 소화중...',
  };

  // While Claude works, the pet randomly cycles through these behaviors.
  const WORK_BEHAVIORS = ['run', 'zoom', 'eat', 'play', 'jump', 'spin'];
  const WORK_STATUS = {
    run: '🏃 다다다 뛰는 중!',
    zoom: '💨 우다다다 질주!',
    eat: '🍖 냠냠 사료 먹는 중!',
    play: '🎾 공 쫓는 중!',
    jump: '⬆️ 폴짝폴짝!',
    spin: '🌀 빙글빙글 도는 중!',
  };

  let isFat = false;
  let stageId = 'slime';
  let spriteId = 'slime';
  let workTimer = null;
  let currentWork = null;

  // applyClass rewrites className wholesale, so the celebration has to be a
  // tracked flag or the next state update (< 1s away) would cut it short.
  let popping = false;
  let popTimer = null;

  function applyClass(behaviorClass) {
    pet.className =
      'pet ' +
      behaviorClass +
      ' pet--stage-' +
      stageId +
      ' pet--sprite-' +
      spriteId +
      (isFat ? ' pet--fat' : '') +
      (popping ? ' pet--pop' : '');
  }

  function pickWork() {
    let b;
    do {
      b = WORK_BEHAVIORS[Math.floor(Math.random() * WORK_BEHAVIORS.length)];
    } while (b === currentWork && WORK_BEHAVIORS.length > 1);
    currentWork = b;
    applyClass('pet--working pet--w-' + b);
    statusEl.textContent = WORK_STATUS[b];
  }

  function scheduleNextWork() {
    // Hold each behavior for a random 1.6–3.2s so it feels lively, not robotic.
    const delay = 1600 + Math.random() * 1600;
    workTimer = setTimeout(() => {
      pickWork();
      scheduleNextWork();
    }, delay);
  }

  function stopWorking() {
    if (workTimer) {
      clearTimeout(workTimer);
      workTimer = null;
    }
    currentWork = null;
  }

  function setState(state) {
    if (state === 'working') {
      if (!workTimer) {
        pickWork();
        scheduleNextWork();
      } else if (currentWork) {
        // already cycling — just refresh the modifier classes
        applyClass('pet--working pet--w-' + currentWork);
      }
      return;
    }

    stopWorking();
    applyClass('pet--' + state);
    statusEl.textContent = STATUS[state] || STATUS.idle;
  }

  // ---- level & evolution ----
  let lastLevel = null;

  /** The pet grows a little with every level, then settles at full size. */
  function petScale(level) {
    return (0.78 + Math.min(level, 20) * 0.011).toFixed(3);
  }

  function celebrate(kind) {
    burstEl.textContent = kind === 'evolve' ? '✨ 진화! ✨' : 'LEVEL UP!';
    // Restart the animation even if one is already mid-flight.
    burstEl.classList.remove('burst--show', 'burst--evolve');
    void burstEl.offsetWidth;
    burstEl.classList.add('burst--show');
    if (kind === 'evolve') {
      burstEl.classList.add('burst--evolve');
    }
    popping = false;
    pet.classList.remove('pet--pop');
    void pet.offsetWidth;
    popping = true;
    pet.classList.add('pet--pop');
    if (popTimer) {
      clearTimeout(popTimer);
    }
    popTimer = setTimeout(() => {
      popping = false;
      pet.classList.remove('pet--pop');
    }, 700);
  }

  function setProgress(msg) {
    const level = msg.level || 0;
    const evolved = stageId !== msg.stage.id;

    stageId = msg.stage.id;
    spriteId = msg.stage.sprite;
    levelEl.textContent = 'Lv ' + level;
    stageNameEl.textContent = msg.stage.emoji + ' ' + msg.stage.name;
    xpFillEl.style.width = (msg.ratio * 100).toFixed(1) + '%';
    xpTextEl.textContent =
      fmt(msg.xpIntoLevel) +
      ' / ' +
      fmt(msg.xpForNext) +
      ' XP' +
      (msg.evolvesAt ? ' · Lv ' + msg.evolvesAt + ' 진화' : ' · 최종 단계');
    pet.style.setProperty('--pet-scale', petScale(level));

    // Don't fire the celebration for the very first message after a reload.
    if (lastLevel !== null && level > lastLevel) {
      celebrate(evolved ? 'evolve' : 'level');
    }
    lastLevel = level;
  }

  function fmt(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  // ---- animate the food counter smoothly toward the real value ----
  let displayed = 0;
  let target = 0;
  let raf = null;

  function animateTokens() {
    const diff = target - displayed;
    if (Math.abs(diff) < 1) {
      displayed = target;
      tokensEl.textContent = formatFood(displayed);
      raf = null;
      return;
    }
    displayed += diff * 0.2;
    tokensEl.textContent = formatFood(displayed);
    raf = requestAnimationFrame(animateTokens);
  }

  // Food is measured in grams (= tokens). Over 100,000 g, show kg with 2 decimals.
  function formatFood(n) {
    const g = Math.round(n);
    if (g >= 100000) {
      return (g / 1000).toFixed(2) + ' kg';
    }
    return g.toLocaleString('en-US') + ' g';
  }

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || msg.type !== 'update') {
      return;
    }

    isFat = !!msg.fat;
    if (msg.stage) {
      setProgress(msg);
    }
    // setState runs last so the class it writes carries the fresh stage/fat.
    setState(msg.state);

    if (typeof msg.food === 'number') {
      target = msg.food;
      if (!raf) {
        raf = requestAnimationFrame(animateTokens);
      }
    }
  });
})();
