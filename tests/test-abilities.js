/**
 * Test abilities triggering and loop detection in battle
 */

const fs = require('fs');
const { execSync } = require('child_process');
const vm = require('vm');

// Load validation module to understand ship structure
const validationCode = fs.readFileSync('./js/validation.js', 'utf8');
const abilitiesCode = fs.readFileSync('./js/abilities.js', 'utf8');
const aiCode = fs.readFileSync('./js/ai.js', 'utf8');
const engineCode = fs.readFileSync('./js/engine.js', 'utf8');

// Simplified game state for testing
const gameContext = {
  console: console,
  Math: Math,
  Infinity: Infinity,
  null: null,
  undefined: undefined,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
};

// Load registry API first
const registryApiCode = fs.readFileSync('./js/registry-api.js', 'utf8');
vm.runInNewContext(registryApiCode, gameContext);

// Execute modules in order
vm.runInNewContext(validationCode, gameContext);
vm.runInNewContext(abilitiesCode, gameContext);
vm.runInNewContext(aiCode, gameContext);
vm.runInNewContext(engineCode, gameContext);

const Abilities = gameContext.Abilities;
const BattleEngine = gameContext.BattleEngine;
const ShipAI = gameContext.ShipAI;

// Get ships from registry
const registryCode = fs.readFileSync('./ships/registry.js', 'utf8');

// Load ship configs
const exampleTankCode = fs.readFileSync('./ships/example-tank.js', 'utf8');
const exampleGlassCannon = fs.readFileSync('./ships/example-glass-cannon.js', 'utf8');

vm.runInNewContext(registryCode, gameContext);
vm.runInNewContext(exampleTankCode, gameContext);
vm.runInNewContext(exampleGlassCannon, gameContext);

const allShips = gameContext.ShipRegistry.getAll();
console.log(`\n🚀 Testing abilities with ${allShips.length} ships\n`);

// Initialize battle
const canvasWidth = 1024;
const canvasHeight = 768;
const shipConfigs = allShips.slice(0, 2); // Use 2 ships for testing

BattleEngine.init(shipConfigs, canvasWidth, canvasHeight);
const state = BattleEngine.getState();

let abilityTriggers = {};
let loopDetectionEvents = {};

// Track battle events
const tickListener = function(state) {
  // Check for ability activations
  state.ships.forEach(function(ship) {
    if (ship.abilityActive && !abilityTriggers[ship.config.team]) {
      abilityTriggers[ship.config.team] = {
        ability: ship.config.specialAbility,
        tick: state.tick,
        shields: ship.currentShields.toFixed(1),
      };
      console.log(`✓ [Tick ${state.tick}] ${ship.config.name} (${ship.config.team}) activated: ${ship.config.specialAbility}`);
    }

    // Check for loop detection
    if (ship.loopDetected && !loopDetectionEvents[ship.config.team]) {
      loopDetectionEvents[ship.config.team] = state.tick;
      console.log(`⚠ [Tick ${state.tick}] ${ship.config.name} detected in loop - breaking out`);
    }
  });

  // Check ability effects
  if (state.abilityEffects.length > 0) {
    state.abilityEffects.forEach(function(effect) {
      console.log(`  → Ability effect: ${effect.type}`);
    });
  }
};

const eliminationListener = function(ship, state) {
  console.log(`💥 [Tick ${state.tick}] ${ship.config.name} (${ship.config.team}) eliminated!`);
};

const battleEndListener = function(state) {
  console.log(`\n⚔️  Battle Complete at Tick ${state.tick}\n`);
  console.log('Ability Triggers Summary:');
  Object.keys(abilityTriggers).forEach(function(team) {
    const info = abilityTriggers[team];
    console.log(`  ${team}: ${info.ability} at tick ${info.tick} (shields: ${info.shields})`);
  });

  console.log('\nLoop Detection Summary:');
  Object.keys(loopDetectionEvents).forEach(function(team) {
    const tick = loopDetectionEvents[team];
    console.log(`  ${team}: detected at tick ${tick}`);
  });

  if (Object.keys(abilityTriggers).length === 0) {
    console.log('\n⚠️  WARNING: No abilities triggered during battle!');
  } else {
    console.log('\n✅ Abilities are triggering correctly!');
  }

  console.log('\nFinal eliminations order:');
  state.eliminations.forEach(function(e) {
    const status = e.winner ? '🏆 WINNER' : 'eliminated';
    console.log(`  ${e.name} (${e.team}) - ${status}`);
  });
};

// Start battle
BattleEngine.start({
  onTick: tickListener,
  onElimination: eliminationListener,
  onBattleEnd: battleEndListener
});

// Increase speed for testing
BattleEngine.setSpeed(10);
