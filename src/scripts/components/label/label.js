import Telemetry from '@models/telemetry.js';
import { extend } from '@services/util.js';
import './label.scss';

export default class Label {
  /**
   * @param {object} [params] Parameters.
   * @param {object} [params.telemetry] Telemetry object with positioning/size.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [callbacks.onInteracted] Called when label is interacted with.
   */
  constructor(params, callbacks) {
    this.params = extend({}, params);

    this.callbacks = extend({
      onInteracted: () => {},
    }, callbacks);

    this.telemetry = new Telemetry(
      this.params.telemetry,
      {
        adjustOverflowHeight: true,
        adjustOverflowWidth: true,
      },
    );

    this.dom = document.createElement('div');
    this.dom.classList.add('h5peditor-label-exercise-label');
    this.dom.style.setProperty('--left', `${this.telemetry.getXAsString()}%`);
    this.dom.style.setProperty('--top', `${this.telemetry.getYAsString()}%`);
    this.dom.style.setProperty('--width', `${this.telemetry.getWidthAsString()}%`);
    this.dom.style.setProperty('--height', `${this.telemetry.getHeightAsString()}%`);
    this.dom.setAttribute('role', 'listitem');
  }

  /**
   * Get root DOM element for this label.
   * @returns {HTMLElement} Label DOM element.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Update label with new parameters.
   */
  update() {
    // Needs to be implemented by implementing class if required
  }

  /**
   * Enable label interaction.
   */
  enable() {
    // Needs to be implemented by implementing class if required
  }

  /**
   * Disable label interaction.
   */
  disable() {
    // Needs to be implemented by implementing class if required
  }

  /**
   * Reset label to initial state.
   */
  reset() {
    // Needs to be implemented by implementing class if required
  }
}
