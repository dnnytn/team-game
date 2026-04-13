/**
 * Renderer - Canvas 2D rendering: starfield, ships, projectiles, particles, HUD, effects.
 */
var Renderer = (function () {
  var canvas, ctx;
  var stars = [];
  var spriteCache = {}; // team -> array of rotated canvases
  var SPRITE_SCALE = 4; // 16px * 4 = 64px on screen
  var ROTATION_STEPS = 36; // Pre-cache 36 rotations (every 10 degrees)

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Generate starfield
    stars = [];
    for (var i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() < 0.3 ? 2 : 1,
        brightness: 0.3 + Math.random() * 0.7,
        layer: Math.random() < 0.5 ? 1 : 2, // Parallax layers
        twinkleSpeed: 0.02 + Math.random() * 0.03,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  function cacheShipSprites(shipConfigs) {
    shipConfigs.forEach(function (config) {
      if (spriteCache[config.team]) return;

      // Create base sprite on an offscreen canvas
      var baseCanvas = document.createElement('canvas');
      baseCanvas.width = 16;
      baseCanvas.height = 16;
      var baseCtx = baseCanvas.getContext('2d');

      for (var r = 0; r < 16; r++) {
        for (var c = 0; c < 16; c++) {
          var color = config.sprite[r] && config.sprite[r][c];
          if (color) {
            baseCtx.fillStyle = color;
            baseCtx.fillRect(c, r, 1, 1);
          }
        }
      }

      // Pre-render rotations
      var rotations = [];
      var size = 16 * SPRITE_SCALE;
      for (var step = 0; step < ROTATION_STEPS; step++) {
        var angle = (step / ROTATION_STEPS) * Math.PI * 2;
        var rotCanvas = document.createElement('canvas');
        rotCanvas.width = size;
        rotCanvas.height = size;
        var rotCtx = rotCanvas.getContext('2d');
        rotCtx.imageSmoothingEnabled = false;
        rotCtx.translate(size / 2, size / 2);
        // Offset by -PI/2 because sprites face UP by default, but heading 0 = right
        rotCtx.rotate(angle + Math.PI / 2);
        rotCtx.drawImage(baseCanvas, -size / 2, -size / 2, size, size);
        rotations.push(rotCanvas);
      }
      spriteCache[config.team] = rotations;
    });
  }

  function render(state, tick) {
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawStarfield(tick);
    drawMines(state);
    drawVisualEffects(state, tick);
    drawProjectiles(state);
    drawAbilityEffects(state);
    drawShips(state);
    drawParticles(state);
    drawShipLabels(state);
  }

  function drawStarfield(tick) {
    stars.forEach(function (star) {
      var twinkle = Math.sin(tick * star.twinkleSpeed + star.twinklePhase);
      var alpha = star.brightness * (0.7 + twinkle * 0.3);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
  }

  function drawShips(state) {
    state.ships.forEach(function (ship) {
      if (!ship.alive) return;

      var spriteSize = 16 * SPRITE_SCALE;

      // Cloaked ships
      if (ship.cloaked) {
        ctx.globalAlpha = 0.15;
      }

      // Overdrive tint
      if (ship.overdriveActive) {
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 15;
      }

      // Draw shield ring
      var shieldPct = ship.currentShields / ship.maxShields;
      if (shieldPct > 0) {
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, spriteSize / 2 + 4, 0, Math.PI * 2 * shieldPct);
        ctx.strokeStyle = ship.config.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = ship.cloaked ? 0.1 : 0.5;
        ctx.stroke();
        ctx.globalAlpha = ship.cloaked ? 0.15 : 1;
      }

      // Invulnerability glow
      if (ship.invulnerable > 0) {
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, spriteSize / 2 + 8, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 * (ship.invulnerable / 10);
        ctx.stroke();
        ctx.globalAlpha = ship.cloaked ? 0.15 : 1;
      }

      // Draw sprite
      var rotations = spriteCache[ship.config.team];
      if (rotations) {
        var heading = ship.heading;
        while (heading < 0) heading += Math.PI * 2;
        var step = Math.round((heading / (Math.PI * 2)) * ROTATION_STEPS) % ROTATION_STEPS;
        var spriteImg = rotations[step];
        ctx.drawImage(spriteImg, ship.x - spriteSize / 2, ship.y - spriteSize / 2);
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    });
  }

  function drawShipLabels(state) {
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    state.ships.forEach(function (ship) {
      if (!ship.alive || ship.cloaked) return;
      ctx.fillStyle = ship.config.color;
      ctx.fillText(ship.config.name, ship.x, ship.y - 38);
    });
  }

  function drawProjectiles(state) {
    state.projectiles.forEach(function (proj) {
      var len = 4;
      ctx.beginPath();
      ctx.moveTo(proj.x, proj.y);
      ctx.lineTo(proj.x - proj.dx * 0.8, proj.y - proj.dy * 0.8);
      ctx.strokeStyle = proj.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bright head
      ctx.fillStyle = '#fff';
      ctx.fillRect(proj.x - 1, proj.y - 1, 2, 2);
    });
  }

  function drawParticles(state) {
    state.particles.forEach(function (p) {
      var alpha = p.lifetime / p.maxLifetime;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      var size = p.size * alpha;
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
    });
    ctx.globalAlpha = 1;
  }

  function drawMines(state) {
    state.mines.forEach(function (mine) {
      var blink = Math.sin(Date.now() * 0.01) > 0;
      ctx.beginPath();
      ctx.arc(mine.x, mine.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = mine.armed ? (blink ? '#ff0000' : '#880000') : '#444';
      ctx.fill();

      if (mine.armed) {
        ctx.beginPath();
        ctx.arc(mine.x, mine.y, mine.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }

  function drawVisualEffects(state, tick) {
    if (!state.visualEffects) return;
    state.visualEffects.forEach(function (ve) {
      var progress = 1 - (ve.lifetime / ve.maxLifetime);
      var alpha = ve.alpha !== undefined ? ve.alpha * (1 - progress) : (1 - progress);

      switch (ve.type) {

        case 'expanding_ring':
          ctx.beginPath();
          ctx.arc(ve.x, ve.y, Math.max(1, ve.radius), 0, Math.PI * 2);
          ctx.strokeStyle = ve.color;
          ctx.lineWidth = ve.lineWidth || 2;
          ctx.globalAlpha = alpha;
          ctx.stroke();
          ctx.globalAlpha = 1;
          break;

        case 'fading_disc':
          ctx.beginPath();
          ctx.arc(ve.x, ve.y, ve.radius, 0, Math.PI * 2);
          ctx.fillStyle = ve.color;
          ctx.globalAlpha = ve.alpha * (1 - progress);
          ctx.fill();
          ctx.globalAlpha = 1;
          break;

        case 'bolt':
          var boltAlpha = alpha * ve.alpha;
          ctx.globalAlpha = boltAlpha;
          ctx.strokeStyle = ve.color;
          ctx.lineWidth = ve.lineWidth || 1.5;
          ctx.beginPath();
          ctx.moveTo(ve.x, ve.y);
          var seg1x = ve.x + Math.cos(ve.angle + 0.3) * ve.length * 0.4;
          var seg1y = ve.y + Math.sin(ve.angle + 0.3) * ve.length * 0.4;
          var seg2x = ve.x + Math.cos(ve.angle - 0.2) * ve.length * 0.7;
          var seg2y = ve.y + Math.sin(ve.angle - 0.2) * ve.length * 0.7;
          var endX = ve.x + Math.cos(ve.angle) * ve.length;
          var endY = ve.y + Math.sin(ve.angle) * ve.length;
          ctx.lineTo(seg1x, seg1y);
          ctx.lineTo(seg2x, seg2y);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.globalAlpha = 1;
          break;

        case 'swirl_line':
          var swirlAngle = ve.angleOffset + progress * Math.PI * 2;
          var swirlAlpha = (1 - progress) * 0.8;
          ctx.globalAlpha = swirlAlpha;
          ctx.strokeStyle = ve.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ve.x, ve.y);
          ctx.lineTo(
            ve.x + Math.cos(swirlAngle) * ve.radius * progress,
            ve.y + Math.sin(swirlAngle) * ve.radius * progress
          );
          ctx.stroke();
          ctx.globalAlpha = 1;
          break;

        case 'ship_glow':
          if (!ve.shipRef || !ve.shipRef.alive) break;
          var glowAlpha = (1 - progress) * ve.alpha;
          ctx.beginPath();
          ctx.arc(ve.shipRef.x, ve.shipRef.y, ve.glowRadius, 0, Math.PI * 2);
          ctx.strokeStyle = ve.color;
          ctx.lineWidth = 4;
          ctx.globalAlpha = glowAlpha;
          ctx.stroke();
          ctx.globalAlpha = 1;
          break;

        case 'overdrive_aura':
          if (!ve.shipRef || !ve.shipRef.alive) break;
          var pulseAlpha = 0.3 + Math.sin(tick * (ve.pulseSpeed || 0.4)) * 0.2;
          ctx.shadowColor = ve.color;
          ctx.shadowBlur = 20 + Math.sin(tick * 0.3) * 8;
          ctx.beginPath();
          ctx.arc(ve.shipRef.x, ve.shipRef.y, 28, 0, Math.PI * 2);
          ctx.fillStyle = ve.color;
          ctx.globalAlpha = pulseAlpha * 0.4;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
          break;
      }
    });
  }

  function drawAbilityEffects(state) {
    state.abilityEffects.forEach(function (effect) {
      switch (effect.type) {
        case 'shield_burst':
          // Blue pulse ring
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(68, 136, 255, 0.6)';
          ctx.lineWidth = 3;
          ctx.stroke();
          break;

        case 'emp_blast':
          // Expanding blue circle
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(68, 136, 255, 0.15)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(68, 136, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();
          break;

        case 'teleport':
          // Warp lines at origin
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(effect.fromX, effect.fromY);
            ctx.lineTo(
              effect.fromX + Math.cos(angle) * 30,
              effect.fromY + Math.sin(angle) * 30
            );
            ctx.stroke();
          }
          // Flash at destination
          ctx.beginPath();
          ctx.arc(effect.toX, effect.toY, 20, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fill();
          break;

        case 'cloak':
          // Shimmer at position
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, 25, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(100, 100, 200, 0.2)';
          ctx.fill();
          break;

        case 'overdrive':
          // Red flash
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, 20, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 68, 0, 0.3)';
          ctx.fill();
          break;

        case 'mine_layer':
          // Small flash
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, 10, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
          ctx.fill();
          break;
      }
    });
  }

  function renderSprite(config, targetCanvas, scale) {
    var size = 16 * (scale || 1);
    targetCanvas.width = size;
    targetCanvas.height = size;
    var tCtx = targetCanvas.getContext('2d');
    tCtx.imageSmoothingEnabled = false;

    var pxSize = scale || 1;
    for (var r = 0; r < 16; r++) {
      for (var c = 0; c < 16; c++) {
        var color = config.sprite[r] && config.sprite[r][c];
        if (color) {
          tCtx.fillStyle = color;
          tCtx.fillRect(c * pxSize, r * pxSize, pxSize, pxSize);
        }
      }
    }
  }

  return {
    init: init,
    cacheShipSprites: cacheShipSprites,
    render: render,
    renderSprite: renderSprite
  };
})();
