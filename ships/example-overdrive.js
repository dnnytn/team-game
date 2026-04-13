/**
 * Example Ship: Blaze Fury
 * Strategy: Moderate across the board but becomes extremely dangerous during overdrive.
 * Double fire rate and projectile speed turns it into a tactical burst weapon.
 * High weapon power maximizes overdrive damage output.
 * Special: Weapon Overdrive - double fire rate and projectile speed.
 */
ShipRegistry.register({
  name: "Blaze Fury",
  team: "example-overdrive",

  shields: 22,
  speed: 20,
  weaponPower: 45,
  ability: 13,

  specialAbility: "overdrive",
  color: "#ff6600",

  sprite: [
    [null,null,null,null,null,"#622","#844","#844","#844","#622",null,null,null,null,null,null],
    [null,null,null,null,"#622","#844","#c66","#c66","#c66","#844","#622",null,null,null,null,null],
    [null,null,null,"#622","#844","#c66","#e88","#eaa","#e88","#c66","#844","#622",null,null,null,null],
    [null,null,"#622","#844","#c66","#e88","#faa","#fcc","#faa","#e88","#c66","#844","#622",null,null,null],
    ["#400","#622","#844","#c66","#e88","#faa","#fcc","#fff","#fcc","#faa","#e88","#c66","#844","#622","#400",null],
    ["#400","#622","#c66","#e88","#faa","#fcc","#fff","#fff","#fff","#fcc","#faa","#e88","#c66","#622","#400",null],
    ["#400","#622","#c66","#e88","#faa","#fcc","#fff","#fff","#fff","#fcc","#faa","#e88","#c66","#622","#400",null],
    [null,"#400","#622","#844","#c66","#e88","#faa","#fcc","#faa","#e88","#c66","#844","#622","#400",null,null],
    [null,null,"#400","#622","#844","#c66","#e88","#faa","#e88","#c66","#844","#622","#400",null,null,null],
    [null,null,null,"#400","#622","#844","#c66","#e88","#c66","#844","#622","#400",null,null,null,null],
    [null,null,null,null,"#400","#622","#844","#c66","#844","#622","#400",null,null,null,null,null],
    [null,null,null,"#400","#622","#622","#844","#844","#844","#622","#622","#400",null,null,null,null],
    [null,null,"#f80","#622","#844","#622","#400","#400","#400","#622","#844","#622","#f80",null,null,null],
    [null,"#ff0","#f80","#f60","#622","#400","#f80","#400","#f80","#400","#622","#f60","#f80","#ff0",null,null],
    [null,null,"#ff0","#f80","#f60","#f80","#ff0",null,"#ff0","#f80","#f60","#f80","#ff0",null,null,null],
    [null,null,null,"#ff0","#f80",null,"#f60",null,"#f60",null,"#f80","#ff0",null,null,null,null],
  ]
});
