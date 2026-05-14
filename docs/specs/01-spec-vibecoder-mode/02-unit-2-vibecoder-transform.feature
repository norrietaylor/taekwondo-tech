# Source: docs/specs/01-spec-vibecoder-mode/01-spec-vibecoder-mode.md
# Pattern: Web/UI + State (key input drives state + visible UI)
# Recommended test type: E2E (Playwright + window.gameInstance introspection)

Feature: VibeCoder costume config and robot computer transform

  Scenario: VibeCoder is registered in the costume catalog (R2.1)
    Given the game page is loaded in the browser
    When the test reads `window.gameInstance.dragonCostumes.vibeCoder`
    Then the entry exists with name "VibeCoder", `canTransform: true`, `transformKey: "V"`, and `currentForm: "robot"`
    And the entry includes the required cosmetic fields `icon`, `primaryColor`, `secondaryColor`, `beltColor`, `description`, `effectColor`

  Scenario: Completing level 1 unlocks VibeCoder (R2.2)
    Given a fresh save where `gameInstance.gameData.unlockedOutfits.vibeCoder` is false
    When the test sets `gameInstance.gameData.currentLevel = 2` and invokes `checkDragonUnlocks()`
    Then `gameInstance.gameData.unlockedOutfits.vibeCoder` becomes true
    And the unlock persists in `localStorage` after a `SaveSystem.save()` call

  Scenario: VibeCoderTransformer is registered with the right cooldown and forms (R2.3)
    Given the game page is loaded
    When the test sets the player outfit to "vibeCoder"
    Then `window.gameInstance.player.transformer.config.cooldownMs` equals 1000
    And `window.gameInstance.player.transformer.config.forms.primary` equals "robot"
    And `window.gameInstance.player.transformer.config.forms.secondary` equals "computer"

  Scenario: Computer form locks the player stationary (R2.4)
    Given the player is wearing VibeCoder and has toggled to computer form
    When the test holds the right-arrow input down for two consecutive frames
    Then `window.gameInstance.player.body.velocity.x` equals 0 on both sampled frames
    And the player's world x-position is unchanged across the two frames

  Scenario: Challenge accepted bubble appears on robot to computer transform (R2.5)
    Given the player is wearing VibeCoder in robot form
    When the player presses the V key
    Then a speech bubble containing the text "Challenge accepted" is rendered above the player
    And the bubble's alpha tweens to 0 within 1500ms of appearing

  Scenario: Computer form renders a procedural computer visual (R2.6)
    Given the player has just transformed to computer form
    When the test inspects `window.gameInstance.player.transformer.visuals`
    Then the visuals array contains at least one container with child rectangle game objects
    And no Phaser image, sprite, or audio object is referenced by the visuals

  Scenario: VibeCoder appears in the existing CraftScene picker (R2.7)
    Given VibeCoder has been unlocked
    When the user opens the CraftScene costume picker and pages through it
    Then "VibeCoder" is listed as an available costume option
    And no source file in `js/scenes/CraftScene.js` was modified to surface it
