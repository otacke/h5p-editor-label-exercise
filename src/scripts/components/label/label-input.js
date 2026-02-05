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

    this.setAnswerGiven(false);
    this.previousState = '';

    const { dom, input } = this.buildDOM();
    this.dom = dom;
    this.input = input;

    this.resetAriaLabel();
  }

  /**
   * Set answer given flag.
   * @param {boolean} given Answer given state.
   */
  setAnswerGiven(given) {
    if (typeof given !== 'boolean') {
      return;
    }

    this.wasAnswerGiven = given;
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

    input.addEventListener('input', () => {
      this.setAnswerGiven(true);
    });

    input.addEventListener('focus', () => {
      this.handleFocus();
    });

    input.addEventListener('blur', () => {
      this.handleBlur();
    });

    dom.appendChild(input);

    return { dom, input };
  }

  /**
   * Handle focus event.
   */
  handleFocus() {
    if (!this.input.readOnly) {
      return;
    }

    requestAnimationFrame(() => {
      this.input.setSelectionRange(0, 0);
    });
  }

  /**
   * Handle blur event.
   */
  handleBlur() {
    if (this.previousState !== this.getAnswer()) {
      this.callbacks.onInteracted();
    }
    this.previousState = this.getAnswer();
  }

  /**
   * Get answer text.
   * @returns {string} Answer text.
   */
  getAnswer() {
    return this.input.value.trim();
  }

  /**
   * Reset aria-label text.
   */
  resetAriaLabel() {
    const ariaLabel = this.params.dictionary.get('a11y.labelXOfY')
      .replaceAll('@current', this.position)
      .replaceAll('@total', this.total);
    this.input.setAttribute('aria-label', ariaLabel);
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
    this.setAnswerGiven(false);
    this.previousState = '';
    this.resetAriaLabel();
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
