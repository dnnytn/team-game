/**
 * ShipRegistry - Global ship registration API.
 * Ship module files call ShipRegistry.register() to add themselves.
 * The UI reads all registered ships via ShipRegistry.getAll().
 */
var ShipRegistry = (function () {
  var ships = [];

  return {
    register: function (config) {
      var errors = (typeof ShipValidator !== 'undefined')
        ? ShipValidator.validate(config)
        : [];
      if (errors.length > 0) {
        console.error('Ship "' + (config.name || 'unknown') + '" failed validation:');
        errors.forEach(function (e) { console.error('  - ' + e); });
        return false;
      }
      ships.push(config);
      console.log('Ship registered: ' + config.name + ' (' + config.team + ')');
      return true;
    },

    getAll: function () {
      return ships.slice();
    },

    getByTeam: function (team) {
      for (var i = 0; i < ships.length; i++) {
        if (ships[i].team === team) return ships[i];
      }
      return null;
    },

    count: function () {
      return ships.length;
    },

    reset: function () {
      ships = [];
    }
  };
})();
