import { extend } from '@services/util.js';
import './label-input.scss';

export default class LabelInput {
  /**
   * Create instance of LabelInput.
   * @param {object} [params] Parameters for label input.
   * @param {number} params.position Position of the label.
   * @param {number} params.total Total number of labels.
   * @param {object} params.dictionary Dictionary for aria labels.
   * @param {object} [callbacks] Callback functions.
   * @param {function} [callbacks.onInteracted] Callback on interaction.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = extend({}, params);
    this.callbacks = extend({
      onInteracted: () => {},
    }, callbacks);

    this.position = this.params.position;
    this.total = this.params.total;

    this.previousState = '';

    const { dom, input } = this.buildDOM();
    this.dom = dom;
    this.input = input;

    this.setAnswer(this.params.solutions[0] || '');

    this.disable();
  }

  /**
   * Build DOM elements for label input.
   * @returns {object} Wrapper and input elements.
   */
  buildDOM() {
    const dom = document.createElement('div');
    dom.classList.add('h5peditor-label-exercise-label-input-wrapper');

    const input = document.createElement('input');
    input.id = H5P.createUUID();
    input.classList.add('h5peditor-label-exercise-label-input');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('spellcheck', 'false');
    input.type = 'text';

    dom.appendChild(input);

    return { dom, input };
  }

  /**
   * Get answer text.
   * @returns {string} Answer text.
   */
  getAnswer() {
    return this.input.value.trim();
  }

  /**
   * Disable input.
   */
  disable() {
    this.input.readOnly = true;
    this.input.setAttribute('aria-disabled', 'true');
  }

  /**
   * Enable input.
   */
  enable() {
    this.input.readOnly = false;
    this.input.setAttribute('aria-disabled', 'false');
  }

  /**
   * Get answer given flag.
   * @returns {boolean} Answer given state.
   */
  getAnswerGiven() {
    return this.wasAnswerGiven;
  }

  /**
   * Get DOM element for label input.
   * @returns {HTMLElement} Wrapper element.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Reset input state.
   */
  reset() {
    this.setAnswer('');
    this.previousState = '';
  }

  /**
   * Set answer text.
   * @param {string} answer Answer text.
   */
  setAnswer(answer) {
    if (typeof answer !== 'string') {
      return;
    }

    this.input.value = answer;
  }

  /**
   * Set aria-label text.
   * @param {string} label Aria label text.
   */
  setAriaLabel(label) {
    this.input.setAttribute('aria-label', label);
  }
}
