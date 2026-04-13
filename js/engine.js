/**
 * BattleEngine - Main game loop, physics, collision detection, damage, elimination.
 */
var BattleEngine = (function () {
  var state = null;
  var tickInterval = null;
  var onTick = null;
  var onElimination = null;
  var onBattleEnd = null;
  var speedMultiplier = 1;

  function init(shipConfigs, canvasWidth, canvasHeight) {
    state = {
      tick: 0,
      phase: 'ready',
      arenaWidth: canvasWidth,
      arenaHeight: canvasHeight,
      ships: [],
      projectiles: [],
      mines: [],
      particles: [],
      abilityEffects: [],
      eliminations: []
    };

    // Place ships in a circle around the arena center
    var cx = canvasWidth / 2;
    var cy = canvasHeight / 2;
    var radius = Math.min(canvasWidth, canvasHeight) * 0.35;

    shipConfigs.forEach(function (config, i) {
      var angle = (i / shipConfigs.length) * Math.PI * 2 - Math.PI / 2;
      var ship = {
        config: config,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        heading: angle + Math.PI, // Face center
        currentShields: config.shields * 3,
        maxShields: config.shields * 3,
        alive: true,
        abilityCooldown: 50, // Brief initial cooldown
        abilityActive: false,
        abilityTimer: 0,
        abilityTriggerDelay: 0,
        target: null,
        targetTimer: 0,
        fireCooldown: 10 + Math.random() * 20 | 0, // Stagger first shots
        lastFireTick: 0,
        jitterPhase: Math.random() * Math.PI * 2,
        // Status effects
        cloaked: false,
        overdriveActive: false,
        damageReduction: 0,
        weaponDisabled: 0,
        abilityDisabled: 0,
        invulnerable: 0
      };
      state.ships.push(ship);
    });

    return state;
  }

  function start(callbacks) {
    if (!state || state.phase === 'battle') return;
    state.phase = 'battle';
    onTick = callbacks.onTick || function () {};
    onElimination = callbacks.onElimination || function () {};
    onBattleEnd = callbacks.onBattleEnd || function () {};

    scheduleNextTick();
  }

  function scheduleNextTick() {
    var interval = 100 / speedMultiplier;
    tickInterval = setTimeout(function () {
      tick();
      if (state.phase === 'battle') {
        scheduleNextTick();
      }
    }, interval);
  }

  function setSpeed(multiplier) {
    speedMultiplier = multiplier;
  }

  function tick() {
    state.tick++;
    state.abilityEffects = [];

    // Update AI for each ship
    state.ships.forEach(function (ship) {
      if (!ship.alive) return;
      ShipAI.update(ship, state);

      // Update active ability
      var abilityDef = Abilities.definitions[ship.config.specialAbility];
      if (abilityDef && ship.abilityActive) {
        abilityDef.update(ship, state);
      }
    });

    // Update projectiles
    updateProjectiles();

    // Update mines
    updateMines();

    // Update particles
    updateParticles();

    // Check win condition
    var aliveShips = state.ships.filter(function (s) { return s.alive; });
    if (aliveShips.length <= 1) {
      state.phase = 'victory';
      if (aliveShips.length === 1) {
        // Winner is last alive — add them as final entry
        state.eliminations.push({
          team: aliveShips[0].config.team,
          name: aliveShips[0].config.name,
          tick: state.tick,
          winner: true
        });
      }
      clearTimeout(tickInterval);
      onBattleEnd(state);
      return;
    }

    onTick(state);
  }

  function updateProjectiles() {
    for (var i = state.projectiles.length - 1; i >= 0; i--) {
      var proj = state.projectiles[i];
      proj.x += proj.dx;
      proj.y += proj.dy;
      proj.lifetime--;

      // Remove if out of bounds or expired
      if (proj.lifetime <= 0 ||
          proj.x < -10 || proj.x > state.arenaWidth + 10 ||
          proj.y < -10 || proj.y > state.arenaHeight + 10) {
        state.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with ships
      for (var j = 0; j < state.ships.length; j++) {
        var ship = state.ships[j];
        if (!ship.alive || ship.config.team === proj.owner) continue;
        if (ship.cloaked || ship.invulnerable > 0) continue;

        var dist = Math.hypot(ship.x - proj.x, ship.y - proj.y);
        if (dist < 20) {
          // Hit!
          var damage = proj.damage;
          if (ship.damageReduction > 0) {
            damage *= (1 - ship.damageReduction);
          }
          ship.currentShields -= damage;

          // Spawn hit particles
          spawnHitParticles(proj.x, proj.y, proj.color);

          state.projectiles.splice(i, 1);

          if (ship.currentShields <= 0) {
            eliminateShip(ship);
          }
          break;
        }
      }
    }
  }

  function updateMines() {
    for (var i = state.mines.length - 1; i >= 0; i--) {
      var mine = state.mines[i];
      if (!mine.armed) {
        mine.armTimer--;
        if (mine.armTimer <= 0) mine.armed = true;
        continue;
      }

      // Check proximity to enemy ships
      for (var j = 0; j < state.ships.length; j++) {
        var ship = state.ships[j];
        if (!ship.alive || ship.config.team === mine.owner) continue;
        if (ship.invulnerable > 0) continue;

        var dist = Math.hypot(ship.x - mine.x, ship.y - mine.y);
        if (dist < mine.radius) {
          // Detonate!
          var damage = mine.damage;
          if (ship.damageReduction > 0) damage *= (1 - ship.damageReduction);
          ship.currentShields -= damage;

          spawnExplosionParticles(mine.x, mine.y, mine.color, 15);
          state.mines.splice(i, 1);

          if (ship.currentShields <= 0) {
            eliminateShip(ship);
          }
          break;
        }
      }
    }
  }

  function eliminateShip(ship) {
    ship.alive = false;
    ship.currentShields = 0;
    state.eliminations.push({
      team: ship.config.team,
      name: ship.config.name,
      tick: state.tick,
      winner: false
    });
    spawnExplosionParticles(ship.x, ship.y, ship.config.color, 40);
    onElimination(ship, state);
  }

  function spawnHitParticles(x, y, color) {
    for (var i = 0; i < 8; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 0.5 + Math.random() * 2;
      state.particles.push({
        x: x, y: y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        color: color,
        lifetime: 10 + Math.random() * 10 | 0,
        maxLifetime: 20,
        size: 2
      });
    }
  }

  function spawnExplosionParticles(x, y, color, count) {
    var colors = ['#fff', '#ffff00', '#ffaa00', '#ff6600', '#ff0000', color];
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 0.5 + Math.random() * 4;
      state.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        color: colors[Math.random() * colors.length | 0],
        lifetime: 15 + Math.random() * 25 | 0,
        maxLifetime: 40,
        size: 2 + Math.random() * 4
      });
    }
  }

  function updateParticles() {
    for (var i = state.particles.length - 1; i >= 0; i--) {
      var p = state.particles[i];
      p.x += p.dx;
      p.y += p.dy;
      p.dx *= 0.96;
      p.dy *= 0.96;
      p.lifetime--;
      if (p.lifetime <= 0) {
        state.particles.splice(i, 1);
      }
    }
    // Cap total particles
    while (state.particles.length > 200) {
      state.particles.shift();
    }
  }

  function stop() {
    clearTimeout(tickInterval);
    state.phase = 'stopped';
  }

  function getState() {
    return state;
  }

  return {
    init: init,
    start: start,
    stop: stop,
    setSpeed: setSpeed,
    getState: getState
  };
})();
