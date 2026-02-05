import FocusTrap from '@services/focus-trap.js';
import { extend, purifyHTML } from '@services/util.js';
import { ThemedButton } from './themed-button.js';
import './overlay-dialog.scss';

/** Class representing an overlay dialog */
export default class OverlayDialog {

  /**
   * Overlay dialog.
   * @class
   * @param {object} [params] Parameters.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [callbacks.onClosed] Callback when overlay closed.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = extend({}, params);

    this.callbacks = extend({
      onConfirmed: () => {},
      onClosed: () => {},
      onOpenAnimationEnded: () => {},
    }, callbacks);

    this.showingState = false;

    this.handleGlobalClick = this.handleGlobalClick.bind(this);
    this.keepTrackOfClickOrigin = this.keepTrackOfClickOrigin.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.dom = document.createElement('div');
    this.dom.classList.add('h5peditor-label-exercise-overlay-dialog');
    this.dom.classList.add('display-none');
    this.dom.setAttribute('role', 'dialog');
    this.dom.setAttribute('aria-modal', 'true');

    this.outerWrapper = document.createElement('div');
    this.outerWrapper.classList.add('h5peditor-label-exercise-overlay-dialog-outer-wrapper');
    this.dom.append(this.outerWrapper);

    // Headline
    const headline = document.createElement('div');
    headline.classList.add('h5peditor-label-exercise-overlay-dialog-headline');
    this.outerWrapper.append(headline);

    this.headlineText = document.createElement('div');
    this.headlineText.classList.add('h5peditor-label-exercise-overlay-dialog-headline-text');
    headline.append(this.headlineText);

    // Close button
    this.buttonClose = document.createElement('button');
    this.buttonClose.classList.add('h5peditor-label-exercise-overlay-dialog-button-close');
    this.buttonClose.setAttribute(
      'aria-label', this.params.dictionary.get('a11y.close'),
    );
    this.buttonClose.addEventListener('click', () => {
      this.callbacks.onClosed();
    });
    this.outerWrapper.append(this.buttonClose);

    // Content
    this.content = document.createElement('div');
    this.content.classList.add('h5peditor-label-exercise-overlay-dialog-content');
    this.outerWrapper.append(this.content);

    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.classList.add('h5peditor-label-exercise-overlay-dialog-buttons-wrapper');
    this.outerWrapper.append(buttonsWrapper);

    const buttonCancel = ThemedButton({
      label: this.params.dictionary.get('l10n.cancel'),
      classes: 'cancel',
      styleType: 'secondary',
      onClick: () => {
        this.callbacks.onClosed();
      },
    });
    buttonsWrapper.append(buttonCancel);

    const buttonDone = ThemedButton({
      label: this.params.dictionary.get('l10n.done'),
      classes: 'done',
      icon: 'check',
      styleType: 'primary',
      onClick: () => {
        this.callbacks.onConfirmed();
      },
    });
    buttonsWrapper.append(buttonDone);

    this.focusTrap = new FocusTrap({
      trapElement: this.dom,
      closeElement: this.buttonClose,
      fallbackContainer: this.content,
      returnFocus: true,
    });
  }

  /**
   * Get DOM for exercise.
   * @returns {HTMLElement} DOM for exercise.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Hide.
   */
  hide() {
    this.showingState = false;
    document.removeEventListener('click', this.handleGlobalClick);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('mousedown', this.keepTrackOfClickOrigin);
    document.removeEventListener('touchstart', this.keepTrackOfClickOrigin);
    this.clearClickOrigin();

    this.dom.classList.add('display-none');

    this.focusTrap.deactivate();

  }

  /**
   * Check if dialog is currently showing.
   * @returns {boolean} True if showing.
   */
  isShowing() {
    return this.showingState === true;
  }

  /**
   * Set DOM content.
   * @param {HTMLElement} dom DOM of content.
   */
  setContent(dom) {
    this.content.innerHTML = '';
    this.content.appendChild(dom);
  }

  /**
   * Set headline text.
   * @param {string} text Headline text to set.
   */
  setTitle(text) {
    text = purifyHTML(text);

    this.headlineText.innerText = text;
    this.dom.setAttribute(
      'aria-label',
      (this.params.dictionary.get('a11y.popupLabel') ?? '@label').replace('@label', text),
    );
  }

  /**
   * Show.
   */
  show() {
    this.showingState = true;
    this.dom.classList.remove('display-none');

    // Prevent click listener from immediately closing the dialog
    window.requestAnimationFrame(() => {
      document.addEventListener('click', this.handleGlobalClick);
      document.addEventListener('mousedown', this.keepTrackOfClickOrigin);
      document.addEventListener('touchstart', this.keepTrackOfClickOrigin);
      document.addEventListener('keydown', this.handleKeyDown);

      this.focusTrap.activate();
    });
  }

  keepTrackOfClickOrigin(event) {
    this.clickOrigin = event.target;
  }

  clearClickOrigin() {
    delete this.clickOrigin;
  }

  /**
   * Handle global click event.
   * @param {Event} event Click event.
   */
  handleGlobalClick(event) {
    if (
      !event.target.isConnected ||  // H5P content may have removed element already
      this.outerWrapper.contains(event.target) || // Click inside dialog
      (this.clickOrigin && this.outerWrapper.contains(this.clickOrigin))  // Mousedown/touchstart inside dialog
    ) {
      return;
    }

    this.callbacks.onClosed();
  }

  /**
   * Handle key down.
   * @param {KeyboardEvent} event Keyboard event.
   */
  handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.callbacks.onClosed();
    }
  }
}
