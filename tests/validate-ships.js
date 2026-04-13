/**
 * CI Ship Validation Script
 * Runs via: node tests/validate-ships.js
 *
 * Validates all ships in the registry:
 * 1. File exists and parses
 * 2. Config passes all validation rules
 * 3. Team name matches filename
 *
 * Exits with code 0 (pass) or 1 (fail).
 */

var vm = require('vm');
var fs = require('fs');
var path = require('path');

// Load shared validator
var validationCode = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'validation.js'),
  'utf-8'
);
var ShipValidator = {};
var validatorContext = vm.createContext({
  module: { exports: {} },
  Number: Number,
  Array: Array,
  Math: Math,
  console: console
});
vm.runInContext(validationCode, validatorContext);
ShipValidator = validatorContext.module.exports;

// Load registry
var registryPath = path.join(__dirname, '..', 'ships', 'registry.js');
var registryCode = fs.readFileSync(registryPath, 'utf-8');
var registryContext = vm.createContext({});
vm.runInContext(registryCode, registryContext);
var manifest = registryContext.SHIP_MANIFEST;

if (!Array.isArray(manifest) || manifest.length === 0) {
  console.error('ERROR: SHIP_MANIFEST is empty or not an array in ships/registry.js');
  process.exit(1);
}

console.log('Found ' + manifest.length + ' ship(s) in registry.\n');

var hasErrors = false;

manifest.forEach(function (filename) {
  var filepath = path.join(__dirname, '..', 'ships', filename);
  var expectedTeam = filename.replace(/\.js$/, '');

  console.log('Validating: ' + filename);

  // Check file exists
  if (!fs.existsSync(filepath)) {
    console.error('  FAIL: File not found: ships/' + filename);
    hasErrors = true;
    return;
  }

  // Load ship in sandboxed context
  var shipCode = fs.readFileSync(filepath, 'utf-8');
  var registeredConfig = null;
  var loadError = null;

  var shipContext = vm.createContext({
    ShipRegistry: {
      register: function (config) {
        registeredConfig = config;
        return true;
      }
    },
    console: console,
    Math: Math,
    Array: Array,
    Number: Number
  });

  try {
    vm.runInContext(shipCode, shipContext);
  } catch (e) {
    console.error('  FAIL: Parse/runtime error: ' + e.message);
    hasErrors = true;
    return;
  }

  if (!registeredConfig) {
    console.error('  FAIL: Ship file did not call ShipRegistry.register()');
    hasErrors = true;
    return;
  }

  // Check team matches filename
  if (registeredConfig.team !== expectedTeam) {
    console.error('  FAIL: team "' + registeredConfig.team + '" does not match filename "' + expectedTeam + '"');
    hasErrors = true;
  }

  // Run validation
  var errors = ShipValidator.validate(registeredConfig);
  if (errors.length > 0) {
    errors.forEach(function (e) {
      console.error('  FAIL: ' + e);
    });
    hasErrors = true;
  } else {
    console.log('  PASS: ' + registeredConfig.name + ' (' + registeredConfig.team + ')');
    console.log('    Stats: shields=' + registeredConfig.shields +
      ' speed=' + registeredConfig.speed +
      ' weapon=' + registeredConfig.weaponPower +
      ' ability=' + registeredConfig.ability +
      ' (sum=' + (registeredConfig.shields + registeredConfig.speed + registeredConfig.weaponPower + registeredConfig.ability) + ')');
    console.log('    Ability: ' + registeredConfig.specialAbility);
  }

  console.log('');
});

if (hasErrors) {
  console.error('VALIDATION FAILED - fix errors above before merging.');
  process.exit(1);
} else {
  console.log('ALL SHIPS VALID - ready to merge!');
  process.exit(0);
}
