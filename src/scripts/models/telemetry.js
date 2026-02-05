import { clamp, parseFloatWithFallback } from '@services/util.js';

/** @constant {number} DEFAULT_X Default X position in percentage. */
const DEFAULT_X = 50;
/** @constant {number} DEFAULT_Y Default Y position in percentage. */
const DEFAULT_Y = 50;
/** @constant {number} DEFAULT_HEIGHT Default height in percentage. */
const DEFAULT_HEIGHT = 10;
/** @constant {number} DEFAULT_WIDTH Default width in percentage. */
const DEFAULT_WIDTH = 10;

/** @constant {number} MIN_X Minimum X position in percentage. */
const MIN_X = 0;
/** @constant {number} MIN_Y Minimum Y position in percentage. */
const MIN_Y = 0;
/** @constant {number} MIN_HEIGHT Minimum height in percentage. */
const MIN_HEIGHT = 0;
/** @constant {number} MIN_WIDTH Minimum width in percentage. */
const MIN_WIDTH = 0;

/** @constant {number} MAX_X Maximum X position in percentage. */
const MAX_X = 100;
/** @constant {number} MAX_Y Maximum Y position in percentage. */
const MAX_Y = 100;
/** @constant {number} MAX_HEIGHT Maximum height in percentage. */
const MAX_HEIGHT = 100;
/** @constant {number} MAX_WIDTH Maximum width in percentage. */
const MAX_WIDTH = 100;

export default class Telemetry {

  /**
   * @class
   * @param {object} telemetry Telemetry data.
   * @param {number|string} telemetry.x X position in percentage.
   * @param {number|string} telemetry.y Y position in percentage.
   * @param {number|string} telemetry.height Height in percentage.
   * @param {number|string} telemetry.width Width in percentage.
   * @param {object} options Options.
   * @param {boolean} options.adjustOverflowHeight Adjust height if it overflows.
   * @param {boolean} options.adjustOverflowWidth Adjust width if it overflows.
   * @param {boolean} options.moveXOnOverflow Move X position if width overflows.
   * @param {boolean} options.moveYOnOverflow Move Y position if height overflows.
   */
  constructor(telemetry = {}, options = {}) {
    this.telemetry = this.sanitizeParams(telemetry, {
      adjustOverflowHeight: options.adjustOverflowHeight === true,
      adjustOverflowWidth: options.adjustOverflowWidth === true,
      moveXOnOverflow: options.moveXOnOverflow === true,
      moveYOnOverflow: options.moveYOnOverflow === true,
    });

    this.options = { ...options };
  }

  /**
   * Sanitize telemetry parameters.
   * @param {object} telemetry Telemetry data.
   * @param {object} options Options.
   * @returns {object} Sanitized telemetry.
   */
  sanitizeParams(telemetry = {}, options = {}) {
    let x = parseFloatWithFallback(telemetry.x, DEFAULT_X);
    x = clamp(x, MIN_X, MAX_X);

    let y = parseFloatWithFallback(telemetry.y, DEFAULT_Y);
    y = clamp(y, MIN_Y, MAX_Y);

    let height = parseFloatWithFallback(telemetry.height, DEFAULT_HEIGHT);
    height = Math.max(MIN_HEIGHT, height);

    let width = parseFloatWithFallback(telemetry.width, DEFAULT_WIDTH);
    width = Math.max(MIN_WIDTH, width);

    const isOverflowingWidth = (x + width) > MAX_WIDTH;
    if (isOverflowingWidth) {
      if (options.moveXOnOverflow) {
        x = Math.max(MAX_WIDTH - width, MIN_X);
      }

      width = options.adjustOverflowWidth ? MAX_WIDTH - x : Math.min(width, MAX_WIDTH);
    }

    const isOverflowingHeight = (y + height) > MAX_HEIGHT;
    if (isOverflowingHeight) {
      if (options.moveYOnOverflow) {
        y = Math.max(MAX_HEIGHT - height, MIN_Y);
      }

      height = options.adjustOverflowHeight ? MAX_HEIGHT - y : Math.min(height, MAX_HEIGHT);
    }

    return { x, y, width, height };
  }

  /**
   * Get as string.
   * @returns {object} Telemetry data as strings.
   */
  getAsString() {
    return {
      x: this.getXAsString(),
      y: this.getYAsString(),
      width: this.getWidthAsString(),
      height: this.getHeightAsString(),
    };
  }

  /**
   * Set a telemetry parameter.
   * @param {string} key Telemetry key.
   * @param {number|string} value Telemetry value.
   */
  set(key, value) {
    this.telemetry = this.sanitizeParams({ ...this.telemetry, [key]: value }, this.options);
  }

  /**
   * Set x position in percentage.
   * @param {number|string} x X position in percentage.
   */
  setX(x) {
    this.set('x', x);
  }

  /**
   * Set y position in percentage.
   * @param {number|string} y Y position in percentage.
   */
  setY(y) {
    this.set('y', y);
  }

  /**
   * Set width in percentage.
   * @param {number|string} width Width in percentage.
   */
  setWidth(width) {
    this.set('width', width);
  }

  /**
   * Set height in percentage.
   * @param {number|string} height Height in percentage.
   */
  setHeight(height) {
    this.set('height', height);
  }

  /**
   * Get x position in percentage.
   * @returns {number} X position in percentage.
   */
  getX() {
    return this.telemetry.x;
  }

  /**
   * Get x position as percentage string.
   * @returns {string} X position as percentage string.
   */
  getXAsString() {
    return this.telemetry.x.toString();
  }

  /**
   * Get y position in percentage.
   * @returns {number} Y position in percentage.
   */
  getY() {
    return this.telemetry.y;
  }

  /**
   * Get y position as percentage string.
   * @returns {string} Y position as percentage string.
   */
  getYAsString() {
    return this.telemetry.y.toString();
  }

  /**
   * Get height in percentage.
   * @returns {number} Height in percentage.
   */
  getHeight() {
    return this.telemetry.height;
  }

  /**
   * Get height as percentage string.
   * @returns {string} Height as percentage string.
   */
  getHeightAsString() {
    return this.telemetry.height.toString();
  }

  /**
   * Get width in percentage.
   * @returns {number} Width in percentage.
   */
  getWidth() {
    return this.telemetry.width;
  }

  /**
   * Get width as percentage string.
   * @returns {string} Width as percentage string.
   */
  getWidthAsString() {
    return this.telemetry.width.toString();
  }
}
