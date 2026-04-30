# Source: docs/specs/01-spec-vibecoder-mode/01-spec-vibecoder-mode.md
# Pattern: State + Web/UI (browser-driven game state introspection)
# Recommended test type: E2E (Playwright drives the real browser, asserts game state)

Feature: Transformer strategy base + BMW Bouncer migration

  Scenario: Transformer base class is available globally (R1.1, R1.2)
    Given the game page is loaded in the browser
    When the test evaluates `typeof window.Transformer` and instantiates one with a stub config
    Then the value of `typeof window.Transformer` is "function"
    And the instance exposes callable `update`, `tryToggle`, `currentForm`, and `rebuildVisualsIfNeeded` methods
    And calling `currentForm()` returns the configured primary form

  Scenario: TransformerRegistry resolves the active costume on outfit change (R1.3)
    Given the game page is loaded and the player exists
    When the test sets the player's outfit to "bmwBouncer" via the costume API
    Then `window.gameInstance.player.transformer` is a non-null Transformer instance
    And `window.gameInstance.player.transformer.config.key` equals "bmwBouncer"

  Scenario: BMW Bouncer transform toggles forms through the new base (R1.4)
    Given the player is wearing the BMW Bouncer costume in GameScene
    When the player presses the BMW Bouncer transform key
    Then `window.gameInstance.player.transformer.currentForm()` flips to the secondary form
    And the previous BMW Bouncer visuals have been destroyed and rebuilt for the new form

  Scenario: BMW Bouncer bounceSlam ability remains intact (R1.5)
    Given the player is wearing BMW Bouncer in its slam-eligible form
    And an enemy is placed within slam range below the player
    When the player triggers bounceSlam (existing key)
    Then the enemy's hit points decrease by the BMW Bouncer slam damage amount
    And the slam cooldown observable on the player resets to 6000ms

  Scenario: Legacy BMW Bouncer fields no longer live on Player (R1.6)
    Given the game page is loaded and the player is wearing BMW Bouncer
    When the test inspects own properties of `window.gameInstance.player`
    Then `bmwBouncerForm`, `bmwBouncerCurrentForm`, `bmwBouncerLastFacingRight`, `bmwBouncerTransformCooldown`, and `bmwBouncerVisuals` are not own properties of the Player instance
    And the equivalent state is reachable through `window.gameInstance.player.transformer`

  Scenario: Existing Playwright suites pass against the migrated base (R1.7)
    Given the codebase has been refactored to the Transformer base
    When `npm test` runs the existing suites `dragon-costume.spec.js`, `class-instantiation.spec.js`, `game-flow.spec.js`, `level-completion.spec.js`, and `menu-operations.spec.js`
    Then every scenario in each suite reports "passed"
    And no spec file in `tests/` was modified to make the run green
