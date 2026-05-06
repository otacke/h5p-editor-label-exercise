import { extend } from '@services/util.js';
import './dropdown-select.scss';

export default class DropdownSelect {
  /**
   * @param {object} [params] Parameters for dropdown select.
   * @param {number} params.position Position of dropdown.
   * @param {number} params.total Total number of labels.
   * @param {object} params.dictionary Dictionary for aria labels.
   * @param {string[]} params.solutions Correct answer strings.
   * @param {string[]} params.distractors Wrong answer strings.
   * @param {object} [callbacks] Callback functions.
   * @param {function} [callbacks.onInteracted] Callback on interaction.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = extend({}, params);
    this.callbacks = extend({
      onInteracted: () => {},
    }, callbacks);

    this.wasAnswerGiven = false;
    this.previousState = '';

    const { dom, select } = this.buildDOM();
    this.dom = dom;
    this.select = select;

    this.setAnswer(this.params.solutions[0] || '');

    this.disable();
  }

  /**
   * Build DOM elements for dropdown select.
   * @returns {object} Wrapper and select elements.
   */
  buildDOM() {
    const dom = document.createElement('div');
    dom.classList.add('h5peditor-label-exercise-dropdown-select-wrapper');

    const select = document.createElement('select');
    select.id = H5P.createUUID();
    select.classList.add('h5peditor-label-exercise-dropdown-select');

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    const options = this.shuffle([
      ...this.params.solutions,
      ...this.params.distractors,
    ]);

    options.forEach((text) => {
      const option = document.createElement('option');
      option.value = text;
      option.textContent = text;
      select.appendChild(option);
    });

    dom.appendChild(select);

    return { dom, select };
  }

  /**
   * Get a shuffled version of an array.
   * @param {string[]} array Array to shuffle.
   * @returns {string[]} Shuffled copy.
   */
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }

  /**
   * Get selected answer.
   * @returns {string} Selected option value.
   */
  getAnswer() {
    return this.select.value;
  }

  /**
   * Set selected answer.
   * @param {string} answer Option value to select.
   */
  setAnswer(answer) {
    if (typeof answer !== 'string') {
      return;
    }

    this.select.value = answer;
  }

  /**
   * Get answer given flag.
   * @returns {boolean} Answer given state.
   */
  getAnswerGiven() {
    return this.wasAnswerGiven;
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
   * Get DOM element for dropdown select.
   * @returns {HTMLElement} Wrapper element.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Disable select.
   */
  disable() {
    this.select.disabled = true;
    this.select.setAttribute('aria-disabled', 'true');
  }

  /**
   * Enable select.
   */
  enable() {
    this.select.disabled = false;
    this.select.setAttribute('aria-disabled', 'false');
  }

  /**
   * Reset select state.
   */
  reset() {
    this.select.value = '';
    this.wasAnswerGiven = false;
    this.previousState = '';
  }

  /**
   * Set aria-label text.
   * @param {string} label Aria label text.
   */
  setAriaLabel(label) {
    this.select.setAttribute('aria-label', label);
  }
}
