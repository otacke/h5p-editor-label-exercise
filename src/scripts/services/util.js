import { decode } from 'he';

/** @constant {WeakMap} CLICKCOUNTS WeakMap to store click counts. */
const CLICKCOUNTS = new WeakMap();

/** @constant {number} DOUBLE_CLICK_TIME_MS Double click time in ms. */
const DOUBLE_CLICK_TIME_MS = 300;

/** @constant {number} DOUBLE_CLICK_COUNT Number of clicks to trigger double click. */
const DOUBLE_CLICK_COUNT = 2;

/**
 * Call callback function once dom element gets visible in viewport.
 * @async
 * @param {HTMLElement} dom DOM element to wait for.
 * @param {function} callback Function to call once DOM element is visible.
 * @param {object} [options] IntersectionObserver options.
 * @returns {IntersectionObserver} Promise for IntersectionObserver.
 */
export const callOnceVisible = async (dom, callback, options = {}) => {
  if (typeof dom !== 'object' || typeof callback !== 'function') {
    return; // Invalid arguments
  }

  options.threshold = options.threshold || 0;

  return await new Promise((resolve) => {
    // iOS is behind ... Again ...
    const idleCallback = window.requestIdleCallback ?
      window.requestIdleCallback :
      window.requestAnimationFrame;

    idleCallback(() => {
      // Get started once visible and ready
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          observer.unobserve(dom);
          observer.disconnect();

          callback();
        }
      }, {
        ...(options.root && { root: options.root }),
        threshold: options.threshold,
      });
      observer.observe(dom);

      resolve(observer);
    });
  });
};

/**
 * Clamp a value between min and max.
 * @param {number} value Value to clamp.
 * @param {number} min Minimum value.
 * @param {number} max Maximum value.
 * @returns {number} Clamped value.
 */
export const clamp = (value, min = 0, max = 100) => Math.min(Math.max(min, value), max);

/**
 * Extend an array just like JQuery's extend.
 * @param {...object} args Objects to merge.
 * @returns {object} Merged objects.
 */
export const extend = (...args) => {
  for (let i = 1; i < args.length; i++) {
    for (let key in args[i]) {
      if (Object.prototype.hasOwnProperty.call(args[i], key)) {
        if (typeof args[0][key] === 'object' && typeof args[i][key] === 'object') {
          extend(args[0][key], args[i][key]);
        }
        else if (args[i][key] !== undefined) {
          args[0][key] = args[i][key];
        }
      }
    }
  }

  return args[0];
};

/**
 * Multi click handler.
 * @param {Event} event Regular click event.
 * @param {function} callback Function to execute on multiClick.
 * @param {object} [options] Options.
 * @param {number} [options.count] Number of clicks to trigger callback, double click by default.
 * @param {number} [options.clickDiffMS] Time in ms between clicks.
 */
export const multiClick = (
  event,
  callback,
  options = { count: DOUBLE_CLICK_COUNT, clickDiffMS: DOUBLE_CLICK_TIME_MS },
) => {
  if (!event || typeof callback !== 'function') {
    return;
  }

  const count = CLICKCOUNTS.get(event.target) || 0;
  CLICKCOUNTS.set(event.target, count + 1);

  setTimeout(() => {
    if (CLICKCOUNTS.get(event.target) === options.count) {
      callback();
    }
    CLICKCOUNTS.set(event.target, 0);
  }, options.clickDiffMS);
};

/**
 * Parse float with fallback.
 * @param {string} value Value to parse.
 * @param {number} fallback Fallback value.
 * @returns {number} Parsed float or fallback.
 */
export const parseFloatWithFallback = (value, fallback = 0) => {
  const parsed = parseFloat(value);

  return isNaN(parsed) ? fallback : parsed;
};

/**
 * HTML decode and strip HTML.
 * @param {string|object} html html.
 * @returns {string} html value.
 */
export const purifyHTML = (html) => {
  if (typeof html !== 'string') {
    return '';
  }

  let text = decode(html);
  const div = document.createElement('div');
  div.innerHTML = text;
  text = div.textContent || div.innerText || '';

  return text;
};

/**
 * Split solution string into array of solutions.
 * Uses unescaped slashes as separators and may contain escaped slashes.
 * @param {string} solutionString Solution string.
 * @returns {string[]} Array of solutions.
 */
export const splitSolutionString = (solutionString = '') => {
  return solutionString.split(/(?<!\\)\//).map((solution) => solution.replace(/\\\//g, '/').trim());
};
