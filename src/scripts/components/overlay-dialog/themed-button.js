/* Temporary copy of H5P.Components.Button to allow same visuals on H5P core 1.27 */
import './themed-button.scss';

/** @constant {number} MAX_LABEL_LINE_COUNT Maximum number of lines for label before hiding it */
const MAX_LABEL_LINE_COUNT = 1;

/** @constant {number} MAX_LABEL_WIDTH_RATIO Maximum width ratio between label and button before hiding label */
const MAX_LABEL_WIDTH_RATIO = 0.85;

/** @constant {number} DEBOUNCE_DELAY_MS Debounce delay to use */
const DEBOUNCE_DELAY_MS = 40;

/** @constant {number} DEFAULT_LINE_HEIGHT Default line height when it is "normal" */
const DEFAULT_LINE_HEIGHT = 1.2;

/** @constant {number} CLOSE_TO_INTEGER_EPSILON Epsilon for closeness to integer */
const CLOSE_TO_INTEGER_EPSILON = 0.01;

/**
 * Create an HTML element, and apply potential options/css.
 * @param {string} tag The HTML tag to create.
 * @param {object} options Options like classList, textContent etc.
 * @param {object} style Styles/css to apply to the element.
 * @returns {HTMLElement} The created element.
 */
const createElement = (tag, options, style = {}) => {
  const element = Object.assign(document.createElement(tag), options);
  Object.assign(element.style, style);

  return element;
};

/**
 * Strips html tags and converts special characters.
 * Example: "<div>Me &amp; you</div>" is converted to "Me & you".
 * @param {string} text The text to be parsed.
 * @returns {string} The parsed text.
 */
const parseString = (text) => {
  if (text === null || text === undefined) {
    return '';
  }
  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent;
};

/**
 * Compute the number of lines in an element.
 * @param {HTMLElement} element The element to compute lines for.
 * @returns {number} The number of lines in the element.
 */
const computeLineCount = (element) => {
  if (!element) {
    return 0;
  }
  const style = getComputedStyle(element);
  let lineHeight = parseFloat(style.lineHeight);

  if (isNaN(lineHeight)) {
    const fontSize = parseFloat(style.fontSize);
    lineHeight = fontSize * DEFAULT_LINE_HEIGHT;
  }

  const elementHeight = element.getBoundingClientRect().height;
  const numberOfLinesExact = elementHeight / lineHeight;

  // Element height might be slightly larger only, then assuming one more line is not correct.
  const floatingValue = Math.abs(Math.round(numberOfLinesExact) - numberOfLinesExact);
  const isCloseToInteger = floatingValue < CLOSE_TO_INTEGER_EPSILON;

  return (isCloseToInteger) ? Math.round(numberOfLinesExact) : Math.ceil(numberOfLinesExact);
};

/**
 * Compute the width ratio between two elements.
 * @param {HTMLElement} elementA The first element.
 * @param {HTMLElement} elementB The second element.
 * @returns {number} The width ratio (elementA / elementB).
 */
const computeWidthRatio = (elementA, elementB) => {
  if (!elementA || !elementB) {
    return 0;
  }

  const widthA = elementA.offsetWidth;
  const widthB = elementB.clientWidth;

  if (!widthA || !widthB) {
    return 0;
  }

  return widthA / widthB;
};

/**
 * Debounce a function call.
 * @param {function} callback Function to debounce.
 * @param {number} delayMs Debouncing delay.
 * @returns {function} Debounced function.
 */
const debounce = (callback, delayMs = DEBOUNCE_DELAY_MS) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delayMs);
  };
};

/**
 * @typedef {'primary' | 'secondary' | 'nav'} ButtonStyleType
 */

/**
 * @typedef {
 *   'check' |
 *   'retry' |
 *   'done' |
 *   'show-results' |
 *   'book' |
 *   'flip' |
 *   'next' |
 *   'previous' |
 *   'show-solutions'
 * } ButtonIcon
 */

/**
 * @typedef ButtonParams
 * @type {object}
 * @property {string} [label] The button text.
 * @property {string} [ariaLabel] The screenreader friendly text. Default is label.
 * @property {string} [tooltip] The tooltip to show on hover/focus. Default is label if icon enabled.
 *    Needed since icon only button on small screens.
 * @property {ButtonStyleType} [styleType] Which (visual) type of button it is.
 * @property {ButtonIcon} [icon] Which icon to show on the button.
 * @property {string[]} [classes] Additional classes to add to the button.
 * @property {function} [onClick] The function to perform once the button is clicked.
 * @property {string} [buttonType] Which html type the button should be. Default is button.
 * @property {boolean} [disabled] Whether the button should be enabled/disabled. Default is enabled.
 */

/**
 * Create a themed, responsive button
 * @param {ButtonParams} params A set of parameters to configure the Button component
 * @returns {HTMLElement} The button element
 */
export const ThemedButton = (params) => {
  const baseClass = 'h5p-theme-button';
  let buttonStyleType = 'h5p-theme-primary-cta';

  if (params.styleType === 'secondary') {
    buttonStyleType = 'h5p-theme-secondary-cta';
  }
  else if (params.styleType === 'nav') {
    buttonStyleType = 'h5p-theme-nav-button';
  }

  buttonStyleType = `${baseClass} ${buttonStyleType}`;

  let tooltip;
  if (params.icon) {
    buttonStyleType += ` h5p-theme-${params.icon}`;
    tooltip = params.tooltip ?? params.label;
  }

  const button = createElement('button', {
    innerHTML: params.label ? `<span class="h5p-theme-label">${params.label}</span>` : '',
    ariaLabel: parseString(params.ariaLabel ?? params.label),
    classList: params.classes ? `${buttonStyleType} ${params.classes}` : buttonStyleType,
    onclick: params.onClick,
    type: params.buttonType ?? 'button',
    disabled: params.disabled ?? false,
  });

  if (tooltip) {
    H5P.Tooltip(button, { text: tooltip, position: params.tooltipPosition ?? 'top' });
  }

  if (params.icon) {
    IconOnlyObserver.observe(button);
  }

  return button;
};

const IconOnlyObserver = new ResizeObserver(debounce((entries) => {
  for (const entry of entries) {
    const button = entry.target;
    if (!button.isConnected || button.matches(':hover')) {
      continue;
    }

    const label = button.querySelector('.h5p-theme-label');
    const lineCount = computeLineCount(label);
    if (!lineCount) {
      continue;
    }

    const ratio = computeWidthRatio(label, button);
    const shouldHide = lineCount > MAX_LABEL_LINE_COUNT || ratio > MAX_LABEL_WIDTH_RATIO;

    // For visual consistency, label of related buttons should be hidden as well if one is hidden
    const parent = button.parentElement;
    for (const child of parent.children) {
      if (!(child instanceof HTMLButtonElement) || !child.isConnected) {
        continue;
      }
      child.classList.toggle('icon-only', shouldHide);
    }
  }
}));
