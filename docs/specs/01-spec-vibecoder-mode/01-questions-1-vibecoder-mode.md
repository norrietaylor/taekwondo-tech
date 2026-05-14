# Clarifying Questions — VibeCoder Mode

## Round 1

**Q1: Unlock condition** — what does "unlock in all the levels" mean?
**A:** Unlocked on level 1 completion. Becomes selectable after the player finishes any single level.

**Q2: Spawn behavior** — what do chickens, ducks, and dog houses do?
**A:** Allies that attack enemies. Chickens/ducks waddle toward enemies and damage them; dog houses spawn dogs that chase enemies. Combat mini-pets.

**Q3: Hypnotize behavior** — what does it affect?
**A:** Charm enemies to follow. Enemies in radius become friendly and follow the player, attacking other enemies. Lasts a duration.

**Q4: "Challenge accepted" surfacing** — when and how?
**A:** On transform to computer + Text bubble only (no audio). Render a Phaser text/speech-bubble that fades out — consistent with the codebase having zero audio assets.

## Round 2

**Q5: Key bindings**
**A:** V transform, 1/2/3 spawn (1=chicken, 2=duck, 3=dog house), X hypnotize.

**Q6: Computer form mobility**
**A:** Stationary turret. Cannot move or jump while in computer form. Toggle back to robot to relocate.

**Q7: Ally limits and charm tuning**
**A:** Generous — 6 max active allies, 8s charm duration, 4s charm cooldown. Power-fantasy tuning.

**Q8: Architecture pattern**
**A:** Pioneer the refactored `Transformer` strategy base from the research report, then implement VibeCoder on top of it. Means an extra demoable unit up front to extract the base + migrate one existing transformer as proof of parity.
