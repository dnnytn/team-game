/**
 * Example Ship: Minefield Marshal
 * Strategy: Builds a denial zone with mines. Highest ability stat creates maximum mines with maximum damage.
 * Low speed and retreating playstyle lets it lay mines in its wake.
 * High shields allow it to absorb punishment while setting traps.
 * Special: Mine Layer - deploy protective mines that detonate on enemy contact.
 */
ShipRegistry.register({
  name: "Minefield Marshal",
  team: "example-mine-layer",

  shields: 35,
  speed: 10,
  weaponPower: 15,
  ability: 40,

  specialAbility: "mine_layer",
  color: "#ffaa00",

  sprite: [
    [null,null,null,null,null,"#540","#762","#762","#762","#540",null,null,null,null,null,null],
    [null,null,null,null,"#540","#762","#984","#9a4","#984","#762","#540",null,null,null,null,null],
    [null,null,null,"#540","#762","#984","#ba6","#db8","#ba6","#984","#762","#540",null,null,null,null],
    [null,null,"#540","#762","#984","#ba6","#db8","#fe0","#db8","#ba6","#984","#762","#540",null,null,null],
    [null,"#540","#762","#984","#ba6","#db8","#fe0","#fff","#fe0","#db8","#ba6","#984","#762","#540",null,null],
    ["#320","#540","#762","#984","#ba6","#db8","#fe0","#fe0","#fe0","#db8","#ba6","#984","#762","#540","#320",null],
    ["#320","#540","#762","#984","#ba6","#ba6","#db8","#fe0","#db8","#ba6","#ba6","#984","#762","#540","#320",null],
    ["#320","#540","#762","#984","#984","#ba6","#ba6","#db8","#ba6","#ba6","#984","#984","#762","#540","#320",null],
    [null,"#320","#540","#762","#762","#984","#984","#ba6","#984","#984","#762","#762","#540","#320",null,null],
    [null,null,"#320","#540","#540","#762","#984","#984","#984","#762","#540","#540","#320",null,null,null],
    [null,null,null,"#320","#320","#540","#762","#984","#762","#540","#320","#320",null,null,null,null],
    [null,null,"#fe0","#320","#540","#540","#762","#762","#762","#540","#540","#320","#fe0",null,null,null],
    ["#f80","#fe0","#320","#540","#320","#320","#540","#540","#540","#320","#320","#540","#320","#fe0","#f80",null],
    ["#f60","#f80","#fe0","#320","#f80","#fe0","#320","#320","#320","#fe0","#f80","#320","#fe0","#f80","#f60",null],
    [null,"#f60","#f80","#f60","#f80","#f60",null,null,null,"#f60","#f80","#f60","#f80","#f60",null,null],
    [null,null,"#f60",null,"#f60",null,null,null,null,null,"#f60",null,"#f60",null,null,null],
  ]
});
