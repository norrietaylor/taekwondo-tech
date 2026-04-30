// Transformer strategy base class.
// Extracts the shared transformer pipeline (cooldown decrement, form-state toggle,
// visual rebuild guards, facing-direction tracking) used by transformer costumes
// (Grimlock, Bumblebee, Hot Rod, Elita, BMW Bouncer, Portal Bot, ...).
//
// Per-costume specifics (which scene objects to add for each form, how to position
// them each frame, whether speed/jump/damage stats change on toggle, special
// effects on transform) live in the `config` passed to the constructor. The base
// owns the lifecycle so each new transformer costume costs a small config rather
// than ~600 LOC of duplicated state and rebuild branches in Player.js.
//
// Loaded as a global via <script> tag — no ES modules.
class Transformer {
    constructor(player, config) {
        this.player = player;
        this.scene = player.scene;
        this.config = config || {};
        const forms = (this.config.forms) || { primary: 'primary', secondary: 'secondary' };
        this.config.forms = forms;
        this.form = forms.primary;
        this.cooldownMs = 0;
        // Tracks the facing direction the visuals were built for. `null` means
        // visuals have never been built — the next rebuild check will force one.
        this.lastFacingRight = (player && typeof player.facingRight === 'boolean') ? player.facingRight : true;
        this.visuals = [];
        // Tracks which form the current visuals represent. `null` until first build.
        this.builtForm = null;
    }

    /**
     * Per-frame tick. Decrements cooldown and ensures visuals reflect the
     * current form + facing direction. Should be called once per frame.
     */
    update(delta) {
        if (this.cooldownMs > 0) {
            this.cooldownMs -= delta;
            if (this.cooldownMs < 0) this.cooldownMs = 0;
        }
        this.rebuildVisualsIfNeeded(false);
        // Allow per-config per-frame work (position updates, etc.)
        if (typeof this.config.onUpdate === 'function') {
            this.config.onUpdate(this.form, this.player, this);
        }
    }

    /**
     * Attempt to flip between primary and secondary forms. Respects cooldown.
     * Returns true if the toggle happened.
     */
    tryToggle() {
        if (this.cooldownMs > 0) return false;
        const cooldown = (typeof this.config.cooldownMs === 'number') ? this.config.cooldownMs : 1000;
        this.cooldownMs = cooldown;
        const wasPrimary = this.form === this.config.forms.primary;
        const previousForm = this.form;
        this.form = wasPrimary ? this.config.forms.secondary : this.config.forms.primary;
        // Force a rebuild on the next frame — the form just changed.
        this.rebuildVisualsIfNeeded(true);
        if (typeof this.config.onToggle === 'function') {
            this.config.onToggle(this.form, previousForm, this.player, this);
        }
        return true;
    }

    /**
     * Rebuild visuals if (a) we're forced, (b) the form changed since last build,
     * (c) the player's facing direction changed since last build, or (d) no
     * visuals exist yet. Mirrors the existing per-costume update*VisualsIfNeeded
     * pattern.
     */
    rebuildVisualsIfNeeded(force) {
        const facing = !!(this.player && this.player.facingRight);
        const formChanged = this.builtForm !== this.form;
        const facingChanged = this.lastFacingRight !== facing;
        const noVisuals = !this.visuals || this.visuals.length === 0;
        if (!force && !formChanged && !facingChanged && !noVisuals) return;
        // Tear down existing visuals first.
        this.destroyVisuals();
        // Hand off to the per-costume builder.
        const built = (typeof this.config.buildVisuals === 'function')
            ? this.config.buildVisuals(this.form, facing, this.player, this)
            : [];
        this.visuals = Array.isArray(built) ? built.filter(v => !!v) : [];
        this.builtForm = this.form;
        this.lastFacingRight = facing;
    }

    currentForm() {
        return this.form;
    }

    /**
     * Returns the configured key (costume name) this transformer is registered for.
     */
    key() {
        return this.config && this.config.key;
    }

    /**
     * Tear down and clear the visuals array without rebuilding. Useful when the
     * costume is swapped out from under us.
     */
    destroyVisuals() {
        if (this.visuals && this.visuals.length > 0) {
            this.visuals.forEach(v => { if (v && typeof v.destroy === 'function') v.destroy(); });
        }
        this.visuals = [];
        this.builtForm = null;
    }

    destroy() {
        this.destroyVisuals();
        if (typeof this.config.onDestroy === 'function') {
            try { this.config.onDestroy(this.player, this); } catch (e) { /* noop */ }
        }
    }
}

// Registry mapping costume key -> factory function that returns a Transformer
// instance for the given player. Per-costume modules register themselves here.
//
// Example:
//   TransformerRegistry['bmwBouncer'] = (player) => new Transformer(player, bmwBouncerConfig);
const TransformerRegistry = {};

// Expose globals (matches the rest of the codebase's no-module convention).
if (typeof window !== 'undefined') {
    window.Transformer = Transformer;
    window.TransformerRegistry = TransformerRegistry;
}
