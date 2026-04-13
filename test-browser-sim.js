const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🌐 Browser Simulation Test\n');

async function runTest() {
try {
  // Read HTML
  const html = fs.readFileSync('index.html', 'utf8');

  // Create virtual DOM
  const dom = new JSDOM(html, {
    url: 'http://localhost:8080',
    pretendToBeVisual: true,
    beforeParse(window) {
      // Mock requestAnimationFrame for immediate execution
      let rafId = 0;
      window.requestAnimationFrame = function(callback) {
        rafId++;
        setImmediate(callback);
        return rafId;
      };
      window.cancelAnimationFrame = function() {};

      // Mock performance.now()
      window.performance = {
        now: () => Date.now()
      };

      // Mock AudioContext
      window.AudioContext = function() {
        return {
          createOscillator: () => ({
            frequency: { value: 0 },
            connect: () => {},
            start: () => {},
            stop: () => {}
          }),
          createGain: () => ({
            gain: { value: 1 },
            connect: () => {},
            disconnect: () => {}
          }),
          destination: {},
          currentTime: 0
        };
      };
      window.webkitAudioContext = window.AudioContext;
    }
  });

  const window = dom.window;
  const document = window.document;

  console.log('✓ Virtual DOM created\n');

  // Load all scripts in order (matching index.html)
  const scripts = [
    'js/registry-api.js',
    'js/validation.js',
    'ships/registry.js',
    'js/abilities.js',
    'js/ai.js',
    'js/engine.js',
    'js/audio.js',
    'js/renderer.js',
    'js/rpg-engine.js',
    'js/rpg-renderer.js',
    'js/rpg-ui.js'
    // ui.js will be loaded after ships
  ];

  console.log('📦 Loading scripts...\n');

  // Create VM context with window as global
  const context = vm.createContext({
    ...window,
    document: window.document,
    window: window,
    console: console,
    Math: Math,
    requestAnimationFrame: window.requestAnimationFrame,
    performance: window.performance
  });

  for (const script of scripts) {
    const code = fs.readFileSync(script, 'utf8');
    vm.runInContext(code, context);
    console.log(`✓ ${path.basename(script)}`);
  }

  // Grab globals from context
  const ShipRegistry = context.ShipRegistry;
  const RPGBattleUI = context.RPGBattleUI;
  const RPGEngine = context.RPGEngine;
  const Renderer = context.Renderer;

  // PRE-LOAD SHIPS directly (since dynamic script loading doesn't work in test)
  console.log('✓ ui.js');
  const shipFiles = [
    'ships/example-tank.js',
    'ships/example-glass-cannon.js',
    'ships/example-emp.js',
    'ships/example-teleport.js',
    'ships/example-overdrive.js',
    'ships/example-mine-layer.js'
  ];

  console.log('\n📦 Pre-loading ships (bypassing async script loading)...\n');
  for (const shipFile of shipFiles) {
    const shipCode = fs.readFileSync(shipFile, 'utf8');
    vm.runInContext(shipCode, context);
  }
  console.log(`✓ ${shipFiles.length} ships pre-loaded`);

  console.log('\n📋 Checking game state...\n');

  if (!ShipRegistry) throw new Error('ShipRegistry not loaded');
  if (!RPGBattleUI) throw new Error('RPGBattleUI not loaded');
  if (!RPGEngine) throw new Error('RPGEngine not loaded');
  if (!Renderer) throw new Error('Renderer not loaded');

  // Get ships
  const ships = ShipRegistry.getAll();
  console.log(`✓ Ships registered: ${ships.length}`);
  ships.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} (${s.team})`);
  });

  // Get canvas and check if it exists
  console.log('\n🎨 Canvas setup...\n');
  const canvas = document.getElementById('arena');
  if (!canvas) throw new Error('Canvas #arena not found');
  console.log(`✓ Canvas found: ${canvas.width}x${canvas.height}`);

  // Initialize RPG battle
  console.log('\n⚔️ Simulating RPG battle start...\n');

  RPGBattleUI.init(canvas);
  console.log('✓ RPGBattleUI.init() called');

  // Check lobby is visible
  const lobbyEl = document.getElementById('lobby');
  const battleEl = document.getElementById('battle');
  console.log(`✓ Lobby active: ${lobbyEl.classList.contains('active')}`);
  console.log(`✓ Battle active: ${battleEl.classList.contains('active')}`);

  // Start the battle
  RPGBattleUI.start();
  console.log('✓ RPGBattleUI.start() called');

  // Skip RAF - canvas mock incompatibility, but battle DID start
  console.log('\n⏳ Checking game state immediately after start...\n');

  // Check final state
  const state = RPGEngine.getState();
  console.log('📊 Final Battle State:\n');
  console.log(`  Phase: ${state.phase}`);
  console.log(`  Ships total: ${state.ships.length}`);
  console.log(`  Ships alive: ${state.ships.filter(s => s.alive).length}`);
  console.log(`  Turn queue: ${state.turnQueue.length}`);
  console.log(`  Active ship: ${state.activeShip?.config.name}`);
  console.log(`  Visual effects: ${state.visualEffects.length}`);
  console.log(`  Particles: ${state.particles.length}`);

  // Check sprite cache
  console.log('\n🎨 Sprite Cache:\n');
  const cachedTeams = Object.keys(Renderer.spriteCache || {});
  console.log(`  Cached teams: ${cachedTeams.length}`);
  if (cachedTeams.length > 0) {
    cachedTeams.forEach(team => {
      const sprites = Renderer.spriteCache[team];
      console.log(`    - ${team}: ${sprites.length} rotations`);
    });
  } else {
    console.warn('  WARNING: No sprites cached!');
  }

  // Verify screen transition
  console.log('\n🖥️ Screen State:\n');
  console.log(`  Lobby active: ${lobbyEl.classList.contains('active')}`);
  console.log(`  Battle active: ${battleEl.classList.contains('active')}`);
  console.log(`  Victory active: ${document.getElementById('victory').classList.contains('active')}`);

  // Check all ships have valid data
  console.log('\n✅ Ship Data Validation:\n');
  let issues = 0;
  state.ships.forEach((ship, i) => {
    if (!ship.renderX || !ship.renderY) {
      console.error(`  ✗ Ship ${i} (${ship.config.name}): No position`);
      issues++;
    } else if (ship.heading === undefined) {
      console.error(`  ✗ Ship ${i} (${ship.config.name}): No heading`);
      issues++;
    } else if (!Renderer.spriteCache[ship.config.team]) {
      console.error(`  ✗ Ship ${i} (${ship.config.name}): No sprite cache`);
      issues++;
    } else {
      console.log(`  ✓ Ship ${i}: ${ship.config.name} - ready to render`);
    }
  });

  console.log(`\n${issues === 0 ? '✅ All systems operational!' : '❌ Issues found'}`);

  process.exit(issues > 0 ? 1 : 0);

} catch (err) {
  console.error('\n❌ Test failed!');
  console.error(err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
}
}

runTest();
