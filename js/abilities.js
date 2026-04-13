/**
 * Abilities - Special ability definitions and execution logic.
 */
var Abilities = (function () {
  var BASE_COOLDOWN = 150; // ticks (15 seconds at 10 ticks/sec)
  var MIN_COOLDOWN = 80;   // ticks (8 seconds minimum)

  function getCooldown(abilityStat) {
    return Math.max(MIN_COOLDOWN, BASE_COOLDOWN - abilityStat * 1.5) | 0;
  }

  var definitions = {
    shield_burst: {
      name: "Shield Burst",
      activate: function (ship, state) {
        var restore = 10 + ship.config.ability * 0.8;
        ship.currentShields = Math.min(ship.maxShields, ship.currentShields + restore);
        ship.damageReduction = 0.5;
        ship.abilityTimer = 20 + (ship.config.ability * 0.5) | 0;
        return { type: 'shield_burst', x: ship.x, y: ship.y, radius: 40 };
      },
      update: function (ship, state) {
        if (ship.abilityTimer > 0) {
          ship.abilityTimer--;
          if (ship.abilityTimer <= 0) {
            ship.damageReduction = 0;
            ship.abilityActive = false;
          }
        }
      },
      shouldUse: function (ship, state) {
        return ship.currentShields / ship.maxShields < 0.4;
      }
    },

    cloak: {
      name: "Cloaking Device",
      activate: function (ship, state) {
        ship.cloaked = true;
        ship.abilityTimer = 30 + ship.config.ability * 0.8 | 0;
        return { type: 'cloak', x: ship.x, y: ship.y };
      },
      update: function (ship, state) {
        if (ship.abilityTimer > 0) {
          ship.abilityTimer--;
          if (ship.abilityTimer <= 0) {
            ship.cloaked = false;
            ship.abilityActive = false;
          }
        }
      },
      shouldUse: function (ship, state) {
        var nearbyCount = 0;
        var aliveShips = state.ships.filter(function (s) { return s.alive && s !== ship; });
        aliveShips.forEach(function (s) {
          var dist = Math.hypot(s.x - ship.x, s.y - ship.y);
          if (dist < 200) nearbyCount++;
        });
        return nearbyCount >= 2 || ship.currentShields / ship.maxShields < 0.3;
      }
    },

    emp_blast: {
      name: "EMP Blast",
      activate: function (ship, state) {
        var radius = 100 + ship.config.ability * 2;
        var duration = 20 + ship.config.ability * 0.5 | 0;
        state.ships.forEach(function (s) {
          if (s === ship || !s.alive) return;
          var dist = Math.hypot(s.x - ship.x, s.y - ship.y);
          if (dist < radius) {
            s.weaponDisabled = duration;
            s.abilityDisabled = duration;
          }
        });
        ship.abilityActive = false;
        return { type: 'emp_blast', x: ship.x, y: ship.y, radius: radius };
      },
      update: function (ship, state) {
        // EMP is instant, no ongoing update needed
      },
      shouldUse: function (ship, state) {
        var radius = 100 + ship.config.ability * 2;
        var nearbyCount = 0;
        state.ships.forEach(function (s) {
          if (s === ship || !s.alive) return;
          if (Math.hypot(s.x - ship.x, s.y - ship.y) < radius) nearbyCount++;
        });
        return nearbyCount >= 2;
      }
    },

    teleport: {
      name: "Warp Jump",
      activate: function (ship, state) {
        var oldX = ship.x, oldY = ship.y;
        var margin = 80;
        var attempts = 20;
        var bestX = ship.x, bestY = ship.y, bestDist = 0;
        for (var i = 0; i < attempts; i++) {
          var nx = margin + Math.random() * (state.arenaWidth - margin * 2);
          var ny = margin + Math.random() * (state.arenaHeight - margin * 2);
          var minDist = Infinity;
          state.ships.forEach(function (s) {
            if (s === ship || !s.alive) return;
            var d = Math.hypot(s.x - nx, s.y - ny);
            if (d < minDist) minDist = d;
          });
          if (minDist > bestDist) {
            bestDist = minDist;
            bestX = nx;
            bestY = ny;
          }
        }
        ship.x = bestX;
        ship.y = bestY;
        ship.invulnerable = 10;
        ship.abilityActive = false;
        return { type: 'teleport', fromX: oldX, fromY: oldY, toX: bestX, toY: bestY };
      },
      update: function (ship, state) {
        // Teleport is instant
      },
      shouldUse: function (ship, state) {
        return ship.currentShields / ship.maxShields < 0.2;
      }
    },

    overdrive: {
      name: "Weapon Overdrive",
      activate: function (ship, state) {
        ship.overdriveActive = true;
        ship.abilityTimer = 25 + ship.config.ability * 0.6 | 0;
        return { type: 'overdrive', x: ship.x, y: ship.y };
      },
      update: function (ship, state) {
        if (ship.abilityTimer > 0) {
          ship.abilityTimer--;
          if (ship.abilityTimer <= 0) {
            ship.overdriveActive = false;
            ship.abilityActive = false;
          }
        }
      },
      shouldUse: function (ship, state) {
        if (!ship.target || !ship.target.alive) return false;
        return ship.target.currentShields / ship.target.maxShields < 0.5;
      }
    },

    mine_layer: {
      name: "Mine Layer",
      activate: function (ship, state) {
        var maxMines = 1 + (ship.config.ability / 20) | 0;
        var myMines = state.mines.filter(function (m) { return m.owner === ship.config.team; });
        if (myMines.length >= maxMines) {
          // Remove oldest mine
          var idx = state.mines.indexOf(myMines[0]);
          if (idx >= 0) state.mines.splice(idx, 1);
        }
        var damage = 10 + ship.config.ability * 0.4;
        state.mines.push({
          x: ship.x,
          y: ship.y,
          owner: ship.config.team,
          damage: damage,
          radius: 50,
          armed: false,
          armTimer: 10,
          color: ship.config.color
        });
        ship.abilityActive = false;
        return { type: 'mine_layer', x: ship.x, y: ship.y };
      },
      update: function (ship, state) {
        // Mines are managed by engine
      },
      shouldUse: function (ship, state) {
        // Drop mine when enemy is approaching from behind or when retreating
        if (!ship.target || !ship.target.alive) return false;
        var dx = ship.target.x - ship.x;
        var dy = ship.target.y - ship.y;
        var angleToTarget = Math.atan2(dy, dx);
        var angleDiff = Math.abs(angleToTarget - ship.heading);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        // Enemy is roughly behind us
        return angleDiff > Math.PI * 0.6;
      }
    }
  };

  return {
    definitions: definitions,
    getCooldown: getCooldown
  };
})();
