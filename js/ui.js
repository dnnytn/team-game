/**
 * UI Controller - Lobby, battle viewport, victory screen, facilitator controls.
 */
(function () {
  // DOM elements
  var lobbyScreen = document.getElementById('lobby');
  var battleScreen = document.getElementById('battle');
  var victoryScreen = document.getElementById('victory');
  var shipCardsContainer = document.getElementById('ship-cards');
  var shipCountEl = document.getElementById('ship-count');
  var btnStart = document.getElementById('btn-start');
  var btnReplay = document.getElementById('btn-replay');
  var hudShips = document.getElementById('hud-ships');
  var speedSlider = document.getElementById('speed-slider');
  var speedLabel = document.getElementById('speed-label');
  var standingsEl = document.getElementById('standings');
  var arenaCanvas = document.getElementById('arena');

  var speedMap = { 1: 0.5, 2: 1, 3: 2, 4: 4 };
  var speedLabelMap = { 1: '0.5x', 2: '1x', 3: '2x', 4: '4x' };

  function showScreen(name) {
    lobbyScreen.classList.remove('active');
    battleScreen.classList.remove('active');
    victoryScreen.classList.remove('active');
    document.getElementById(name).classList.add('active');
  }

  // === Ship Loading ===

  function loadShips() {
    if (typeof SHIP_MANIFEST === 'undefined' || !SHIP_MANIFEST.length) {
      shipCountEl.textContent = '0 (no ships in registry)';
      return;
    }

    var loaded = 0;
    var total = SHIP_MANIFEST.length;

    SHIP_MANIFEST.forEach(function (filename) {
      var script = document.createElement('script');
      script.src = 'ships/' + filename;
      script.onload = function () {
        loaded++;
        updateLobby();
      };
      script.onerror = function () {
        console.error('Failed to load ship: ' + filename);
        loaded++;
        updateLobby();
      };
      document.body.appendChild(script);
    });
  }

  function updateLobby() {
    var ships = ShipRegistry.getAll();
    shipCountEl.textContent = ships.length;

    // Clear existing cards
    shipCardsContainer.innerHTML = '';

    ships.forEach(function (config) {
      var card = createShipCard(config);
      shipCardsContainer.appendChild(card);
    });

    // Enable start button if 2+ ships
    btnStart.disabled = ships.length < 2;
    if (ships.length < 2) {
      btnStart.textContent = 'NEED 2+ SHIPS';
    } else {
      btnStart.textContent = 'START BATTLE';
    }
  }

  function createShipCard(config) {
    var card = document.createElement('div');
    card.className = 'ship-card';

    // Ship name
    var nameEl = document.createElement('div');
    nameEl.className = 'ship-name';
    nameEl.textContent = config.name;
    card.appendChild(nameEl);

    // Team
    var teamEl = document.createElement('div');
    teamEl.className = 'ship-team';
    teamEl.textContent = config.team;
    card.appendChild(teamEl);

    // Sprite preview
    var spriteCanvas = document.createElement('canvas');
    Renderer.renderSprite(config, spriteCanvas, 5);
    card.appendChild(spriteCanvas);

    // Stat bars
    var statsDiv = document.createElement('div');
    statsDiv.className = 'stat-bars';

    var stats = [
      { label: 'SHIELDS', key: 'shields', cls: 'shields' },
      { label: 'SPEED', key: 'speed', cls: 'speed' },
      { label: 'WEAPON', key: 'weaponPower', cls: 'weapon' },
      { label: 'ABILITY', key: 'ability', cls: 'ability' }
    ];

    stats.forEach(function (stat) {
      var row = document.createElement('div');
      row.className = 'stat-row';

      var label = document.createElement('span');
      label.className = 'stat-label';
      label.textContent = stat.label;
      row.appendChild(label);

      var barBg = document.createElement('div');
      barBg.className = 'stat-bar-bg';
      var barFill = document.createElement('div');
      barFill.className = 'stat-bar-fill ' + stat.cls;
      barFill.style.width = (config[stat.key] / 60 * 100) + '%';
      barBg.appendChild(barFill);
      row.appendChild(barBg);

      var value = document.createElement('span');
      value.className = 'stat-value';
      value.textContent = config[stat.key];
      row.appendChild(value);

      statsDiv.appendChild(row);
    });
    card.appendChild(statsDiv);

    // Ability
    var abilityDef = Abilities.definitions[config.specialAbility];
    var abilityEl = document.createElement('div');
    abilityEl.className = 'ship-ability';
    abilityEl.textContent = abilityDef ? abilityDef.name : config.specialAbility;
    card.appendChild(abilityEl);

    return card;
  }

  // === Battle ===

  var animFrameId = null;

  function startBattle() {
    var ships = ShipRegistry.getAll();
    if (ships.length < 2) return;

    // Init audio on user gesture
    GameAudio.init();

    // Init renderer
    Renderer.init(arenaCanvas);
    Renderer.cacheShipSprites(ships);

    // Init engine
    BattleEngine.init(ships, arenaCanvas.width, arenaCanvas.height);

    // Build HUD
    buildHUD(ships);

    // Show battle screen
    showScreen('battle');

    // Set speed
    var speed = speedMap[speedSlider.value] || 1;
    BattleEngine.setSpeed(speed);

    // Start BGM
    GameAudio.startBGM();

    // Start engine
    BattleEngine.start({
      onTick: function (state) {
        updateHUD(state);
        playTickSounds(state);

        // Increase BGM tempo when 2 ships remain
        var alive = state.ships.filter(function (s) { return s.alive; });
        if (alive.length <= 2) {
          GameAudio.setBGMTempo(130);
        }
      },
      onElimination: function (ship, state) {
        GameAudio.playExplosion();
      },
      onBattleEnd: function (state) {
        GameAudio.stopBGM();
        // Short delay before showing victory
        setTimeout(function () {
          cancelAnimationFrame(animFrameId);
          showVictory(state);
        }, 2000);
      }
    });

    // Start render loop
    function renderLoop() {
      var state = BattleEngine.getState();
      if (state) {
        Renderer.render(state, state.tick);
      }
      animFrameId = requestAnimationFrame(renderLoop);
    }
    renderLoop();
  }

  function playTickSounds(state) {
    // Play laser sounds for recent fires
    state.ships.forEach(function (ship) {
      if (ship.alive && ship.lastFireTick === state.tick) {
        GameAudio.playLaser(ship.config.weaponPower);
      }
    });

    // Play ability sounds
    state.abilityEffects.forEach(function (effect) {
      GameAudio.playAbility(effect.type);
    });
  }

  function buildHUD(shipConfigs) {
    hudShips.innerHTML = '';
    shipConfigs.forEach(function (config) {
      var div = document.createElement('div');
      div.className = 'hud-ship';
      div.id = 'hud-' + config.team;
      div.innerHTML =
        '<span class="hud-ship-name" style="color:' + config.color + '">' + config.name + '</span>' +
        '<div class="hud-health-bar"><div class="hud-health-fill" style="background:' + config.color + '"></div></div>';
      hudShips.appendChild(div);
    });
  }

  function updateHUD(state) {
    state.ships.forEach(function (ship) {
      var el = document.getElementById('hud-' + ship.config.team);
      if (!el) return;
      var fill = el.querySelector('.hud-health-fill');
      if (ship.alive) {
        var pct = (ship.currentShields / ship.maxShields * 100);
        fill.style.width = pct + '%';
        // Color shift at low health
        if (pct < 25) {
          fill.style.background = '#ff4444';
        } else if (pct < 50) {
          fill.style.background = '#ffaa00';
        } else {
          fill.style.background = ship.config.color;
        }
      } else {
        fill.style.width = '0%';
        el.classList.add('eliminated');
      }
    });
  }

  // === Victory ===

  function showVictory(state) {
    GameAudio.playVictoryFanfare();
    showScreen('victory');

    standingsEl.innerHTML = '';

    // Build standings: winner first, then eliminations in reverse order
    var standings = [];
    // Last entry in eliminations is the winner
    for (var i = state.eliminations.length - 1; i >= 0; i--) {
      standings.push(state.eliminations[i]);
    }

    standings.forEach(function (entry, idx) {
      var row = document.createElement('div');
      row.className = 'standing-row';
      if (idx === 0) row.classList.add('first');
      if (idx === 1) row.classList.add('second');
      if (idx === 2) row.classList.add('third');

      var rankLabels = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
      var rankText = rankLabels[idx] || (idx + 1) + 'th';

      var config = ShipRegistry.getByTeam(entry.team);
      var abilityName = '';
      if (config) {
        var abilityDef = Abilities.definitions[config.specialAbility];
        abilityName = abilityDef ? abilityDef.name : config.specialAbility;
      }

      row.innerHTML =
        '<span class="standing-rank">' + rankText + '</span>' +
        '<span class="standing-name">' + entry.name + '</span>' +
        '<span class="standing-ability">' + abilityName + '</span>';

      standingsEl.appendChild(row);
    });
  }

  // === Event Listeners ===

  btnStart.addEventListener('click', function () {
    var rpgToggle = document.getElementById('rpg-mode');
    if (rpgToggle && rpgToggle.checked) {
      RPGBattleUI.init(arenaCanvas);
      RPGBattleUI.start();
    } else {
      startBattle();
    }
  });

  btnReplay.addEventListener('click', function () {
    // Reset everything
    cancelAnimationFrame(animFrameId);
    RPGBattleUI.cleanup();
    BattleEngine.stop();
    GameAudio.stopBGM();
    showScreen('lobby');
    updateLobby();
  });

  speedSlider.addEventListener('input', function () {
    var speed = speedMap[this.value] || 1;
    speedLabel.textContent = speedLabelMap[this.value] || '1x';
    BattleEngine.setSpeed(speed);
  });

  // === Init ===

  // Initialize renderer for sprite preview in lobby
  Renderer.init(arenaCanvas);

  // Load ships from manifest
  loadShips();

})();
