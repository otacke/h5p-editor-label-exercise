import { extend } from '@services/util.js';
import ToolbarButton from '@components/toolbar-button/toolbar-button.js';

import './toolbar.scss';

export default class Toolbar {
  constructor(params = {}) {
    this.params = extend({
      buttons: [],
    }, params || {});

    this.buttons = {};

    this.dom = document.createElement('div');
    this.dom.classList.add('h5peditor-label-exercise-toolbar');
    this.dom.setAttribute('role', 'toolbar');
    this.dom.setAttribute(
      'aria-label', 'a11y.toolbar',
    );

    this.dom.addEventListener('keydown', (event) => {
      this.handleKeydown(event);
    });

    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.classList.add('toolbar-buttons');
    this.dom.appendChild(this.buttonsContainer);

    this.params.buttons.forEach((button) => {
      this.addButton(button);
    });

    // Make first button active one
    Object.values(this.buttons).forEach((button, index) => {
      button.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    this.currentButtonIndex = 0;
  }

  /**
   * Return the DOM for this class.
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Focus whatever should get focus.
   */
  focus() {
    Object.values(this.buttons)[this.currentButtonIndex]?.focus();
  }

  /**
   * Add button.
   * @param {object} [button] Button parameters.
   */
  addButton(button = {}) {
    if (typeof button.id !== 'string') {
      return; // We need an id at least
    }

    this.buttons[button.id] = new ToolbarButton(
      {
        id: button.id,
        ...(button.versionedMachineName && { versionedMachineName: button.versionedMachineName }),
        ...(button.a11y && { a11y: button.a11y }),
        classes: ['toolbar-button', `toolbar-button-${button.id.toLowerCase()}`],
        ...(typeof button.disabled === 'boolean' && {
          disabled: button.disabled,
        }),
        ...(button.active && { active: button.active }),
        ...(button.type && { type: button.type }),
        ...(button.pulseStates && { pulseStates: button.pulseStates }),
        ...(button.pulseIndex && { pulseIndex: button.pulseIndex }),
        ...(button.props && { props: button.props }),
        ...(button.dataTransferPairs && { dataTransferPairs: button.dataTransferPairs }),
      },
      {
        ...(typeof button.onClick === 'function' && {
          onClick: (event, params) => {
            button.onClick(event, params);
          },
        }),
      },
    );

    this.buttonsContainer.appendChild(this.buttons[button.id].getDOM());
  }

  /**
   * Move button focus.
   * @param {number} offset Offset to move position by.
   */
  moveButtonFocus(offset) {
    if (typeof offset !== 'number') {
      return;
    }
    if (
      this.currentButtonIndex + offset < 0 ||
      this.currentButtonIndex + offset > Object.keys(this.buttons).length - 1
    ) {
      return; // Don't cycle
    }
    Object.values(this.buttons)[this.currentButtonIndex]
      .setAttribute('tabindex', '-1');
    this.currentButtonIndex = this.currentButtonIndex + offset;
    const focusButton = Object.values(this.buttons)[this.currentButtonIndex];
    focusButton.setAttribute('tabindex', '0');
    focusButton.focus();
  }

  /**
   * Handle key down.
   * @param {KeyboardEvent} event Keyboard event.
   */
  handleKeydown(event) {
    if (event.code === 'ArrowLeft' || event.code === 'ArrowUp') {
      this.moveButtonFocus(-1);
    }
    else if (event.code === 'ArrowRight' || event.code === 'ArrowDown') {
      this.moveButtonFocus(1);
    }
    else if (event.code === 'Home') {
      this.moveButtonFocus(0 - this.currentButtonIndex);
    }
    else if (event.code === 'End') {
      this.moveButtonFocus(
        Object.keys(this.buttons).length - 1 - this.currentButtonIndex,
      );
    }
    else {
      return;
    }
    event.preventDefault();
  }
}
