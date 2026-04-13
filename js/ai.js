/**
 * ShipAI - Handles movement, targeting, firing, and ability decisions.
 * All ships use the same AI; differentiation comes from stats and ability choice.
 */
var ShipAI = (function () {
  var TARGET_REEVALUATE_INTERVAL = 20; // ticks

  function update(ship, state) {
    if (!ship.alive) return;

    // Decrement disables
    if (ship.weaponDisabled > 0) ship.weaponDisabled--;
    if (ship.abilityDisabled > 0) ship.abilityDisabled--;
    if (ship.invulnerable > 0) ship.invulnerable--;

    updateTarget(ship, state);
    updateMovement(ship, state);
    updateFiring(ship, state);
    updateAbility(ship, state);
  }

  function updateTarget(ship, state) {
    ship.targetTimer = (ship.targetTimer || 0) + 1;
    if (ship.target && ship.target.alive && ship.targetTimer < TARGET_REEVALUATE_INTERVAL) return;
    ship.targetTimer = 0;

    var aliveEnemies = state.ships.filter(function (s) {
      return s !== ship && s.alive && !s.cloaked;
    });
    if (aliveEnemies.length === 0) {
      ship.target = null;
      return;
    }

    // Low shields → target the weakest enemy
    if (ship.currentShields / ship.maxShields < 0.25) {
      aliveEnemies.sort(function (a, b) {
        return a.currentShields - b.currentShields;
      });
      ship.target = aliveEnemies[0];
      return;
    }

    // Otherwise target nearest
    var nearest = null;
    var nearestDist = Infinity;
    aliveEnemies.forEach(function (s) {
      var d = Math.hypot(s.x - ship.x, s.y - ship.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = s;
      }
    });
    ship.target = nearest;
  }

  function updateMovement(ship, state) {
    var moveSpeed = 2 + ship.config.speed * 0.08;
    var dx = 0, dy = 0;

    // Position history tracking for loop detection
    if (state.tick % 10 === 0) {
      ship.posHistory = ship.posHistory || [];
      ship.posHistory.push({ x: ship.x, y: ship.y });
      if (ship.posHistory.length > 10) {
        ship.posHistory.shift();
      }
    }

    // Loop detection: check if ship is orbiting (staying in small area for 100+ ticks)
    if (ship.posHistory && ship.posHistory.length >= 10) {
      var cx = 0, cy = 0;
      ship.posHistory.forEach(function (p) { cx += p.x; cy += p.y; });
      cx /= ship.posHistory.length;
      cy /= ship.posHistory.length;
      var maxDist = 0;
      ship.posHistory.forEach(function (p) {
        var d = Math.hypot(p.x - cx, p.y - cy);
        if (d > maxDist) maxDist = d;
      });
      ship.loopDetected = maxDist < 60;
    }

    // Behavioral mode system (aggressive, defensive, flanking)
    if (!ship.mode) {
      var modes = ['aggressive', 'defensive', 'flanking'];
      ship.mode = modes[Math.floor(Math.random() * modes.length)];
      ship.modeTicks = 60 + Math.random() * 120 | 0;
    }
    ship.modeTicks--;
    if (ship.modeTicks <= 0) {
      var modes = ['aggressive', 'defensive', 'flanking'];
      var otherModes = modes.filter(function(m) { return m !== ship.mode; });
      ship.mode = otherModes[Math.floor(Math.random() * otherModes.length)];
      ship.modeTicks = 60 + Math.random() * 120 | 0;
    }

    // Steer toward target at engagement range
    if (ship.target && ship.target.alive) {
      var tx = ship.target.x - ship.x;
      var ty = ship.target.y - ship.y;
      var dist = Math.hypot(tx, ty);
      var optimalRange = 150 + (ship.config.speed - ship.config.weaponPower) * 1.5;
      optimalRange = Math.max(100, Math.min(350, optimalRange));

      // Mode-based range adjustment
      var modeRangeOffset = 0;
      if (ship.mode === 'aggressive') modeRangeOffset = -50;  // Fight closer
      if (ship.mode === 'defensive')  modeRangeOffset = +60;  // Fight farther
      var effectiveOptimalRange = optimalRange + modeRangeOffset;

      // If in loop, break out with aggressive charge
      if (ship.loopDetected && dist > 0) {
        ship.strafeDir = ship.strafeDir ? ship.strafeDir * -1 : (Math.random() < 0.5 ? 1 : -1);
        ship.aggressiveTicks = 30;
        ship.posHistory = [];
        ship.loopDetected = false;
        dx += tx / dist * 1.5;
        dy += ty / dist * 1.5;
      } else if (ship.aggressiveTicks && ship.aggressiveTicks > 0) {
        // Continue aggressive charge
        ship.aggressiveTicks--;
        dx += tx / dist * 1.5;
        dy += ty / dist * 1.5;
      } else if (dist > effectiveOptimalRange + 30) {
        dx += tx / dist;
        dy += ty / dist;
      } else if (dist < effectiveOptimalRange - 30) {
        if (ship.mode === 'defensive') {
          // Defensive: retreat harder
          dx -= tx / dist * 1.5;
          dy -= ty / dist * 1.5;
        } else {
          dx -= tx / dist;
          dy -= ty / dist;
        }
      } else {
        // In engagement zone
        if (ship.mode === 'flanking') {
          // Flanking: try to get to the side/behind the target
          var targetHeadingX = Math.cos(ship.target.heading);
          var targetHeadingY = Math.sin(ship.target.heading);
          // Ideal flank position: perpendicular to target's heading
          var flankX = ship.target.x - targetHeadingX * effectiveOptimalRange;
          var flankY = ship.target.y - targetHeadingY * effectiveOptimalRange;
          var flankDx = flankX - ship.x;
          var flankDy = flankY - ship.y;
          var flankDist = Math.hypot(flankDx, flankDy);
          if (flankDist > 0) {
            dx += flankDx / flankDist * 0.8;
            dy += flankDy / flankDist * 0.8;
          }
        } else {
          // Strafe around target (aggressive and defensive)
          ship.strafeDir = ship.strafeDir || (Math.random() < 0.5 ? 1 : -1);
          var strafeWeight = ship.mode === 'aggressive' ? 0.8 : 0.3;
          // Add small radial oscillation so ships don't sit at constant distance
          var radialOscillation = Math.sin(state.tick * 0.1 + (ship.jitterPhase || 0)) * 0.3;
          dx += tx / dist * radialOscillation;
          dx += -ty / dist * strafeWeight * ship.strafeDir;
          dy += tx / dist * strafeWeight * ship.strafeDir;

          // Aggressive mode: occasional random charges
          if (ship.mode === 'aggressive' && state.tick % 40 === 0 && Math.random() < 0.4) {
            ship.aggressiveTicks = 15;
          }
        }
      }
    }

    // Separation from other ships
    state.ships.forEach(function (s) {
      if (s === ship || !s.alive) return;
      var sx = ship.x - s.x;
      var sy = ship.y - s.y;
      var sd = Math.hypot(sx, sy);
      if (sd < 80 && sd > 0) {
        var force = (80 - sd) / 80;
        dx += (sx / sd) * force * 1.5;
        dy += (sy / sd) * force * 1.5;
      }
    });

    // Arena bounds (soft boundary)
    var margin = 60;
    if (ship.x < margin) dx += (margin - ship.x) / margin;
    if (ship.x > state.arenaWidth - margin) dx -= (ship.x - (state.arenaWidth - margin)) / margin;
    if (ship.y < margin) dy += (margin - ship.y) / margin;
    if (ship.y > state.arenaHeight - margin) dy -= (ship.y - (state.arenaHeight - margin)) / margin;

    // Evasion jitter (scaled by speed, 4x stronger)
    var jitterStrength = ship.config.speed * 0.02;
    ship.jitterPhase = (ship.jitterPhase || 0) + 0.15;
    dx += Math.sin(ship.jitterPhase * 2.7 + ship.x * 0.01) * jitterStrength;
    dy += Math.cos(ship.jitterPhase * 3.1 + ship.y * 0.01) * jitterStrength;

    // Normalize and apply speed
    var mag = Math.hypot(dx, dy);
    if (mag > 0) {
      ship.x += (dx / mag) * moveSpeed;
      ship.y += (dy / mag) * moveSpeed;
      // Smooth heading transition
      var targetHeading = Math.atan2(dy, dx);
      var headingDiff = targetHeading - ship.heading;
      while (headingDiff > Math.PI) headingDiff -= 2 * Math.PI;
      while (headingDiff < -Math.PI) headingDiff += 2 * Math.PI;
      ship.heading += headingDiff * 0.15;
    }

    // Hard clamp to arena
    ship.x = Math.max(10, Math.min(state.arenaWidth - 10, ship.x));
    ship.y = Math.max(10, Math.min(state.arenaHeight - 10, ship.y));
  }

  function updateFiring(ship, state) {
    if (!ship.target || !ship.target.alive || ship.weaponDisabled > 0) return;

    ship.fireCooldown = (ship.fireCooldown || 0) - 1;
    if (ship.fireCooldown > 0) return;

    // Check if target is in frontal arc
    var tx = ship.target.x - ship.x;
    var ty = ship.target.y - ship.y;
    var dist = Math.hypot(tx, ty);
    var angleToTarget = Math.atan2(ty, tx);
    var angleDiff = Math.abs(angleToTarget - ship.heading);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

    var weaponRange = 300 + ship.config.weaponPower * 2;
    if (dist > weaponRange || angleDiff > Math.PI / 3) return;

    // Fire!
    var fireRate = Math.max(5, 30 - ship.config.weaponPower * 0.4) | 0;
    if (ship.overdriveActive) fireRate = Math.max(3, fireRate / 2) | 0;

    var projSpeed = 5 + ship.config.weaponPower * 0.05;
    if (ship.overdriveActive) projSpeed *= 1.5;

    var damage = 3 + ship.config.weaponPower * 0.2;

    // Aim with slight lead
    var leadTime = dist / (projSpeed * 10);
    var aimX = ship.target.x;
    var aimY = ship.target.y;

    var aimAngle = Math.atan2(aimY - ship.y, aimX - ship.x);
    // Small random spread
    aimAngle += (Math.random() - 0.5) * 0.15;

    state.projectiles.push({
      x: ship.x + Math.cos(ship.heading) * 20,
      y: ship.y + Math.sin(ship.heading) * 20,
      dx: Math.cos(aimAngle) * projSpeed,
      dy: Math.sin(aimAngle) * projSpeed,
      damage: damage,
      owner: ship.config.team,
      color: ship.config.color,
      lifetime: 60
    });

    // Break cloak on fire
    if (ship.cloaked) {
      ship.cloaked = false;
      ship.abilityActive = false;
      ship.abilityTimer = 0;
    }

    ship.fireCooldown = fireRate;
    ship.lastFireTick = state.tick;
  }

  function updateAbility(ship, state) {
    if (ship.abilityDisabled > 0) return;

    ship.abilityCooldown = Math.max(0, (ship.abilityCooldown || 0) - 1);
    if (ship.abilityCooldown > 0 || ship.abilityActive) return;

    var abilityDef = Abilities.definitions[ship.config.specialAbility];
    if (!abilityDef) return;

    // Track how long ability has been available without firing
    ship.abilityAvailableTicks = (ship.abilityAvailableTicks || 0) + 1;

    // Check trigger condition
    var shouldUse = abilityDef.shouldUse(ship, state);
    var forceUse = ship.abilityAvailableTicks >= 100; // Use it or lose it after 10 seconds

    if (!shouldUse && !forceUse) {
      ship.abilityTriggerDelay = 0;
      return;
    }

    // Delay before activation (feels more natural)
    ship.abilityTriggerDelay = (ship.abilityTriggerDelay || 0) + 1;
    if (ship.abilityTriggerDelay < 3) return;

    // Activate!
    ship.abilityActive = true;
    ship.abilityTriggerDelay = 0;
    ship.abilityAvailableTicks = 0;
    ship.abilityCooldown = Abilities.getCooldown(ship.config.ability);

    var effect = abilityDef.activate(ship, state);
    if (effect) {
      state.abilityEffects.push(effect);
      BattleEngine.spawnVisualEffect(effect, ship);
    }
  }

  return {
    update: update
  };
})();
