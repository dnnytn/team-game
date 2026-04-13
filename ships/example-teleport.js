/**
 * Example Ship: Quantum Ghost
 * Strategy: Glass cannon that stays at low shields intentionally to trigger frequent teleports.
 * Extremely high speed keeps it elusive. Teleports away whenever damage is taken.
 * Special: Warp Jump - instantly teleport to a random safe location.
 */
ShipRegistry.register({
  name: "Quantum Ghost",
  team: "example-teleport",

  shields: 12,
  speed: 45,
  weaponPower: 30,
  ability: 13,

  specialAbility: "teleport",
  color: "#cc44ff",

  sprite: [
    [null,null,null,null,null,null,null,"#b3f",null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,"#93c","#d5f","#93c",null,null,null,null,null,null,null],
    [null,null,null,null,null,"#72a","#93c","#eaf","#93c","#72a",null,null,null,null,null,null],
    [null,null,null,null,null,"#72a","#93c","#fff","#93c","#72a",null,null,null,null,null,null],
    [null,null,null,null,"#519","#72a","#93c","#fff","#93c","#72a","#519",null,null,null,null,null],
    [null,null,null,"#308","#519","#72a","#b3f","#eaf","#b3f","#72a","#519","#308",null,null,null,null],
    [null,null,"#207","#308","#519","#72a","#b3f","#fff","#b3f","#72a","#519","#308","#207",null,null,null],
    [null,"#106","#207","#308","#519","#72a","#93c","#eaf","#93c","#72a","#519","#308","#207","#106",null,null],
    [null,"#106","#207","#308","#519","#72a","#93c","#eaf","#93c","#72a","#519","#308","#207","#106",null,null],
    [null,null,"#207","#308","#519","#72a","#b3f","#d5f","#b3f","#72a","#519","#308","#207",null,null,null],
    [null,null,null,"#308","#519","#72a","#72a","#93c","#72a","#72a","#519","#308",null,null,null,null],
    [null,null,null,null,"#519","#72a","#519","#72a","#519","#72a","#519",null,null,null,null,null],
    [null,null,null,null,"#308","#519","#308","#207","#308","#519","#308",null,null,null,null,null],
    [null,null,null,"#e6f","#d94","#eb0","#308","#106","#308","#eb0","#d94","#e6f",null,null,null,null],
    [null,null,null,null,"#e6f","#d94","#eb0",null,"#eb0","#d94","#e6f",null,null,null,null,null],
    [null,null,null,null,null,"#c6e","#d94",null,"#d94","#c6e",null,null,null,null,null,null],
  ]
});
