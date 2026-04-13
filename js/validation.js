/**
 * ShipValidator - Validates ship configuration objects.
 * Used by both the browser (at registration time) and CI (Node.js tests).
 */
var ShipValidator = (function () {
  var ALLOWED_ABILITIES = [
    'shield_burst',
    'cloak',
    'emp_blast',
    'teleport',
    'overdrive',
    'mine_layer'
  ];

  var POINT_BUDGET = 100;
  var STAT_MIN = 1;
  var STAT_MAX = 60;
  var SPRITE_SIZE = 16;
  var MAX_NAME_LENGTH = 24;
  var HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

  function validate(config) {
    var errors = [];

    if (!config || typeof config !== 'object') {
      return ['Config must be a non-null object'];
    }

    // Name
    if (typeof config.name !== 'string' || config.name.length === 0) {
      errors.push('name must be a non-empty string');
    } else if (config.name.length > MAX_NAME_LENGTH) {
      errors.push('name must be ' + MAX_NAME_LENGTH + ' characters or fewer (got ' + config.name.length + ')');
    }

    // Team
    if (typeof config.team !== 'string' || config.team.length === 0) {
      errors.push('team must be a non-empty string');
    }

    // Stats
    var stats = ['shields', 'speed', 'weaponPower', 'ability'];
    var total = 0;
    stats.forEach(function (stat) {
      var val = config[stat];
      if (typeof val !== 'number' || !Number.isInteger(val)) {
        errors.push(stat + ' must be an integer');
      } else if (val < STAT_MIN || val > STAT_MAX) {
        errors.push(stat + ' must be between ' + STAT_MIN + ' and ' + STAT_MAX + ' (got ' + val + ')');
      } else {
        total += val;
      }
    });

    if (total !== POINT_BUDGET && errors.length === 0) {
      errors.push('Stats must sum to exactly ' + POINT_BUDGET + ' (got ' + total + ')');
    }

    // Special Ability
    if (ALLOWED_ABILITIES.indexOf(config.specialAbility) === -1) {
      errors.push('specialAbility must be one of: ' + ALLOWED_ABILITIES.join(', ') + ' (got "' + config.specialAbility + '")');
    }

    // Sprite
    if (!Array.isArray(config.sprite)) {
      errors.push('sprite must be a ' + SPRITE_SIZE + 'x' + SPRITE_SIZE + ' array');
    } else if (config.sprite.length !== SPRITE_SIZE) {
      errors.push('sprite must have ' + SPRITE_SIZE + ' rows (got ' + config.sprite.length + ')');
    } else {
      for (var r = 0; r < config.sprite.length; r++) {
        var row = config.sprite[r];
        if (!Array.isArray(row) || row.length !== SPRITE_SIZE) {
          errors.push('sprite row ' + r + ' must have ' + SPRITE_SIZE + ' columns');
          break;
        }
        for (var c = 0; c < row.length; c++) {
          var cell = row[c];
          if (cell !== null && (typeof cell !== 'string' || !HEX_REGEX.test(cell))) {
            errors.push('sprite[' + r + '][' + c + '] must be null or a hex color (#rgb or #rrggbb)');
            break;
          }
        }
      }
    }

    // Color
    if (typeof config.color !== 'string' || !HEX_REGEX.test(config.color)) {
      errors.push('color must be a valid hex color string (#rgb or #rrggbb)');
    }

    return errors;
  }

  return {
    validate: validate,
    ALLOWED_ABILITIES: ALLOWED_ABILITIES,
    POINT_BUDGET: POINT_BUDGET,
    STAT_MIN: STAT_MIN,
    STAT_MAX: STAT_MAX,
    SPRITE_SIZE: SPRITE_SIZE
  };
})();

// Export for Node.js (CI tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShipValidator;
}
