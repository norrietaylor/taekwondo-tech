# Source: docs/specs/01-spec-vibecoder-mode/01-spec-vibecoder-mode.md
# Pattern: Web/UI + Async (key-driven spawning, periodic emission, AI tick)
# Recommended test type: E2E (Playwright introspecting live game state across frames)

Feature: Ally spawning with combat AI

  Scenario: VibeSpawn class is exposed globally with the four supported types (R3.1)
    Given the game page is loaded
    When the test instantiates `new window.VibeSpawn(scene, 100, 100, type)` for each type "chicken", "duck", "dog", "doghouse"
    Then each instantiation succeeds without throwing
    And each instance reports its own `type` matching the constructor argument

  Scenario: Mobile allies move toward the nearest enemy and damage on contact (R3.2)
    Given the player is in computer form with one enemy placed 200px to their right
    When the test spawns a chicken at the player's position
    Then within 100ms the chicken's body velocity x is positive (toward the enemy)
    And on overlap with the enemy the enemy's HP decreases by 5 and the chicken is removed from `player.vibeSpawns`

  Scenario: Dog houses are stationary and emit dogs periodically (R3.3)
    Given the player is in computer form
    When the test spawns a "doghouse" VibeSpawn and waits 3500ms
    Then `player.vibeSpawns` contains at least one VibeSpawn of type "dog" that did not exist at spawn time
    And the dog house's body velocity x and y remain 0 throughout the wait
    And after 12000ms the dog house is no longer in `player.vibeSpawns`

  Scenario: Number keys spawn the right ally only in computer form (R3.4)
    Given the player is wearing VibeCoder in robot form
    When the player presses keys 1, 2, and 3 in sequence
    Then `player.vibeSpawns.length` remains 0
    Given the player has toggled to computer form
    When the player presses key 1, then key 2, then key 3
    Then `player.vibeSpawns` contains exactly one chicken, one duck, and one doghouse

  Scenario: Six-ally cap is enforced silently (R3.5)
    Given the player is in computer form with no allies spawned
    When the test presses key 1 seven times in succession
    Then `player.vibeSpawns.length` equals 6 after all presses
    And no error is logged to the browser console for the seventh press

  Scenario: Each spawn type renders a distinct procedural visual (R3.6)
    Given the player has spawned one chicken, one duck, one dog, and one doghouse
    When the test inspects each VibeSpawn's render container
    Then each container is composed solely of `Phaser.GameObjects.Rectangle` and `Phaser.GameObjects.Triangle` children
    And no asset (image, sprite, audio) is referenced by any spawn visual

  Scenario: Allies are cleaned up on revert to robot form (R3.7)
    Given the player is in computer form with three live allies
    When the player presses V to revert to robot form
    Then `player.vibeSpawns.length` equals 0
    And the previously-rendered ally containers are no longer present in the scene's display list
