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
    idle: 'Sleeping...',
    typing: 'Typing detected!',
    calling: 'Claude needs you!',
    digesting: 'Digesting food...',
  };

  // While Claude works, the pet randomly cycles through these behaviors.
  const WORK_BEHAVIORS = ['run', 'zoom', 'eat', 'play', 'jump', 'spin'];
  const WORK_STATUS = {
    run: 'Running around!',
    zoom: 'Zooming past!',
    eat: 'Munching on food!',
    play: 'Chasing the ball!',
    jump: 'Hopping around!',
    spin: 'Spinning in circles!',
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
  /** Level currently reflected on screen (as opposed to the server's real level). */
  let displayedLevel = null;
  /** Evolution ladder, sent by the extension — lets us look up the stage for
   *  any *intermediate* level while animating a multi-level jump. */
  let stagesTable = [];
  /** Queued level-up steps still waiting to play out. */
  let levelQueue = [];
  let queueRunning = false;

  // Must match the `.xpbar__fill { transition: width ... }` duration in style.css.
  const BAR_FILL_MS = 400;
  /** How long the fully-filled bar lingers before resetting to 0 for the next level. */
  const BAR_HOLD_MS = 300;

  /** The pet grows a little with every level, then settles at full size. */
  function petScale(level) {
    return (0.78 + Math.min(level, 20) * 0.011).toFixed(3);
  }

  function stageForLevelClient(level) {
    let found = stagesTable[0];
    for (const s of stagesTable) {
      if (level >= s.minLevel) {
        found = s;
      }
    }
    return found;
  }

  /** Set the xp bar fill. `animated: false` snaps instantly (resets, first paint). */
  function setBarRatio(ratio, animated) {
    const pct = (Math.max(0, Math.min(1, ratio)) * 100).toFixed(1) + '%';
    if (animated) {
      xpFillEl.style.width = pct;
      return;
    }
    xpFillEl.style.transition = 'none';
    xpFillEl.style.width = pct;
    void xpFillEl.offsetWidth; // flush, so the next animated change transitions from here
    xpFillEl.style.transition = '';
  }

  function applyStageAndLevel(level, stage) {
    const evolved = stageId !== stage.id;
    stageId = stage.id;
    spriteId = stage.sprite;
    displayedLevel = level;
    levelEl.textContent = 'Lv ' + level;
    stageNameEl.textContent = stage.name;
    pet.style.setProperty('--pet-scale', petScale(level));
    return evolved;
  }

  /**
   * Play the queued level-up steps one at a time, Pokémon-style: the bar
   * fills all the way to 100% *first* (still showing the old level), and
   * only once it's full does the level number flip over.
   */
  function runLevelQueue() {
    const step = levelQueue.shift();
    if (!step) {
      queueRunning = false;
      return;
    }
    queueRunning = true;

    if (step.kind === 'settle') {
      // Leftover progress after the last level-up — just glide there, no
      // celebration, since no level was actually crossed by this fill.
      setBarRatio(step.ratio, true);
      setTimeout(() => {
        setXpText(step.xpIntoLevel, step.xpForNext, step.ratio, step.evolvesAt);
        runLevelQueue();
      }, BAR_FILL_MS);
      return;
    }

    // kind === 'cycle': fill the *current* level's bar to 100% before
    // touching the label/stage at all.
    setBarRatio(1, true);
    setTimeout(() => {
      const evolved = applyStageAndLevel(step.level, step.stage);
      celebrate(evolved ? 'evolve' : 'level');
      setTimeout(() => {
        setBarRatio(0, false);
        // Two rAFs so the browser paints the width:0 reset before the next
        // transition starts (one rAF isn't reliably enough in all webviews).
        requestAnimationFrame(() => requestAnimationFrame(runLevelQueue));
      }, BAR_HOLD_MS);
    }, BAR_FILL_MS);
  }

  function celebrate(kind) {
    burstEl.textContent = kind === 'evolve' ? 'EVOLVED!' : 'LEVEL UP!';
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
    if (Array.isArray(msg.stages) && msg.stages.length) {
      stagesTable = msg.stages;
    }
    const level = msg.level || 0;

    // First paint after load/reload: nothing to animate from — snap in place.
    if (displayedLevel === null) {
      applyStageAndLevel(level, msg.stage);
      setBarRatio(msg.ratio, false);
      setXpText(msg.xpIntoLevel, msg.xpForNext, msg.ratio, msg.evolvesAt);
      return;
    }

    // Level dropped (level reset, or a compaction wiping progress): snap, don't
    // play it backwards. Also cancels any in-flight level-up animation.
    if (level < displayedLevel) {
      levelQueue = [];
      queueRunning = false;
      applyStageAndLevel(level, msg.stage);
      setBarRatio(msg.ratio, false);
      setXpText(msg.xpIntoLevel, msg.xpForNext, msg.ratio, msg.evolvesAt);
      return;
    }

    // Same level: just glide the bar to the new ratio (CSS transition handles
    // the smoothness). Skip while a level-up animation is mid-flight so it
    // doesn't get clobbered.
    if (level === displayedLevel) {
      if (!queueRunning && levelQueue.length === 0) {
        setBarRatio(msg.ratio, true);
        setXpText(msg.xpIntoLevel, msg.xpForNext, msg.ratio, msg.evolvesAt);
      }
      return;
    }

    // Leveled up — Pokémon-style: queue one full 0→100%-then-flip cycle per
    // level gained (so a 5-level jump plays as 5 separate level-ups), then a
    // trailing settle into the new level's actual leftover progress.
    for (let lv = displayedLevel + 1; lv <= level; lv++) {
      levelQueue.push({ kind: 'cycle', level: lv, stage: lv === level ? msg.stage : stageForLevelClient(lv) });
    }
    levelQueue.push({
      kind: 'settle',
      ratio: msg.ratio,
      xpIntoLevel: msg.xpIntoLevel,
      xpForNext: msg.xpForNext,
      evolvesAt: msg.evolvesAt,
    });
    if (!queueRunning) {
      runLevelQueue();
    }
  }

  function fmt(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  function setXpText(xpIntoLevel, xpForNext, ratio, evolvesAt) {
    const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
    xpTextEl.textContent =
      fmt(xpIntoLevel) +
      ' / ' +
      fmt(xpForNext) +
      ' XP (' +
      pct +
      '%)' +
      (evolvesAt ? ' · Evolves at Lv ' + evolvesAt : ' · Max stage');
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

  // Food is measured in tokens directly. Above 1,000 it's abbreviated
  // (12.3k / 1.58m) so the number stays readable in the sidebar's width.
  function formatFood(n) {
    return compactNumber(n) + ' token';
  }

  function compactNumber(n) {
    const v = Math.max(0, Math.round(n));
    if (v >= 1000000) {
      return (v / 1000000).toFixed(2) + 'm';
    }
    if (v >= 1000) {
      return (v / 1000).toFixed(1) + 'k';
    }
    return String(v);
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
