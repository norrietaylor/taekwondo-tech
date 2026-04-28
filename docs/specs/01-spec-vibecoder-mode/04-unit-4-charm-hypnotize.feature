# Source: docs/specs/01-spec-vibecoder-mode/01-spec-vibecoder-mode.md
# Pattern: Web/UI + State + Async (cooldown, timed expiry, AI mode switch)
# Recommended test type: E2E (Playwright driving keys, asserting per-enemy state)

Feature: Charm hypnotize ability with cooldown

  Scenario: Charm fires only when cooldown is clear and form is computer (R4.1)
    Given the player is wearing VibeCoder in computer form
    And `player.transformer.charmCooldownMs` equals 0
    When the player presses the X key
    Then `player.transformer.charmCooldownMs` is set to 4000
    And at least one enemy within range has `charmed === true`

  Scenario: Charm only affects enemies within 250px of the player (R4.2)
    Given the player is in computer form with an enemy A at distance 100px and an enemy B at distance 400px
    When the player presses X
    Then enemy A has `charmed === true` and `charmExpiresAt` approximately `Date.now() + 8000`
    And enemy B has `charmed === false` and no `charmExpiresAt` set
    And a spinning spiral graphic is attached above enemy A

  Scenario: Charmed enemies attack other uncharmed enemies (R4.3)
    Given two enemies are within 250px of the player and one additional uncharmed enemy is across the level
    When the player presses X to charm the two nearby enemies
    Then within one update tick each charmed enemy's AI target reference points at the remaining uncharmed enemy
    And neither charmed enemy is targeting the player

  Scenario: Charm wears off after 8 seconds (R4.4)
    Given an enemy was charmed at time T
    When the test advances simulated game time to T plus 8100ms
    Then the enemy's `charmed` flag is false
    And the spiral graphic previously attached above the enemy has been destroyed
    And the enemy resumes its prior AI state (patrol or chase)

  Scenario: Charm cooldown blocks re-trigger for 4 seconds (R4.5)
    Given the player has just successfully charmed enemies (charmCooldownMs = 4000)
    When the player presses X again 1000ms later
    Then no additional enemies become charmed and `charmCooldownMs` continues counting down
    When the player presses X again at 4500ms after the first activation
    Then the second activation succeeds and `charmCooldownMs` is reset to 4000

  Scenario: Charm key has no effect in robot form (R4.6)
    Given the player is wearing VibeCoder in robot form with enemies within 250px
    When the player presses X
    Then no enemy has `charmed === true`
    And `player.transformer.charmCooldownMs` remains 0
