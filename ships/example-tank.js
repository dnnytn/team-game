/**
 * Example Ship: The Ironclad
 * Strategy: Maximum shields and firepower, sacrificing speed.
 * A hulking fortress that absorbs damage and hits hard.
 * Special: Shield Burst - restores shields when low.
 */
ShipRegistry.register({
  name: "The Ironclad",
  team: "example-tank",

  shields: 40,
  speed: 10,
  weaponPower: 35,
  ability: 15,

  specialAbility: "shield_burst",
  color: "#4488ff",

  sprite: [
    [null,null,null,null,null,null,"#346","#346","#346","#346",null,null,null,null,null,null],
    [null,null,null,null,null,"#346","#48a","#48a","#48a","#48a","#346",null,null,null,null,null],
    [null,null,null,null,"#346","#48a","#5ac","#5ac","#5ac","#5ac","#48a","#346",null,null,null,null],
    [null,null,null,"#346","#48a","#5ac","#6ce","#6ce","#6ce","#6ce","#5ac","#48a","#346",null,null,null],
    [null,null,"#234","#346","#48a","#5ac","#6ce","#8ef","#8ef","#6ce","#5ac","#48a","#346","#234",null,null],
    [null,"#234","#346","#48a","#48a","#5ac","#6ce","#8ef","#8ef","#6ce","#5ac","#48a","#48a","#346","#234",null],
    ["#234","#346","#48a","#5ac","#5ac","#6ce","#8ef","#fff","#fff","#8ef","#6ce","#5ac","#5ac","#48a","#346","#234"],
    ["#234","#346","#48a","#5ac","#5ac","#6ce","#8ef","#fff","#fff","#8ef","#6ce","#5ac","#5ac","#48a","#346","#234"],
    ["#234","#346","#48a","#5ac","#5ac","#6ce","#8ef","#fff","#fff","#8ef","#6ce","#5ac","#5ac","#48a","#346","#234"],
    ["#234","#346","#48a","#5ac","#5ac","#6ce","#6ce","#8ef","#8ef","#6ce","#6ce","#5ac","#5ac","#48a","#346","#234"],
    [null,"#234","#346","#48a","#48a","#5ac","#5ac","#6ce","#6ce","#5ac","#5ac","#48a","#48a","#346","#234",null],
    [null,null,"#234","#346","#48a","#48a","#5ac","#5ac","#5ac","#5ac","#48a","#48a","#346","#234",null,null],
    [null,null,"#234","#346","#48a","#48a","#48a","#48a","#48a","#48a","#48a","#48a","#346","#234",null,null],
    [null,null,null,"#234","#f80","#fa0","#346","#48a","#48a","#346","#fa0","#f80","#234",null,null,null],
    [null,null,null,null,"#f60","#f80","#fa0","#346","#346","#fa0","#f80","#f60",null,null,null,null],
    [null,null,null,null,null,"#f40","#f60","#f80","#f80","#f60","#f40",null,null,null,null,null],
  ]
});
