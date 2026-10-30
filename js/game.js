(function () {
  'use strict';

  const DENOMINATIONS = [1, 5, 10, 25, 100];
  const DEFAULT_BET = 5;
  const SPIN_CYCLES = 4;
  const SPIN_DURATION_MS = 2800;
  const REEL_STAGGER_MS = 180;
  const CYCLE_OFFSET = 2;
  const STARTING_GC = 10000;
  const STARTING_SC = 5;
  const FREE_SC_REWARD = 2;

  const STORAGE = {
    gc: 'swampslots_gc',
    sc: 'swampslots_sc',
    wallet: 'swampslots_wallet',
  };

  const PACKS = [
    { id: 'starter', name: 'Bayou Starter', gc: 5000, sc: 1, priceLabel: '$1.99', popular: false },
    { id: 'popular', name: 'Swamp Bundle', gc: 25000, sc: 5, priceLabel: '$4.99', popular: true },
    { id: 'value', name: 'Alligator Haul', gc: 80000, sc: 15, priceLabel: '$9.99', popular: false },
    { id: 'whale', name: 'Catfish Jackpot Pack', gc: 250000, sc: 40, priceLabel: '$19.99', popular: false },
  ];

  const SYMBOLS = [
    { id: 'crayfish', img: 'slot-assets/crayfish.png', label: 'Crayfish' },
    { id: 'alligator', img: 'slot-assets/alligator.png', label: 'Alligator' },
    { id: 'catfish', img: 'slot-assets/catfish.png', label: 'Catfish' },
    { id: 'worm', img: 'slot-assets/worm.png', label: 'Worm' },
    { id: 'hook', img: 'slot-assets/hook.png', label: 'Hook' },
  ];

  const SYMBOL_MAP = Object.fromEntries(SYMBOLS.map((s) => [s.id, s]));
  const MULTIPLIERS = { catfish: 50, crayfish: 10, alligator: 8, worm: 4, hook: 3 };

  let goldCoins = readBalance(STORAGE.gc, STARTING_GC);
  let sweepsCoins = readBalance(STORAGE.sc, STARTING_SC);
  let activeWallet = localStorage.getItem(STORAGE.wallet) === 'sc' ? 'sc' : 'gc';
  let currentBet = DEFAULT_BET;
  let spinning = false;
  let soundEnabled = true;
  let soundsReady = false;
  const sounds = {};

  window.adsbygoogle = window.adsbygoogle || [];
  let adBreak = function (o) { adsbygoogle.push(o); };
  let adConfig = function (o) { adsbygoogle.push(o); };
  let adsReady = false;
  let adRequesting = false;

  const SOUND_FILES = {
    ambience: 'sounds/SWAMP_AMBIENCE.mp3',
    spin: 'sounds/SLOT_SPIN_SOUND.mp3',
    jackpot: 'sounds/swamp_jackpot.mp3',
    lose: 'sounds/slots_lose.mp3',
    winner: 'sounds/winner.mp3',
  };

  function readBalance(key, fallback) {
    const n = parseInt(localStorage.getItem(key), 10);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  }

  function el(id) { return document.getElementById(id); }

  function formatCoins(n) {
    return Math.floor(n).toLocaleString('en-US');
  }

  function saveBalances() {
    localStorage.setItem(STORAGE.gc, String(goldCoins));
    localStorage.setItem(STORAGE.sc, String(sweepsCoins));
    localStorage.setItem(STORAGE.wallet, activeWallet);
  }

  function getBalance() {
    return activeWallet === 'sc' ? sweepsCoins : goldCoins;
  }

  function setBalance(value) {
    if (activeWallet === 'sc') sweepsCoins = value;
    else goldCoins = value;
  }

  function walletLabel() {
    return activeWallet === 'sc' ? 'Sweeps Coins' : 'Gold Coins';
  }

  function walletShort() {
    return activeWallet === 'sc' ? 'SC' : 'GC';
  }

  function ensureSounds() {
    if (soundsReady) return;
    soundsReady = true;
    for (const [key, src] of Object.entries(SOUND_FILES)) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = src;
      audio.volume = key === 'ambience' ? 0.22 : 0.55;
      if (key === 'ambience') audio.loop = true;
      sounds[key] = audio;
    }
  }

  function playSound(name) {
    if (!soundEnabled) return;
    ensureSounds();
    const s = sounds[name];
    if (!s) return;
    if (name !== 'ambience') s.currentTime = 0;
    s.play().catch(() => {});
  }

  function stopSound(name) {
    if (!sounds[name]) return;
    sounds[name].pause();
    if (name !== 'ambience') sounds[name].currentTime = 0;
  }

  function startAmbience() {
    if (!soundEnabled) return;
    ensureSounds();
    if (sounds.ambience) sounds.ambience.play().catch(() => {});
  }

  function preloadSymbols() {
    SYMBOLS.forEach((sym) => {
      const img = new Image();
      img.src = sym.img;
    });
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function createSymbolEl(sym) {
    const span = document.createElement('span');
    span.className = 'slots-symbol';
    const img = document.createElement('img');
    img.src = sym.img;
    img.alt = sym.id;
    img.className = 'slots-symbol-img';
    img.decoding = 'async';
    img.draggable = false;
    span.appendChild(img);
    return span;
  }

  function buildReelStrip(reelEl, symbolOrder) {
    reelEl.innerHTML = '';
    const order = symbolOrder || shuffle(SYMBOLS.map((s) => s.id));
    reelEl.dataset.symbolOrder = JSON.stringify(order);
    const strip = document.createElement('div');
    strip.className = 'slots-reel-strip';
    for (let cycle = 0; cycle < SPIN_CYCLES + 2; cycle++) {
      for (let i = 0; i < order.length; i++) {
        strip.appendChild(createSymbolEl(SYMBOL_MAP[order[i]] || SYMBOLS[i]));
      }
    }
    reelEl.appendChild(strip);
    return strip;
  }

  function getSymbolIndexInReel(reelEl, symbolId) {
    try {
      const order = JSON.parse(reelEl.dataset.symbolOrder || '[]');
      return order.indexOf(symbolId);
    } catch (_) {
      return SYMBOLS.findIndex((s) => s.id === symbolId);
    }
  }

  function symbolHeightPx(reelEl) {
    return reelEl.getBoundingClientRect().height || 92;
  }

  function animateReelToSymbol(reelEl, symbolId, delayMs) {
    const strip = reelEl.querySelector('.slots-reel-strip');
    if (!strip) return;
    const idx = getSymbolIndexInReel(reelEl, symbolId);
    const len = SYMBOLS.length;
    if (idx < 0) return;

    const h = symbolHeightPx(reelEl);
    const endOffset = h * (idx + CYCLE_OFFSET * len);
    const startOffset = h * (idx + (CYCLE_OFFSET + SPIN_CYCLES) * len);

    strip.style.transition = 'none';
    strip.style.transform = `translateY(-${startOffset}px)`;
    strip.offsetHeight;

    setTimeout(() => {
      strip.style.transition = `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.1, 0.8, 0.2, 1)`;
      strip.style.transform = `translateY(-${endOffset}px)`;
    }, delayMs);
  }

  function renderReel(reelEl, symbolId) {
    let strip = reelEl.querySelector('.slots-reel-strip');
    if (!strip) strip = buildReelStrip(reelEl);
    strip.style.transition = 'none';
    if (symbolId) {
      const idx = getSymbolIndexInReel(reelEl, symbolId);
      const len = SYMBOLS.length;
      if (idx >= 0) {
        const offset = symbolHeightPx(reelEl) * (idx + CYCLE_OFFSET * len);
        strip.style.transform = `translateY(-${offset}px)`;
      }
    }
  }

  function burstCoins(count) {
    const host = el('coin-burst');
    if (!host) return;
    host.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = 60 + Math.random() * 90;
      span.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      span.style.setProperty('--dy', `${Math.sin(angle) * dist - 30}px`);
      span.style.animationDelay = `${Math.random() * 0.12}s`;
      host.appendChild(span);
    }
    setTimeout(() => { host.innerHTML = ''; }, 1000);
  }

  function updateUI() {
    el('gc-amount').textContent = formatCoins(goldCoins);
    el('sc-amount').textContent = formatCoins(sweepsCoins);

    el('wallet-gc').classList.toggle('active-gc', activeWallet === 'gc');
    el('wallet-sc').classList.toggle('active-sc', activeWallet === 'sc');

    el('wallet-hint').textContent = `Playing with ${walletLabel()}`;

    const spinBtn = el('spin-btn');
    const bal = getBalance();
    spinBtn.disabled = spinning || bal < currentBet;
    spinBtn.textContent = `Spin ${currentBet} ${walletShort()}`;

    const freeBtn = el('free-sc-btn');
    freeBtn.disabled = !adsReady || adRequesting || spinning;

    document.querySelectorAll('.slots-denom-btn').forEach((btn) => {
      const val = parseInt(btn.dataset.bet, 10);
      btn.classList.toggle('active', val === currentBet);
    });
  }

  function resolveReels() {
    const ids = SYMBOLS.map((s) => s.id);
    return [
      ids[Math.floor(Math.random() * ids.length)],
      ids[Math.floor(Math.random() * ids.length)],
      ids[Math.floor(Math.random() * ids.length)],
    ];
  }

  function calculatePayout(reels, bet) {
    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      return bet * (MULTIPLIERS[reels[0]] || 0);
    }
    const wormCount = reels.filter((r) => r === 'worm').length;
    if (wormCount >= 2) return bet;
    return 0;
  }

  function spin() {
    if (spinning || getBalance() < currentBet) return;
    spinning = true;

    setBalance(getBalance() - currentBet);
    saveBalances();
    updateUI();
    playSound('spin');

    const reelEls = [el('reel-0'), el('reel-1'), el('reel-2')];
    reelEls.forEach((reelEl) => {
      buildReelStrip(reelEl);
      const strip = reelEl.querySelector('.slots-reel-strip');
      if (strip) {
        strip.style.transition = 'transform 80ms linear';
        strip.style.transform = `translateY(-${symbolHeightPx(reelEl) * SYMBOLS.length * 3}px)`;
      }
    });

    const resultEl = el('slots-result');
    resultEl.textContent = 'Spinning...';
    resultEl.classList.remove('slots-result-win', 'jackpot');

    const finalReels = resolveReels();
    const payout = calculatePayout(finalReels, currentBet);
    const isJackpot = finalReels.every((r) => r === 'catfish');

    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        animateReelToSymbol(reelEls[i], finalReels[i], i * REEL_STAGGER_MS);
      }
    }, 100);

    const totalDuration = 2 * REEL_STAGGER_MS + SPIN_DURATION_MS + 100;
    setTimeout(() => {
      spinning = false;
      stopSound('spin');

      for (let i = 0; i < 3; i++) {
        renderReel(reelEls[i], finalReels[i]);
      }

      const machine = el('slots-machine');

      if (payout > 0) {
        setBalance(getBalance() + payout);
        saveBalances();
        burstCoins(isJackpot ? 18 : 10);

        if (isJackpot) {
          resultEl.textContent = `JACKPOT! +${formatCoins(payout)} ${walletShort()}!`;
          resultEl.classList.add('slots-result-win', 'jackpot');
          machine.classList.remove('shake');
          void machine.offsetWidth;
          machine.classList.add('shake');
          playSound('jackpot');
        } else {
          resultEl.textContent = `You won ${formatCoins(payout)} ${walletShort()}!`;
          resultEl.classList.add('slots-result-win');
          resultEl.classList.remove('jackpot');
          playSound('winner');
        }
      } else {
        resultEl.textContent = 'No win — try again!';
        resultEl.classList.remove('slots-result-win', 'jackpot');
        playSound('lose');
      }

      updateUI();
    }, totalDuration);
  }

  function setWallet(wallet) {
    if (spinning || (wallet !== 'gc' && wallet !== 'sc')) return;
    activeWallet = wallet;
    saveBalances();
    updateUI();
  }

  function buyPack(packId) {
    const pack = PACKS.find((p) => p.id === packId);
    if (!pack || spinning) return;
    goldCoins += pack.gc;
    sweepsCoins += pack.sc;
    saveBalances();
    updateUI();
    burstCoins(14);
    playSound('winner');
    el('store-overlay').classList.add('hidden');
    el('slots-result').textContent = `Demo purchase: +${formatCoins(pack.gc)} GC & +${pack.sc} SC`;
    el('slots-result').classList.add('slots-result-win');
  }

  function initAds() {
    adConfig({
      preloadAdBreaks: 'on',
      onReady: function () {
        adsReady = true;
        updateUI();
      },
    });
  }

  function showRewardedAd() {
    if (adRequesting || spinning) return;
    adRequesting = true;
    updateUI();

    adBreak({
      type: 'reward',
      name: 'free-sweeps',
      beforeReward: function (showAdFn) { showAdFn(); },
      adViewed: function () {
        sweepsCoins += FREE_SC_REWARD;
        saveBalances();
        el('slots-result').textContent = `+${FREE_SC_REWARD} Sweeps Coins!`;
        el('slots-result').classList.add('slots-result-win');
        burstCoins(8);
      },
      adDismissed: function () {},
      adBreakDone: function () {
        adRequesting = false;
        updateUI();
      },
    });
  }

  function initDenomButtons() {
    const container = el('denom-buttons');
    DENOMINATIONS.forEach((d) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slots-denom-btn' + (d === currentBet ? ' active' : '');
      btn.textContent = String(d);
      btn.dataset.bet = String(d);
      btn.title = `Bet ${d} ${walletShort()}`;
      btn.addEventListener('click', () => {
        if (spinning) return;
        currentBet = d;
        updateUI();
      });
      container.appendChild(btn);
    });
  }

  function initStore() {
    const list = el('pack-list');
    PACKS.forEach((pack) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pack-card' + (pack.popular ? ' popular' : '');
      btn.innerHTML =
        (pack.popular ? '<span class="pack-badge">Popular</span>' : '') +
        `<span class="pack-name">${pack.name}</span>` +
        `<span class="pack-price">${pack.priceLabel}</span>` +
        `<span class="pack-detail">${formatCoins(pack.gc)} Gold + ${pack.sc} Sweeps bonus</span>`;
      btn.addEventListener('click', () => buyPack(pack.id));
      list.appendChild(btn);
    });
  }

  function initReels() {
    for (let i = 0; i < 3; i++) {
      const reelEl = el('reel-' + i);
      buildReelStrip(reelEl);
      const randomSym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id;
      renderReel(reelEl, randomSym);
    }
  }

  function openModal(id) { el(id).classList.remove('hidden'); }
  function closeModal(id) { el(id).classList.add('hidden'); }

  function init() {
    // One-time migration away from old single-chip key
    if (localStorage.getItem(STORAGE.gc) === null && localStorage.getItem('swampslots_chips')) {
      localStorage.removeItem('swampslots_chips');
    }

    preloadSymbols();
    initDenomButtons();
    initStore();
    initReels();
    updateUI();

    el('spin-btn').addEventListener('click', spin);
    el('wallet-gc').addEventListener('click', () => setWallet('gc'));
    el('wallet-sc').addEventListener('click', () => setWallet('sc'));

    el('store-btn').addEventListener('click', () => openModal('store-overlay'));
    el('store-close').addEventListener('click', () => closeModal('store-overlay'));
    el('store-overlay').addEventListener('click', (e) => {
      if (e.target === el('store-overlay')) closeModal('store-overlay');
    });

    el('info-btn').addEventListener('click', () => openModal('payout-overlay'));
    el('payout-close').addEventListener('click', () => closeModal('payout-overlay'));
    el('payout-overlay').addEventListener('click', (e) => {
      if (e.target === el('payout-overlay')) closeModal('payout-overlay');
    });

    el('free-sc-btn').addEventListener('click', () => {
      if (!adsReady || adRequesting) return;
      showRewardedAd();
    });

    el('sound-toggle').addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      el('sound-toggle').textContent = soundEnabled ? '🔊' : '🔇';
      el('sound-toggle').setAttribute('aria-label', soundEnabled ? 'Mute sound' : 'Unmute sound');
      if (soundEnabled) startAmbience();
      else {
        stopSound('ambience');
        Object.keys(sounds).forEach((name) => {
          if (name !== 'ambience') stopSound(name);
        });
      }
    });

    document.addEventListener('click', function firstClick() {
      startAmbience();
      document.removeEventListener('click', firstClick);
    }, { once: true });

    initAds();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
