/**
 * Example Ship: Thunder Striker
 * Strategy: Mid-range brawler who rushes into clusters and disables all weapons with EMP.
 * High ability stat maximizes EMP radius and duration; moderate shields let it survive close combat.
 * Special: EMP Blast - disables all enemy weapons and abilities in a wide radius.
 */
ShipRegistry.register({
  name: "Thunder Striker",
  team: "example-emp",

  shields: 20,
  speed: 25,
  weaponPower: 30,
  ability: 25,

  specialAbility: "emp_blast",
  color: "#00ddff",

  sprite: [
    [null,null,null,null,null,"#046","#08a","#08a","#08a","#046",null,null,null,null,null,null],
    [null,null,null,null,"#046","#08a","#0bf","#0cf","#0bf","#08a","#046",null,null,null,null,null],
    [null,null,null,"#046","#08a","#0bf","#0ef","#0ff","#0ef","#0bf","#08a","#046",null,null,null,null],
    [null,null,"#046","#08a","#0bf","#0ef","#0ff","#fff","#0ff","#0ef","#0bf","#08a","#046",null,null,null],
    [null,"#fc0","#08a","#0bf","#0ef","#0ff","#fff","#fff","#fff","#0ff","#0ef","#0bf","#08a","#fc0",null,null],
    ["#fc0","#ff0","#0bf","#0ef","#0ff","#fff","#aff","#cff","#aff","#fff","#0ff","#0ef","#0bf","#ff0","#fc0",null],
    ["#fc0","#ff0","#0bf","#0ef","#0ff","#fff","#aff","#cff","#aff","#fff","#0ff","#0ef","#0bf","#ff0","#fc0",null],
    [null,"#fc0","#08a","#0bf","#0ef","#0ff","#fff","#aff","#fff","#0ff","#0ef","#0bf","#08a","#fc0",null,null],
    [null,null,"#046","#08a","#0bf","#0ef","#0ef","#0ff","#0ff","#0ef","#0ef","#0bf","#08a","#046",null,null],
    [null,null,null,"#046","#08a","#0bf","#0ef","#0ef","#0ef","#0ef","#0bf","#08a","#046",null,null,null],
    [null,null,null,null,"#046","#08a","#0bf","#0bf","#0bf","#0bf","#08a","#046",null,null,null,null],
    [null,null,null,null,"#046","#08a","#08a","#08a","#08a","#08a","#08a","#046",null,null,null,null],
    [null,null,null,"#035","#046","#08a","#046","#035","#035","#046","#08a","#046","#035",null,null,null],
    [null,null,null,null,"#ff0","#fc0","#08a","#046","#046","#08a","#fc0","#ff0",null,null,null,null],
    [null,null,null,null,null,"#fa0","#fc0","#ff0","#ff0","#fc0","#fa0",null,null,null,null,null],
    [null,null,null,null,null,null,"#f80","#fa0","#fa0","#f80",null,null,null,null,null,null],
  ]
});
