import { std } from "wow/wotlk";

export const EXPLODING_BARREL_NPC = std.CreatureTemplates
    .create('default', 'exploding-barrel', 29737)
    .Name.enGB.set('Exploding Barrel')
    .Level.set(1)
    .Stats.HealthMod.set(0.12) // ~5 HP (BaseHealth * 0.12 ≈ 5)
    .Stats.ManaMod.set(0)
    .FactionTemplate.set(14) // Hostile/attackable
    .UnitFlags.IMMUNE_TO_PC.set(false)
    .UnitFlags.IMMUNE_TO_NPC.set(false)
    .UnitFlags.STUNNED.set(true) // Cannot move or rotate
    .FlagsExtra.NO_BLOCK.set(1)
    .FlagsExtra.NO_PARRY.set(1)
    .FlagsExtra.CANNOT_ENTER_COMBAT.set(1)
    .FlagsExtra.NO_MOVE_FLAGS_UPDATE.set(1)
    .RegenHealth.set(0)
    .AIName.NullAI()
    .Models.clearAll() // Remove all displays (including bunny 4626)
    .Models.addIds(25175); // Only use barrel display 25175

EXPLODING_BARREL_NPC.InlineScripts.OnDeath((creature: TSCreature, killer: TSUnit | undefined) => {
    const radius = 10;
    const damage = 50;

    const x = creature.GetX();
    const y = creature.GetY();

    // Cast explosion spell at the barrel's location
    // https://wotlkdb.com/?spell=60853
    killer?.CastSpell(creature, 60853, true);

    // hostile=0 => all, dead=0 => alive only
    const units = creature.GetUnitsInRange(radius, 0, 0);
    for (let i = 0; i < units.length; i++) {
        const u = units[i];
        if (u.IsNull()) continue;

        u.KnockbackFrom(x, y, 12, 6);

        // Deal damage. If we have a killer unit, use DealDamage for proper combat handling.
        // Otherwise, fall back to direct health reduction.
        if (killer && !killer.IsNull()) {
            killer.DealDamage(u, damage, false, SpellSchools.NORMAL);
        } else {
            const cur = u.GetHealth();
            const next = Math.max(0, cur - damage);
            u.SetHealth(next);
        }
    }

    creature.RemoveCorpse();
});
