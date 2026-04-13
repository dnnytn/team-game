/**
 * Example Ship: Phantom Strike
 * Strategy: Maximum speed and weapon power, paper-thin shields.
 * A deadly assassin that cloaks in, fires, and vanishes.
 * Special: Cloak - become invisible to ambush targets.
 */
ShipRegistry.register({
  name: "Phantom Strike",
  team: "example-glass-cannon",

  shields: 15,
  speed: 35,
  weaponPower: 40,
  ability: 10,

  specialAbility: "cloak",
  color: "#ff4466",

  sprite: [
    [null,null,null,null,null,null,null,"#f24",null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,"#f24","#f68","#f24",null,null,null,null,null,null,null],
    [null,null,null,null,null,"#d12","#f24","#f68","#f24","#d12",null,null,null,null,null,null],
    [null,null,null,null,null,"#d12","#f24","#f8a","#f24","#d12",null,null,null,null,null,null],
    [null,null,null,null,"#b01","#d12","#f24","#f8a","#f24","#d12","#b01",null,null,null,null,null],
    [null,null,null,null,"#b01","#d12","#f46","#fac","#f46","#d12","#b01",null,null,null,null,null],
    [null,null,null,"#901","#b01","#d12","#f46","#fce","#f46","#d12","#b01","#901",null,null,null,null],
    [null,null,"#700","#901","#b01","#d12","#f68","#fff","#f68","#d12","#b01","#901","#700",null,null,null],
    [null,"#500","#700","#901","#b01","#d12","#f68","#fff","#f68","#d12","#b01","#901","#700","#500",null,null],
    [null,null,"#700","#901","#b01","#d12","#f46","#f8a","#f46","#d12","#b01","#901","#700",null,null,null],
    [null,null,null,null,"#b01","#d12","#f24","#f68","#f24","#d12","#b01",null,null,null,null,null],
    [null,null,null,null,null,"#d12","#f24","#f46","#f24","#d12",null,null,null,null,null,null],
    [null,null,null,null,null,"#b01","#d12","#d12","#d12","#b01",null,null,null,null,null,null],
    [null,null,null,null,"#901","#f80","#fa0","#b01","#fa0","#f80","#901",null,null,null,null,null],
    [null,null,null,null,null,"#f60","#f80",null,"#f80","#f60",null,null,null,null,null,null],
    [null,null,null,null,null,null,"#f40",null,"#f40",null,null,null,null,null,null,null],
  ]
});
