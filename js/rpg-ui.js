/**
 * RPGBattleUI - Wires RPG battle mode to lobby and victory screens
 */
var RPGBattleUI = (function () {
  var arenaCanvas = null;

  function init(canvas) {
    arenaCanvas = canvas;
  }

  function start() {
    var ships = ShipRegistry.getAll();
    if (ships.length < 2) return;

    // Init audio on user gesture
    GameAudio.init();

    // Init renderer
    Renderer.init(arenaCanvas);
    Renderer.cacheShipSprites(ships);

    // Init RPG engine
    RPGEngine.init(ships, arenaCanvas.width, arenaCanvas.height);

    // Show battle screen
    document.getElementById('lobby').classList.remove('active');
    document.getElementById('battle').classList.add('active');
    document.getElementById('victory').classList.remove('active');

    // Start BGM
    GameAudio.startBGM();

    // Start RPG renderer loop
    RPGRenderer.init(arenaCanvas);
    RPGRenderer.startLoop(function () {
      return RPGEngine.getState();
    });

    // Start RPG battle
    RPGEngine.start(function (state) {
      onBattleEnd(state);
    });
  }

  function onBattleEnd(state) {
    GameAudio.stopBGM();

    // Stop renderer
    RPGRenderer.stopLoop();

    // Wait a moment then show victory
    setTimeout(function () {
      showRPGVictory(state);
    }, 1500);
  }

  function showRPGVictory(state) {
    var victoryDiv = document.getElementById('victory');
    var standingsDiv = document.getElementById('standings');

    if (!victoryDiv || !standingsDiv) return;

    standingsDiv.innerHTML = '';

    // Winner (if exists)
    var winners = state.eliminations.filter(function (e) { return e.winner; });
    if (winners.length > 0) {
      var winner = winners[0];
      var row = document.createElement('div');
      row.className = 'standing-row';
      row.innerHTML =
        '<span class="standing-rank">1ST</span>' +
        '<span class="standing-name">' + winner.name + '</span>' +
        '<span class="standing-team">(' + winner.team + ')</span>';
      standingsDiv.appendChild(row);
    }

    // Losers in reverse order
    var losers = state.eliminations.filter(function (e) { return !e.winner; });
    losers.reverse();
    losers.forEach(function (loser, i) {
      var rank = i + 2;
      var rankStr = rank === 2 ? '2ND' : rank === 3 ? '3RD' : rank + 'TH';
      var row = document.createElement('div');
      row.className = 'standing-row';
      row.innerHTML =
        '<span class="standing-rank">' + rankStr + '</span>' +
        '<span class="standing-name">' + loser.name + '</span>' +
        '<span class="standing-team">(' + loser.team + ')</span>';
      standingsDiv.appendChild(row);
    });

    GameAudio.playVictoryFanfare();

    // Show victory screen
    document.getElementById('lobby').classList.remove('active');
    document.getElementById('battle').classList.remove('active');
    document.getElementById('victory').classList.add('active');
  }

  function cleanup() {
    if (RPGRenderer && RPGRenderer.stopLoop) {
      RPGRenderer.stopLoop();
    }
    if (GameAudio && GameAudio.stopBGM) {
      GameAudio.stopBGM();
    }
  }

  return {
    init: init,
    start: start,
    cleanup: cleanup
  };
})();
