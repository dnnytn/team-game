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
    [null,null,null,null,null,null,"#245","#245","#245","#245",null,null,null,null,null,null],
    [null,null,null,null,"#245","#25a","#37d","#37d","#37d","#37d","#25a","#245",null,null,null,null],
    [null,null,null,"#245","#25a","#37d","#49f","#49f","#49f","#49f","#37d","#25a","#245",null,null,null],
    [null,null,"#23a","#245","#25a","#37d","#49f","#5be","#5be","#49f","#37d","#25a","#245","#23a",null,null],
    [null,"#23a","#245","#37d","#37d","#49f","#5be","#7df","#7df","#5be","#49f","#37d","#37d","#245","#23a",null],
    ["#23a","#245","#37d","#49f","#49f","#5be","#7df","#9ff","#9ff","#7df","#5be","#49f","#49f","#37d","#245","#23a"],
    ["#23a","#245","#37d","#49f","#49f","#5be","#7df","#aff","#aff","#7df","#5be","#49f","#49f","#37d","#245","#23a"],
    ["#23a","#245","#37d","#49f","#49f","#5be","#7df","#aff","#aff","#7df","#5be","#49f","#49f","#37d","#245","#23a"],
    ["#23a","#245","#37d","#49f","#49f","#5be","#5be","#7df","#7df","#5be","#5be","#49f","#49f","#37d","#245","#23a"],
    [null,"#23a","#245","#37d","#37d","#49f","#49f","#5be","#5be","#49f","#49f","#37d","#37d","#245","#23a",null],
    [null,null,"#23a","#245","#25a","#37d","#49f","#49f","#49f","#49f","#37d","#25a","#245","#23a",null,null],
    [null,null,"#23a","#245","#25a","#37d","#37d","#37d","#37d","#37d","#37d","#25a","#245","#23a",null,null],
    [null,null,null,"#23a","#f80","#fc0","#245","#37d","#37d","#245","#fc0","#f80","#23a",null,null,null],
    [null,null,null,null,"#f70","#fb0","#fc0","#245","#245","#fc0","#fb0","#f70",null,null,null,null],
    [null,null,null,null,null,"#f50","#f70","#fb0","#fb0","#f70","#f50",null,null,null,null,null],
    [null,null,null,null,null,null,"#f40","#f60","#f60","#f40",null,null,null,null,null,null],
  ]
});
