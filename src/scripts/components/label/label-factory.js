import { LABEL_TYPE } from '@services/constants.js';
import Text from './label-types/text/text.js';
import Dropdown from './label-types/dropdown/dropdown.js';
import Blank from './label-types/blank/blank.js';

export default class LabelFactory {

  /**
   * Produce a label.
   * @param {object} [params] Parameters
   * @param {object} [callbacks] Callbacks.
   * @returns {Blank|Text|null} Label instance or null.
   */
  static produce(params = {}, callbacks = {}) {
    return this.createLabel(params.type, params, callbacks);
  }

  /**
   *
   * @param {string} type Label type.
   * @param {object} [params] Parameters
   * @param {object} [callbacks] Callbacks.
   * @returns {Blank|Text|null} Label instance or null.
   */
  static createLabel(type, params, callbacks) {
    switch (type) {
      case LABEL_TYPE.BLANK:
        return new Blank(params, callbacks);
      case LABEL_TYPE.DROPDOWN:
        return new Dropdown(params, callbacks);
      case LABEL_TYPE.TEXT:
        return new Text(params, callbacks);
      default:
        return null;
    }
  }
}
