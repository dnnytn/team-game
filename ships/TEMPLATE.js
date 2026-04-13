/**
 * Ship Module Template
 * ====================
 * Copy this file to ships/your-team-name.js and customize it.
 *
 * RULES:
 *   - shields + speed + weaponPower + ability must equal exactly 100
 *   - Each stat must be between 1 and 60
 *   - specialAbility must be one of:
 *       shield_burst, cloak, emp_blast, teleport, overdrive, mine_layer
 *   - sprite must be a 16x16 array of hex colors or null (transparent)
 *   - team must match your filename (e.g., file "my-team.js" → team: "my-team")
 *
 * TIP: Ask Claude Code to help you design your 16x16 pixel sprite!
 *      Try: "Generate a 16x16 pixel art spaceship array in hex colors"
 */
ShipRegistry.register({
  // Display name (max 24 characters)
  name: "YOUR SHIP NAME",

  // Must match your filename without .js extension
  team: "your-team-name",

  // --- Stats (must sum to exactly 100) ---
  shields: 25,       // Hit points / durability (1-60)
  speed: 25,         // Movement speed and agility (1-60)
  weaponPower: 25,   // Damage per hit and fire rate (1-60)
  ability: 25,       // Special ability power/duration (1-60)

  // --- Special Ability (pick ONE) ---
  // "shield_burst"  → Restore shields + brief damage reduction
  // "cloak"         → Go invisible; breaks when you fire
  // "emp_blast"     → Disable nearby enemies' weapons
  // "teleport"      → Warp to a random safe location
  // "overdrive"     → Double fire rate and projectile speed
  // "mine_layer"    → Drop proximity mines
  specialAbility: "shield_burst",

  // --- Ship Color (hex) - used for projectiles and HUD ---
  color: "#00ccff",

  // --- Pixel Art Sprite (16x16 grid) ---
  // null = transparent, "#rrggbb" or "#rgb" = colored pixel
  // Row 0 is the TOP of the sprite. Ship faces UP by default.
  // TIP: Ask Claude Code to generate this for you!
  sprite: [
    [null,null,null,null,null,null,null,"#fff",null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,"#fff","#fff","#fff",null,null,null,null,null,null,null],
    [null,null,null,null,null,"#fff","#ccc","#fff","#ccc","#fff",null,null,null,null,null,null],
    [null,null,null,null,null,"#ccc","#aaa","#ccc","#aaa","#ccc",null,null,null,null,null,null],
    [null,null,null,null,"#ccc","#aaa","#888","#aaa","#888","#aaa","#ccc",null,null,null,null,null],
    [null,null,null,null,"#ccc","#aaa","#888","#aaa","#888","#aaa","#ccc",null,null,null,null,null],
    [null,null,null,"#ccc","#aaa","#888","#666","#888","#666","#888","#aaa","#ccc",null,null,null,null],
    [null,null,null,"#ccc","#aaa","#888","#666","#888","#666","#888","#aaa","#ccc",null,null,null,null],
    [null,null,"#ccc","#aaa","#888","#666","#444","#666","#444","#666","#888","#aaa","#ccc",null,null,null],
    [null,null,"#ccc","#aaa","#888","#666","#444","#666","#444","#666","#888","#aaa","#ccc",null,null,null],
    [null,"#ccc","#aaa","#888","#666","#444","#444","#444","#444","#444","#666","#888","#aaa","#ccc",null,null],
    [null,"#ccc","#aaa","#888","#666","#666","#666","#666","#666","#666","#666","#888","#aaa","#ccc",null,null],
    [null,null,"#aaa","#888","#888","#888","#888","#888","#888","#888","#888","#888","#aaa",null,null,null],
    [null,null,null,"#888","#f80","#fa0","#888","#aaa","#888","#fa0","#f80","#888",null,null,null,null],
    [null,null,null,null,"#f60","#f80","#fa0",null,null,"#fa0","#f80","#f60",null,null,null,null],
    [null,null,null,null,null,"#f40","#f60",null,null,"#f60","#f40",null,null,null,null,null],
  ]
});
