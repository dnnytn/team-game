/**
 * RPGRenderer - Renders the RPG turn-based battle
 * Owns RAF loop, canvas drawing, visual effects lifetime management
 */
var RPGRenderer = (function () {
  var canvas = null;
  var ctx = null;
  var animFrameId = null;
  var getStateFn = null;
  var stars = [];
  var shakeOffsetX = 0;
  var shakeOffsetY = 0;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    initStarfield();
  }

  function initStarfield() {
    stars = [];
    for (var i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5,
        brightness: Math.random() * 0.5 + 0.3,
        layer: Math.random() > 0.5 ? 'far' : 'near',
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  function startLoop(getState) {
    getStateFn = getState;
    animFrameId = requestAnimationFrame(renderLoop);
  }

  function stopLoop() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function renderLoop() {
    var state = getStateFn();
    if (state) {
      render(state);
    }
    animFrameId = requestAnimationFrame(renderLoop);
  }

  function render(state) {
    state.tick++;

    // Update effect lifetimes
    updateEffectLifetimes(state);

    // Compute screen shake offset
    computeShakeOffset(state);

    // Clear canvas
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw UI layers (no shake)
    drawTurnOrderStrip(state);
    drawMessageBar(state);

    // Save for shake translate
    ctx.save();
    ctx.translate(shakeOffsetX, shakeOffsetY);

    // Arena content (with shake)
    drawStarfield(state.tick);
    drawArenaCircle();
    drawRpgVisualEffects(state, state.tick, 'behind');
    drawShips(state);
    drawRpgVisualEffects(state, state.tick, 'front');
    drawParticles(state);
    drawHPBars(state);

    // Restore from shake
    ctx.restore();
  }

  function updateEffectLifetimes(state) {
    // Decrement visual effects
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

    // Move and decay particles
    for (var j = state.particles.length - 1; j >= 0; j--) {
      var p = state.particles[j];
      p.x += p.dx;
      p.y += p.dy;
      p.dx *= 0.96;
      p.dy *= 0.96;
      p.lifetime--;
      if (p.lifetime <= 0) {
        state.particles.splice(j, 1);
      }
    }
  }

  function computeShakeOffset(state) {
    if (state.shakeFrames > 0) {
      state.shakeFrames--;
      shakeOffsetX = (Math.random() * 2 - 1) * state.shakeIntensity;
      shakeOffsetY = (Math.random() * 2 - 1) * state.shakeIntensity;
    } else {
      shakeOffsetX = 0;
      shakeOffsetY = 0;
    }
  }

  function drawStarfield(tick) {
    stars.forEach(function (star) {
      var twinkle = Math.sin(tick * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.5;
      var brightness = star.brightness * twinkle;
      var alpha = brightness * (star.layer === 'far' ? 0.3 : 0.6);

      ctx.fillStyle = 'rgba(200, 200, 255, ' + alpha + ')';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawArenaCircle() {
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;
    var radius = 250;

    ctx.strokeStyle = 'rgba(100, 100, 150, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawRpgVisualEffects(state, tick, layerName) {
    state.visualEffects.forEach(function (ve) {
      var effectLayer = ve.layer || 'behind';
      if (effectLayer !== layerName) return;

      var progress = 1 - (ve.lifetime / ve.maxLifetime);
      var alpha = ve.alpha !== undefined ? ve.alpha * (1 - progress) : 1 - progress;

      ctx.globalAlpha = Math.max(0, alpha);

      switch (ve.type) {
        case 'expanding_ring':
          ctx.beginPath();
          ctx.arc(ve.x, ve.y, Math.max(1, ve.radius || 0), 0, Math.PI * 2);
          ctx.strokeStyle = ve.color;
          ctx.lineWidth = ve.lineWidth || 2;
          ctx.stroke();
          break;

        case 'fading_disc':
          ctx.beginPath();
          ctx.arc(ve.x, ve.y, ve.radius || 0, 0, Math.PI * 2);
          ctx.fillStyle = ve.color;
          ctx.fill();
          break;

        case 'bolt':
          ctx.strokeStyle = ve.color;
          ctx.lineWidth = ve.lineWidth || 2;
          var boltLength = ve.length || 100;
          var bx1 = ve.x + Math.cos(ve.angle + 0.3) * boltLength * 0.4;
          var by1 = ve.y + Math.sin(ve.angle + 0.3) * boltLength * 0.4;
          var bx2 = ve.x + Math.cos(ve.angle - 0.2) * boltLength * 0.7;
          var by2 = ve.y + Math.sin(ve.angle - 0.2) * boltLength * 0.7;
          var bx3 = ve.x + Math.cos(ve.angle) * boltLength;
          var by3 = ve.y + Math.sin(ve.angle) * boltLength;
          ctx.beginPath();
          ctx.moveTo(ve.x, ve.y);
          ctx.lineTo(bx1, by1);
          ctx.lineTo(bx2, by2);
          ctx.lineTo(bx3, by3);
          ctx.stroke();
          break;

        case 'swirl_line':
          var swirlAngle = (ve.angleOffset || 0) + progress * Math.PI * 2;
          var swirlRadius = (ve.radius || 0) * progress;
          ctx.strokeStyle = ve.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ve.x, ve.y);
          ctx.lineTo(
            ve.x + Math.cos(swirlAngle) * swirlRadius,
            ve.y + Math.sin(swirlAngle) * swirlRadius
          );
          ctx.stroke();
          break;

        case 'ship_glow':
          var glowShip = ve.shipRef;
          if (glowShip) {
            var glowAlpha = alpha;
            ctx.globalAlpha = glowAlpha;
            ctx.beginPath();
            ctx.arc(glowShip.renderX, glowShip.renderY, ve.glowRadius || 40, 0, Math.PI * 2);
            ctx.strokeStyle = ve.color;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.globalAlpha = Math.max(0, alpha);
          }
          break;

        case 'overdrive_aura':
          var ovShip = ve.shipRef;
          if (ovShip) {
            var pulseAlpha = Math.sin(tick * (ve.pulseSpeed || 5) * 0.1) * 0.4 + 0.6;
            ctx.globalAlpha = alpha * pulseAlpha;
            ctx.beginPath();
            ctx.arc(ovShip.renderX, ovShip.renderY, 40, 0, Math.PI * 2);
            ctx.fillStyle = ve.color;
            ctx.shadowColor = ve.color;
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          break;

        // RPG-specific effects
        case 'beam':
          ctx.strokeStyle = ve.color;
          ctx.lineWidth = ve.lineWidth || 6;
          ctx.shadowColor = ve.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(ve.x, ve.y);
          ctx.lineTo(ve.toX, ve.toY);
          ctx.stroke();
          ctx.shadowBlur = 0;
          break;

        case 'hit_flash':
          var flashRadius = ve.radius * (ve.lifetime / ve.maxLifetime);
          ctx.beginPath();
          ctx.arc(ve.x, ve.y, Math.max(1, flashRadius), 0, Math.PI * 2);
          ctx.fillStyle = ve.color;
          ctx.fill();
          break;

        case 'charge_ring':
          var chargeShip = ve.shipRef;
          var chargeCx = chargeShip ? chargeShip.renderX : ve.x;
          var chargeCy = chargeShip ? chargeShip.renderY : ve.y;
          var chargeProgress = 1 - (ve.lifetime / ve.maxLifetime);
          var chargeRadius = (ve.targetRadius || 0) * chargeProgress;
          var chargeAlpha = ve.alpha * (1 - chargeProgress);
          ctx.globalAlpha = chargeAlpha;
          ctx.beginPath();
          ctx.arc(chargeCx, chargeCy, Math.max(1, chargeRadius), 0, Math.PI * 2);
          ctx.strokeStyle = ve.color;
          ctx.lineWidth = ve.lineWidth || 2;
          ctx.stroke();
          break;
      }
    });

    ctx.globalAlpha = 1;
  }

  function drawShips(state) {
    state.ships.forEach(function (ship) {
      if (!ship.alive) {
        ctx.globalAlpha = 0.2;
      } else {
        ctx.globalAlpha = 1;
      }

      var scale = ship.displayScale || 1.0;
      var spriteSize = 64; // cached sprites are 64x64

      ctx.save();
      ctx.translate(ship.renderX, ship.renderY);
      ctx.scale(scale, scale);
      ctx.rotate(ship.heading + Math.PI / 2);

      // Get sprite from cache
      var spriteCache = Renderer.spriteCache || {};
      var sprites = spriteCache[ship.config.team];
      if (sprites && sprites.length > 0) {
        var step = Math.round((ship.heading / (Math.PI * 2)) * 36) % 36;
        var spriteCanvas = sprites[step];
        ctx.drawImage(spriteCanvas, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
      }

      ctx.restore();
    });

    ctx.globalAlpha = 1;
  }

  function drawParticles(state) {
    state.particles.forEach(function (p) {
      var pct = p.lifetime / p.maxLifetime;
      ctx.globalAlpha = pct * 0.7;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }

  function drawHPBars(state) {
    state.ships.forEach(function (ship) {
      var x = ship.homeX - 50;
      var y = ship.homeY - 55;
      var w = 100;
      var h = 10;

      // Background
      ctx.fillStyle = '#111';
      ctx.fillRect(x, y, w, h);

      // Fill
      var pct = ship.displayHP / ship.maxHP;
      var fillColor = pct > 0.5 ? '#44ff44' : pct > 0.25 ? '#ffaa00' : '#ff4444';
      if (!ship.alive) fillColor = '#333';

      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, w * Math.max(0, pct), h);

      // Border
      ctx.strokeStyle = ship.isActive ? ship.config.color : '#333';
      ctx.lineWidth = ship.isActive ? 2 : 1;
      ctx.strokeRect(x, y, w, h);

      // Name label
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = ship.alive ? ship.config.color : '#555';
      ctx.fillText(ship.config.name.toUpperCase(), ship.homeX, y - 4);

      // Shield icon
      ctx.beginPath();
      ctx.arc(x - 6, y + 5, 4, 0, Math.PI * 2);
      ctx.fillStyle = ship.alive ? ship.config.color : '#333';
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function drawTurnOrderStrip(state) {
    // Background bar
    ctx.fillStyle = 'rgba(10,10,26,0.85)';
    ctx.fillRect(0, 0, canvas.width, 40);

    // Bottom border
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(canvas.width, 40);
    ctx.stroke();

    // Label
    ctx.font = '8px monospace';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'left';
    ctx.fillText('TURN ORDER', 8, 25);

    // Draw ship dots in turn queue order
    var startX = 120;
    var dotSpacing = 44;

    state.turnQueue.forEach(function (ship, i) {
      var dotX = startX + i * dotSpacing;
      var dotY = 20;
      var isActive = ship === state.activeShip;
      var r = isActive ? 13 : 9;

      if (!ship.alive) {
        // Dead: dim X
        ctx.beginPath();
        ctx.arc(dotX, dotY, r, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.stroke();

        // X mark
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(dotX - 5, dotY - 5);
        ctx.lineTo(dotX + 5, dotY + 5);
        ctx.moveTo(dotX + 5, dotY - 5);
        ctx.lineTo(dotX - 5, dotY + 5);
        ctx.stroke();
      } else {
        // Alive ship dot
        ctx.beginPath();
        ctx.arc(dotX, dotY, r, 0, Math.PI * 2);
        ctx.fillStyle = ship.config.color;
        ctx.globalAlpha = isActive ? 1.0 : 0.45;
        ctx.fill();
        ctx.globalAlpha = 1;

        if (isActive) {
          // Bright ring around active ship
          ctx.beginPath();
          ctx.arc(dotX, dotY, r + 3, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    });
  }

  function drawMessageBar(state) {
    // Background bar
    ctx.fillStyle = 'rgba(10,10,26,0.9)';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Top border
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 50);
    ctx.lineTo(canvas.width, canvas.height - 50);
    ctx.stroke();

    // Message text
    if (state.battleMessage) {
      ctx.globalAlpha = state.messageAlpha;
      ctx.font = '10px monospace';
      ctx.fillStyle = '#00ccff';
      ctx.textAlign = 'center';
      ctx.fillText(state.battleMessage, canvas.width / 2, canvas.height - 20);
      ctx.globalAlpha = 1;
    }
  }

  // Expose spriteCache reference for ship drawing
  function setSpriteCache(cache) {
    // This is handled by accessing Renderer.spriteCache directly in drawShips
  }

  return {
    init: init,
    startLoop: startLoop,
    stopLoop: stopLoop
  };
})();
