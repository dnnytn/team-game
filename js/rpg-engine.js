/**
 * RPGEngine - Turn-based RPG battle system
 * Manages state machine, turn queue, AI decisions, animation callbacks
 */
var RPGEngine = (function () {
  var rpgState = null;
  var onBattleEndCb = null;

  function init(shipConfigs, canvasWidth, canvasHeight) {
    rpgState = {
      phase: 'idle',
      tick: 0,
      ships: [],
      turnQueue: [],
      turnIndex: 0,
      activeShip: null,
      visualEffects: [],
      particles: [],
      arenaWidth: canvasWidth,
      arenaHeight: canvasHeight,
      battleMessage: '',
      messageAlpha: 0,
      shakeFrames: 0,
      shakeIntensity: 0,
      eliminations: []
    };

    // Create RPGShip objects from configs
    shipConfigs.forEach(function (config) {
      var ship = {
        config: config,
        maxHP: config.shields * 3,
        currentHP: config.shields * 3,
        displayHP: config.shields * 3,
        currentShields: config.shields * 3, // alias for Abilities compat
        alive: true,
        specialCooldown: 0,
        displayScale: 1.0,
        isActive: false,
        damageReduction: 0,
        cloaked: false,
        overdriveActive: false,
        abilityActive: false,
        abilityTimer: 0,
        invulnerable: 0
      };
      rpgState.ships.push(ship);
    });

    // Position ships in circle
    computeShipPositions(rpgState.ships, canvasWidth, canvasHeight);

    // Build initial turn queue (sorted by speed, fastest first)
    buildTurnQueue();

    return rpgState;
  }

  function computeShipPositions(ships, w, h) {
    var cx = w / 2, cy = h / 2, radius = 250;
    ships.forEach(function (ship, i) {
      var angle = (i / ships.length) * Math.PI * 2 - Math.PI / 2;
      ship.homeX = cx + Math.cos(angle) * radius;
      ship.homeY = cy + Math.sin(angle) * radius;
      ship.renderX = ship.homeX;
      ship.renderY = ship.homeY;
      ship.x = ship.homeX;
      ship.y = ship.homeY;
      ship.heading = Math.atan2(cy - ship.homeY, cx - ship.homeX);
    });
  }

  function buildTurnQueue() {
    rpgState.turnQueue = rpgState.ships
      .filter(function (s) { return s.alive; })
      .sort(function (a, b) { return b.config.speed - a.config.speed; });
    rpgState.turnIndex = 0;
    rpgState.activeShip = rpgState.turnQueue[0] || null;
  }

  function start(onBattleEnd) {
    onBattleEndCb = onBattleEnd;
    rpgState.phase = 'idle';
    if (rpgState.activeShip) {
      runTurn(function () {
        // Turn complete, advance queue for next
        advanceTurnQueue();
        checkVictory();
      });
    }
  }

  function getState() {
    return rpgState;
  }

  // ===== ANIMATION CALLBACK CHAIN =====

  function runTurn(onComplete) {
    var ship = rpgState.activeShip;
    if (!ship || !ship.alive) {
      onComplete();
      return;
    }

    showTurnStart(ship, function () {
      var action = chooseAction(ship);
      showMessage(action.message, 500, function () {
        playActionAnimation(action, function () {
          resolveAction(action, function () {
            if (action.target && !action.target.alive) {
              playDeathSequence(action.target, function () {
                finishTurn(onComplete);
              });
            } else {
              finishTurn(onComplete);
            }
          });
        });
      });
    });
  }

  function showTurnStart(ship, onComplete) {
    rpgState.phase = 'turn_start';
    ship.isActive = true;
    animateScale(ship, 1.3, 200, function () {
      rpgState.visualEffects.push({
        type: 'ship_glow',
        lifetime: 18,
        maxLifetime: 18,
        shipRef: ship,
        color: ship.config.color,
        glowRadius: 50,
        alpha: 0.9
      });

      setTimeout(function () {
        animateScale(ship, 1.15, 150, function () {
          onComplete();
        });
      }, 300);
    });
  }

  function showMessage(text, delayMs, onComplete) {
    rpgState.battleMessage = text;
    rpgState.messageAlpha = 0;
    animateValue(rpgState, 'messageAlpha', 1.0, 200, function () {
      setTimeout(onComplete, delayMs);
    });
  }

  function playActionAnimation(action, onComplete) {
    if (action.type === 'ATTACK') {
      playAttackAnimation(action, onComplete);
    } else if (action.type === 'DEFEND') {
      playDefendAnimation(action, onComplete);
    } else {
      playSpecialAnimation(action, onComplete);
    }
  }

  function playAttackAnimation(action, onComplete) {
    var attacker = action.actor;
    var target = action.target;

    spawnChargeRings(attacker);
    GameAudio.playLaser(attacker.config.weaponPower);

    setTimeout(function () {
      lunge(attacker, target.renderX, target.renderY, 15, function () {
        spawnBeam(attacker, target);
        spawnHitFlash(target);
        spawnImpactParticles(target, attacker.config.color, 20);
        triggerScreenShake(8, 6);
        GameAudio.playHit();

        lunge(attacker, attacker.homeX, attacker.homeY, 10, function () {
          onComplete();
        });
      });
    }, 400);
  }

  function playDefendAnimation(action, onComplete) {
    var ship = action.actor;
    ship.damageReduction = 0.3;

    GameAudio.playAbility('shield_burst');

    rpgState.visualEffects.push({
      type: 'expanding_ring',
      x: ship.renderX,
      y: ship.renderY,
      lifetime: 20,
      maxLifetime: 20,
      radius: 0,
      targetRadius: 80,
      color: '#4488ff',
      lineWidth: 4,
      alpha: 0.9
    });

    rpgState.visualEffects.push({
      type: 'ship_glow',
      lifetime: 25,
      maxLifetime: 25,
      shipRef: ship,
      color: '#4488ff',
      glowRadius: 45,
      alpha: 0.7
    });

    waitForEffectsClear(rpgState, 1000, onComplete);
  }

  function playSpecialAnimation(action, onComplete) {
    var ship = action.actor;
    var abilityKey = action.abilityKey;

    GameAudio.playAbility(abilityKey);

    var proxyState = {
      ships: rpgState.ships,
      particles: rpgState.particles,
      mines: [],
      arenaWidth: rpgState.arenaWidth,
      arenaHeight: rpgState.arenaHeight
    };

    ship.x = ship.renderX;
    ship.y = ship.renderY;

    var abilityDef = Abilities.definitions[abilityKey];
    if (abilityDef) {
      var effect = abilityDef.activate(ship, proxyState);
      if (effect) {
        spawnRpgVisualEffect(effect, ship);
      }
    }

    ship.x = ship.homeX;
    ship.y = ship.homeY;

    waitForEffectsClear(rpgState, 2000, onComplete);
  }

  function resolveAction(action, onComplete) {
    rpgState.phase = 'resolving';

    if (action.type === 'ATTACK') {
      var base = 5 + action.actor.config.weaponPower * 0.5;
      var variance = (Math.random() * 0.4) - 0.2;
      action.damage = Math.round(base * (1 + variance));

      if (action.target.damageReduction > 0) {
        action.damage = Math.round(action.damage * (1 - action.target.damageReduction));
      }

      action.target.currentHP = Math.max(0, action.target.currentHP - action.damage);
      action.target.currentShields = action.target.currentHP;

      rpgState.battleMessage = action.actor.config.name + ' hits for ' + action.damage + ' DMG!';

      drainHP(action.target, 600, function () {
        if (action.target.currentHP <= 0) {
          action.target.alive = false;
          action.target.currentHP = 0;
          action.target.displayHP = 0;
          action.target.currentShields = 0;
        }
        action.actor.damageReduction = 0;
        onComplete();
      });
    } else if (action.type === 'DEFEND') {
      var restore = Math.round(action.actor.maxHP * 0.15);
      action.actor.currentHP = Math.min(action.actor.maxHP, action.actor.currentHP + restore);
      action.actor.currentShields = action.actor.currentHP;

      rpgState.battleMessage = action.actor.config.name + ' restores ' + restore + ' HP!';

      drainHP(action.actor, 400, onComplete);
    } else {
      action.actor.damageReduction = 0;
      setTimeout(onComplete, 300);
    }
  }

  function playDeathSequence(ship, onComplete) {
    rpgState.battleMessage = ship.config.name + ' has been eliminated!';
    GameAudio.playExplosion();

    spawnExplosionParticles(ship.renderX, ship.renderY, ship.config.color, 50);
    triggerScreenShake(14, 12);

    for (var i = 0; i < 3; i++) {
      (function (delay) {
        setTimeout(function () {
          rpgState.visualEffects.push({
            type: 'expanding_ring',
            x: ship.renderX,
            y: ship.renderY,
            lifetime: 15,
            maxLifetime: 15,
            radius: 0,
            targetRadius: 120 + delay * 30,
            color: '#ffffff',
            lineWidth: 3,
            alpha: 0.8
          });
        }, delay * 200);
      })(i);
    }

    rpgState.eliminations.push({ team: ship.config.team, name: ship.config.name, winner: false });

    setTimeout(onComplete, 1400);
  }

  function finishTurn(onComplete) {
    rpgState.phase = 'turn_end';
    rpgState.activeShip.isActive = false;
    rpgState.activeShip.displayScale = 1.0;

    setTimeout(function () {
      onComplete();
    }, 400);
  }

  function advanceTurnQueue() {
    if (rpgState.activeShip && rpgState.activeShip.specialCooldown > 0) {
      rpgState.activeShip.specialCooldown--;
    }

    rpgState.turnIndex++;

    while (rpgState.turnIndex < rpgState.turnQueue.length &&
           !rpgState.turnQueue[rpgState.turnIndex].alive) {
      rpgState.turnIndex++;
    }

    if (rpgState.turnIndex >= rpgState.turnQueue.length) {
      buildTurnQueue();
    }

    rpgState.activeShip = rpgState.turnQueue[rpgState.turnIndex] || null;
  }

  function checkVictory() {
    var aliveShips = rpgState.ships.filter(function (s) { return s.alive; });

    if (aliveShips.length <= 1) {
      rpgState.phase = 'victory';
      if (aliveShips.length === 1) {
        rpgState.eliminations.push({
          team: aliveShips[0].config.team,
          name: aliveShips[0].config.name,
          winner: true
        });
      }

      setTimeout(function () {
        if (onBattleEndCb) {
          onBattleEndCb(rpgState);
        }
      }, 500);
    } else {
      // Continue battle
      if (rpgState.activeShip) {
        runTurn(function () {
          advanceTurnQueue();
          checkVictory();
        });
      }
    }
  }

  // ===== AI DECISIONS =====

  function chooseAction(ship) {
    var aliveEnemies = rpgState.ships.filter(function (s) {
      return s.alive && s !== ship;
    });

    // SPECIAL: cooldown expired AND ability's shouldUse condition true
    if (ship.specialCooldown === 0) {
      var abilityDef = Abilities.definitions[ship.config.specialAbility];
      var proxyState = { ships: rpgState.ships, particles: rpgState.particles };
      if (abilityDef && abilityDef.shouldUse(ship, proxyState)) {
        ship.specialCooldown = 4;
        var target = lowestHPEnemy(aliveEnemies);
        return {
          type: 'SPECIAL',
          actor: ship,
          target: target,
          abilityKey: ship.config.specialAbility,
          damage: 0,
          message: ship.config.name + ' uses ' + abilityDef.name + '!'
        };
      }
    }

    // DEFEND: shields below 40%
    if (ship.currentHP / ship.maxHP < 0.40) {
      return {
        type: 'DEFEND',
        actor: ship,
        target: null,
        damage: 0,
        message: ship.config.name + ' takes a defensive stance!'
      };
    }

    // ATTACK: target lowest-HP enemy
    var target = lowestHPEnemy(aliveEnemies);
    return {
      type: 'ATTACK',
      actor: ship,
      target: target,
      damage: 0,
      message: ship.config.name + ' attacks ' + target.config.name + '!'
    };
  }

  function lowestHPEnemy(enemies) {
    return enemies.reduce(function (lowest, s) {
      return s.currentHP < lowest.currentHP ? s : lowest;
    }, enemies[0]);
  }

  // ===== ANIMATION PRIMITIVES =====

  function lunge(ship, destX, destY, totalFrames, onComplete) {
    var startX = ship.renderX, startY = ship.renderY, frame = 0;
    ship.heading = Math.atan2(destY - startY, destX - startX);

    function step() {
      frame++;
      var t = frame / totalFrames;
      var eased = 1 - Math.pow(1 - t, 2); // ease-out
      ship.renderX = startX + (destX - startX) * eased;
      ship.renderY = startY + (destY - startY) * eased;

      if (frame < totalFrames) {
        requestAnimationFrame(step);
      } else {
        ship.renderX = destX;
        ship.renderY = destY;
        onComplete();
      }
    }
    requestAnimationFrame(step);
  }

  function animateScale(ship, targetScale, durationMs, onComplete) {
    var startScale = ship.displayScale;
    var startTime = performance.now();

    function step(now) {
      var t = Math.min(1, (now - startTime) / durationMs);
      ship.displayScale = startScale + (targetScale - startScale) * t;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        ship.displayScale = targetScale;
        onComplete();
      }
    }
    requestAnimationFrame(step);
  }

  function drainHP(ship, durationMs, onComplete) {
    var startHP = ship.displayHP;
    var targetHP = ship.currentHP;
    var startTime = performance.now();

    function step(now) {
      var t = Math.min(1, (now - startTime) / durationMs);
      var eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out
      ship.displayHP = startHP + (targetHP - startHP) * eased;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        ship.displayHP = targetHP;
        onComplete();
      }
    }
    requestAnimationFrame(step);
  }

  function animateValue(obj, prop, targetVal, durationMs, onComplete) {
    var startVal = obj[prop];
    var startTime = performance.now();

    function step(now) {
      var t = Math.min(1, (now - startTime) / durationMs);
      obj[prop] = startVal + (targetVal - startVal) * t;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        obj[prop] = targetVal;
        onComplete();
      }
    }
    requestAnimationFrame(step);
  }

  function waitForEffectsClear(state, maxMs, onComplete) {
    var deadline = performance.now() + maxMs;

    function poll() {
      if (state.visualEffects.length === 0 || performance.now() >= deadline) {
        onComplete();
      } else {
        requestAnimationFrame(poll);
      }
    }
    requestAnimationFrame(poll);
  }

  // ===== VISUAL EFFECT SPAWNERS =====

  function spawnChargeRings(ship) {
    for (var i = 0; i < 3; i++) {
      (function (delay) {
        setTimeout(function () {
          rpgState.visualEffects.push({
            type: 'charge_ring',
            shipRef: ship,
            x: ship.renderX,
            y: ship.renderY,
            lifetime: 12,
            maxLifetime: 12,
            targetRadius: 45 + delay * 10,
            color: ship.config.color,
            lineWidth: 2,
            alpha: 0.85
          });
        }, delay * 120);
      })(i);
    }
  }

  function spawnBeam(attacker, target) {
    rpgState.visualEffects.push({
      type: 'beam',
      x: attacker.renderX,
      y: attacker.renderY,
      toX: target.renderX,
      toY: target.renderY,
      lifetime: 10,
      maxLifetime: 10,
      color: attacker.config.color,
      lineWidth: 5,
      alpha: 1.0
    });
  }

  function spawnHitFlash(target) {
    rpgState.visualEffects.push({
      type: 'hit_flash',
      x: target.renderX,
      y: target.renderY,
      radius: 40,
      lifetime: 8,
      maxLifetime: 8,
      color: '#ffffff',
      alpha: 1.0
    });
  }

  function spawnImpactParticles(ship, color, count) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1 + Math.random() * 3;
      rpgState.particles.push({
        x: ship.renderX,
        y: ship.renderY,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        lifetime: 20 + Math.random() * 20,
        maxLifetime: 20 + Math.random() * 20,
        size: 2 + Math.random() * 4,
        color: color
      });
    }
  }

  function spawnExplosionParticles(x, y, color, count) {
    var colors = ['#fff', '#ffff00', '#ffaa00', '#ff6600', '#ff0000', color];
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1 + Math.random() * 4;
      rpgState.particles.push({
        x: x,
        y: y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        lifetime: 15 + Math.random() * 25,
        maxLifetime: 15 + Math.random() * 25,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  function triggerScreenShake(intensity, frames) {
    rpgState.shakeIntensity = intensity;
    rpgState.shakeFrames = frames;
  }

  // ===== SPAWNRPGVISUALEFFECT - Replicates BattleEngine.spawnVisualEffect for RPG =====

  function spawnRpgVisualEffect(effect, ship) {
    var x = ship.renderX, y = ship.renderY;
    var lifetime = 15; // default frame-based lifetime

    switch (effect.type) {
      case 'shield_burst':
        rpgState.visualEffects.push({
          type: 'expanding_ring',
          x: x, y: y,
          lifetime: 12, maxLifetime: 12,
          radius: 0, targetRadius: 90,
          color: '#00ccff', lineWidth: 3, alpha: 0.7, layer: 'behind'
        });
        rpgState.visualEffects.push({
          type: 'expanding_ring',
          x: x, y: y,
          lifetime: 12, maxLifetime: 12,
          radius: 0, targetRadius: 50,
          color: '#0088ff', lineWidth: 2, alpha: 0.8, layer: 'behind'
        });
        rpgState.visualEffects.push({
          type: 'ship_glow',
          shipRef: ship,
          lifetime: 20, maxLifetime: 20,
          color: '#4488ff', glowRadius: 36, alpha: 0.6, layer: 'behind'
        });
        break;

      case 'emp_blast':
        rpgState.visualEffects.push({
          type: 'expanding_ring',
          x: x, y: y,
          lifetime: 15, maxLifetime: 15,
          radius: 0, targetRadius: effect.radius || 100,
          color: '#0088ff', lineWidth: 3, alpha: 0.8, layer: 'behind'
        });
        rpgState.visualEffects.push({
          type: 'expanding_ring',
          x: x, y: y,
          lifetime: 12, maxLifetime: 12,
          radius: 0, targetRadius: effect.radius * 0.7 || 70,
          color: '#00ccff', lineWidth: 2, alpha: 0.6, layer: 'behind'
        });
        rpgState.visualEffects.push({
          type: 'expanding_ring',
          x: x, y: y,
          lifetime: 9, maxLifetime: 9,
          radius: 0, targetRadius: effect.radius * 0.4 || 40,
          color: '#66ffff', lineWidth: 2, alpha: 0.7, layer: 'behind'
        });

        for (var i = 0; i < 6; i++) {
          var angle = (i / 6) * Math.PI * 2;
          rpgState.visualEffects.push({
            type: 'bolt',
            x: x, y: y,
            angle: angle,
            length: effect.radius || 100,
            lifetime: 12, maxLifetime: 12,
            color: '#00ffff', lineWidth: 2, alpha: 0.9, layer: 'behind'
          });
        }
        break;

      case 'teleport':
        rpgState.visualEffects.push({
          type: 'fading_disc',
          x: effect.fromX, y: effect.fromY,
          radius: 40,
          lifetime: 15, maxLifetime: 15,
          color: '#00ccff', alpha: 0.8, layer: 'behind'
        });

        for (var j = 0; j < 6; j++) {
          var angle2 = (j / 6) * Math.PI * 2;
          rpgState.visualEffects.push({
            type: 'swirl_line',
            x: effect.fromX, y: effect.fromY,
            angleOffset: angle2,
            radius: 60,
            lifetime: 18, maxLifetime: 18,
            color: '#00ccff', layer: 'behind'
          });
        }

        rpgState.visualEffects.push({
          type: 'expanding_ring',
          x: effect.toX, y: effect.toY,
          lifetime: 12, maxLifetime: 12,
          radius: 0, targetRadius: 50,
          color: '#ffffff', lineWidth: 3, alpha: 0.9, layer: 'front'
        });

        rpgState.visualEffects.push({
          type: 'fading_disc',
          x: effect.toX, y: effect.toY,
          radius: 50,
          lifetime: 10, maxLifetime: 10,
          color: '#ffffff', alpha: 0.6, layer: 'front'
        });
        break;

      case 'cloak':
        rpgState.visualEffects.push({
          type: 'expanding_ring',
          x: x, y: y,
          lifetime: 20, maxLifetime: 20,
          radius: 0, targetRadius: 40,
          color: '#00ccff', lineWidth: 2, alpha: 0.7, layer: 'behind'
        });

        for (var k = 0; k < 12; k++) {
          var angle3 = (k / 12) * Math.PI * 2;
          var px = x + Math.cos(angle3) * 20;
          var py = y + Math.sin(angle3) * 20;
          rpgState.particles.push({
            x: px, y: py,
            dx: Math.cos(angle3) * 0.8,
            dy: Math.sin(angle3) * 0.8,
            lifetime: 15, maxLifetime: 15,
            size: 2,
            color: '#00ccff'
          });
        }
        break;

      case 'overdrive':
        rpgState.visualEffects.push({
          type: 'overdrive_aura',
          shipRef: ship,
          lifetime: 25, maxLifetime: 25,
          color: '#ff8800', pulseSpeed: 6, layer: 'behind'
        });
        rpgState.visualEffects.push({
          type: 'expanding_ring',
          x: x, y: y,
          lifetime: 15, maxLifetime: 15,
          radius: 0, targetRadius: 50,
          color: '#ffaa00', lineWidth: 2, alpha: 0.6, layer: 'behind'
        });
        break;

      case 'mine_layer':
        rpgState.visualEffects.push({
          type: 'fading_disc',
          x: x, y: y,
          radius: 18,
          lifetime: 12, maxLifetime: 12,
          color: '#ffaa00', alpha: 0.8, layer: 'behind'
        });
        rpgState.visualEffects.push({
          type: 'expanding_ring',
          x: x, y: y,
          lifetime: 15, maxLifetime: 15,
          radius: 0, targetRadius: 30,
          color: '#ff8800', lineWidth: 2, alpha: 0.7, layer: 'behind'
        });
        break;
    }
  }

  return {
    init: init,
    start: start,
    getState: getState
  };
})();
