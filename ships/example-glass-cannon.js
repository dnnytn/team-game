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
    [null,null,null,null,null,null,null,"#e33",null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,"#e33","#f55","#e33",null,null,null,null,null,null,null],
    [null,null,null,null,null,"#c22","#e33","#f77","#e33","#c22",null,null,null,null,null,null],
    [null,null,null,null,null,"#c22","#e33","#f99","#e33","#c22",null,null,null,null,null,null],
    [null,null,null,null,"#a11","#c22","#e33","#f99","#e33","#c22","#a11",null,null,null,null,null],
    [null,null,null,null,"#a11","#c22","#f55","#fbb","#f55","#c22","#a11",null,null,null,null,null],
    [null,null,null,"#811","#a11","#c22","#f55","#fdd","#f55","#c22","#a11","#811",null,null,null,null],
    [null,null,"#600","#811","#a11","#c22","#f77","#fff","#f77","#c22","#a11","#811","#600",null,null,null],
    [null,"#400","#600","#811","#a11","#c22","#f77","#fff","#f77","#c22","#a11","#811","#600","#400",null,null],
    [null,null,"#600","#811","#a11","#c22","#f55","#f99","#f55","#c22","#a11","#811","#600",null,null,null],
    [null,null,null,null,"#a11","#c22","#e33","#f55","#e33","#c22","#a11",null,null,null,null,null],
    [null,null,null,null,null,"#c22","#e33","#f33","#e33","#c22",null,null,null,null,null,null],
    [null,null,null,null,null,"#a11","#c22","#c22","#c22","#a11",null,null,null,null,null,null],
    [null,null,null,null,"#811","#fa0","#fc0","#a11","#fc0","#fa0","#811",null,null,null,null,null],
    [null,null,null,null,null,"#f80","#fa0",null,"#fa0","#f80",null,null,null,null,null,null],
    [null,null,null,null,null,null,"#f60",null,"#f60",null,null,null,null,null,null,null],
  ]
});
