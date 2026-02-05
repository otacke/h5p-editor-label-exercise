import { extend } from '@services/util.js';
import './label-hint.scss';

export default class LabelHint {
  /**
   * @param {object} [params] Parameters for label hint.
   * @param {string} params.text Hint text.
   * @param {number} params.position Position number.
   * @param {object} params.dictionary Translation dictionary.
   */
  constructor(params = {}) {
    this.params = extend({}, params);

    this.dom = H5P.JoubelUI.createTip(
      this.params.text,
      { tipLabel: this.params.dictionary.get('a11y.showHint').replaceAll('@current', this.params.position) },
    )[0];

    this.dom.addEventListener('click', () => {
      this.updateAriaLabel();
    });
  }

  /**
   * Update aria-label text.
   */
  updateAriaLabel() {
    const hasPopupOpen = this.dom.getAttribute('aria-expanded') === 'true';
    const ariaLabel = hasPopupOpen ?
      this.params.dictionary.get('a11y.hideHint') :
      this.params.dictionary.get('a11y.showHint').replaceAll('@current', this.params.position);
    this.dom.setAttribute('aria-label', ariaLabel);
  }

  /**
   * Get DOM element for label hint.
   * @returns {HTMLElement} DOM element.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Hide label hint.
   */
  hide() {
    this.dom.classList.add('display-none');
  }

  /**
   * Show label hint.
   */
  show() {
    this.dom.classList.remove('display-none');
  }
}
