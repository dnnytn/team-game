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
      visualEffects: [],
      eliminations: []
    };

    // Place ships randomly around the arena center (not fixed angles)
    var cx = canvasWidth / 2;
    var cy = canvasHeight / 2;
    var baseRadius = Math.min(canvasWidth, canvasHeight) * 0.35;
    var angleOffset = Math.random() * Math.PI * 2; // Random rotation each battle

    shipConfigs.forEach(function (config, i) {
      var angle = (i / shipConfigs.length) * Math.PI * 2 - Math.PI / 2 + angleOffset;
      var r = baseRadius * (0.7 + Math.random() * 0.6); // Vary radius 70-130%
      var ship = {
        config: config,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        heading: angle + Math.PI, // Face center
        currentShields: config.shields * 3,
        maxShields: config.shields * 3,
        alive: true,
        abilityCooldown: 20, // Brief initial cooldown
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
    updateVisualEffects();

    // Battle time limit (5 minutes at 10 ticks/sec)
    var MAX_BATTLE_TICKS = 3000;
    if (state.tick >= MAX_BATTLE_TICKS) {
      state.phase = 'victory';
      var aliveShips = state.ships.filter(function (s) { return s.alive; });
      // Sort by shield percentage (highest first)
      aliveShips.sort(function (a, b) {
        return (b.currentShields / b.maxShields) - (a.currentShields / a.maxShields);
      });
      // Add eliminations in reverse order (lowest shields first) with winner marked
      for (var i = aliveShips.length - 1; i >= 0; i--) {
        state.eliminations.push({
          team: aliveShips[i].config.team,
          name: aliveShips[i].config.name,
          tick: state.tick,
          winner: i === 0
        });
      }
      clearTimeout(tickInterval);
      onBattleEnd(state);
      return;
    }

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

  function updateVisualEffects() {
    for (var i = state.visualEffects.length - 1; i >= 0; i--) {
      var ve = state.visualEffects[i];
      ve.lifetime--;

      // Expand radius-based effects
      if (ve.targetRadius !== undefined) {
        var progress = 1 - (ve.lifetime / ve.maxLifetime);
        ve.radius = ve.targetRadius * progress;
      }

      if (ve.lifetime <= 0) {
        state.visualEffects.splice(i, 1);
      }
    }
  }

  function spawnVisualEffect(effect, ship) {
    var baseColor = ship ? ship.config.color : '#ffffff';
    switch (effect.type) {

      case 'shield_burst':
        state.visualEffects.push({
          type: 'expanding_ring', x: effect.x, y: effect.y,
          lifetime: 20, maxLifetime: 20,
          radius: 0, targetRadius: 90,
          color: '#4488ff', lineWidth: 3, alpha: 0.8
        });
        state.visualEffects.push({
          type: 'expanding_ring', x: effect.x, y: effect.y,
          lifetime: 12, maxLifetime: 12,
          radius: 0, targetRadius: 50,
          color: '#aaccff', lineWidth: 2, alpha: 0.6
        });
        state.visualEffects.push({
          type: 'ship_glow', lifetime: 20, maxLifetime: 20,
          shipRef: ship, color: '#4488ff', glowRadius: 36, alpha: 0.5
        });
        break;

      case 'emp_blast':
        var empRadius = effect.radius;
        for (var r = 0; r < 3; r++) {
          state.visualEffects.push({
            type: 'expanding_ring', x: effect.x, y: effect.y,
            lifetime: 15 - r * 3, maxLifetime: 15 - r * 3,
            radius: 0, targetRadius: empRadius * (0.6 + r * 0.2),
            color: '#00ddff', lineWidth: 2 - r * 0.5, alpha: 0.7 - r * 0.15
          });
        }
        state.visualEffects.push({
          type: 'fading_disc', x: effect.x, y: effect.y,
          lifetime: 10, maxLifetime: 10,
          radius: empRadius, color: '#0088cc', alpha: 0.12
        });
        for (var b = 0; b < 6; b++) {
          var boltAngle = (b / 6) * Math.PI * 2;
          state.visualEffects.push({
            type: 'bolt', x: effect.x, y: effect.y,
            lifetime: 6, maxLifetime: 6,
            angle: boltAngle, length: empRadius * 0.8,
            color: '#aaffff', lineWidth: 1.5, alpha: 0.9
          });
        }
        break;

      case 'teleport':
        for (var s = 0; s < 6; s++) {
          state.visualEffects.push({
            type: 'swirl_line', x: effect.fromX, y: effect.fromY,
            lifetime: 15, maxLifetime: 15,
            angleOffset: (s / 6) * Math.PI * 2,
            radius: 30, color: '#cc44ff', alpha: 0.8
          });
        }
        state.visualEffects.push({
          type: 'fading_disc', x: effect.toX, y: effect.toY,
          lifetime: 8, maxLifetime: 8,
          radius: 40, color: '#ffffff', alpha: 0.4
        });
        state.visualEffects.push({
          type: 'expanding_ring', x: effect.toX, y: effect.toY,
          lifetime: 12, maxLifetime: 12,
          radius: 0, targetRadius: 60,
          color: '#cc44ff', lineWidth: 2, alpha: 0.7
        });
        break;

      case 'cloak':
        state.visualEffects.push({
          type: 'expanding_ring', x: effect.x, y: effect.y,
          lifetime: 8, maxLifetime: 8,
          radius: 0, targetRadius: 40,
          color: '#8888cc', lineWidth: 6, alpha: 0.5
        });
        for (var k = 0; k < 12; k++) {
          var angle = (k / 12) * Math.PI * 2;
          state.particles.push({
            x: effect.x + Math.cos(angle) * 20,
            y: effect.y + Math.sin(angle) * 20,
            dx: Math.cos(angle) * (0.3 + Math.random() * 0.5),
            dy: Math.sin(angle) * (0.3 + Math.random() * 0.5),
            color: '#aaaaff',
            lifetime: 15 + Math.random() * 10 | 0,
            maxLifetime: 25,
            size: 1.5
          });
        }
        break;

      case 'overdrive':
        var overdriveDuration = ship ? (ship.abilityTimer || 25) : 25;
        state.visualEffects.push({
          type: 'overdrive_aura', lifetime: overdriveDuration, maxLifetime: overdriveDuration,
          shipRef: ship, color: '#ff4400', pulseSpeed: 0.4
        });
        state.visualEffects.push({
          type: 'expanding_ring', x: effect.x, y: effect.y,
          lifetime: 10, maxLifetime: 10,
          radius: 0, targetRadius: 50,
          color: '#ff8800', lineWidth: 4, alpha: 0.8
        });
        break;

      case 'mine_layer':
        state.visualEffects.push({
          type: 'fading_disc', x: effect.x, y: effect.y,
          lifetime: 6, maxLifetime: 6,
          radius: 18, color: '#ff8800', alpha: 0.5
        });
        state.visualEffects.push({
          type: 'expanding_ring', x: effect.x, y: effect.y,
          lifetime: 8, maxLifetime: 8,
          radius: 0, targetRadius: 30,
          color: '#ffaa00', lineWidth: 2, alpha: 0.6
        });
        break;
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
    getState: getState,
    spawnVisualEffect: spawnVisualEffect
  };
})();
