import Dictionary from '@services/dictionary.js';
import ConfirmationDialog from '@components/confirmation-dialog/confirmation-dialog.js';

import Main from '@components/main.js';

export default class LabelExercise {

  /**
   * @class
   * @param {object} parent Parent element in semantics.
   * @param {object} field Semantics field properties.
   * @param {object} params Parameters entered in editor form.
   * @param {function} setValue Callback to set parameters.
   */
  constructor(parent, field, params, setValue) {
    this.parent = parent;
    this.field = field;
    this.params = params;
    this.setValue = setValue;

    // Callbacks to call when parameters change
    this.changes = [];

    // Let parent handle ready callbacks of children
    this.passReadies = true;

    this.globals = new Map();
    this.globals.set('mainInstance', this);
    this.globals.set('getLabelGroupInstance', this.getLabelGroupInstance.bind(this));
    this.globals.set('getLabelListInstance', this.getLabelListInstance.bind(this));
    this.confirmationDialog = new ConfirmationDialog({});
    this.globals.set('ConfirmationDialog', this.confirmationDialog);

    this.dictionary = new Dictionary();
    this.fillDictionary();

    // DOM
    this.$container = H5P.jQuery('<div>', {
      class: 'h5peditor-label-exercise',
    });

    // Instantiate original field (or create your own and call setValue)
    this.fieldInstance = new H5PEditor.widgets[this.field.type](this.parent, this.field, this.params, this.setValue);

    this.main = new Main({
      contentParams: this.params,
      dictionary: this.dictionary,
      globals: this.globals,
    });
    this.$container.get(0).append(this.main.getDOM());

    // Looks weird, but Group instance does not initialize properly unless appended to DOM first
    this.fieldInstance.appendTo(this.$container);
    this.fieldInstance.remove();

    // Relay changes
    if (this.fieldInstance.changes) {
      this.fieldInstance.changes.push(() => {
        this.handleFieldChange();
      });
    }

    // Errors (or add your own)
    this.$errors = this.$container.find('.h5p-errors');

    this.parent.ready(() => {
      this.handleParentReady();
    });
  }

  /**
   * Append field to wrapper. Invoked by H5P core.
   * @param {H5P.jQuery} $wrapper Wrapper.
   */
  appendTo($wrapper) {
    $wrapper.get(0).append(this.$container.get(0));
  }

  /**
   * Validate current values. Invoked by H5P core.
   * @returns {boolean} True, if current value is valid, else false.
   */
  validate() {
    return this.fieldInstance.validate();
  }

  /**
   * Remove self. Invoked by H5P core.
   */
  remove() {
    this.$container.get(0).remove();
  }

  /**
   * Handle change of field.
   */
  handleFieldChange() {
    this.params = this.fieldInstance.params;
    this.changes.forEach((change) => {
      change(this.params);
    });
  }

  /**
   * Handle when parent is ready.
   */
  handleParentReady() {
    this.passReadies = false;

    this.initializeBackgroundImage();
    this.initializeLabelListInstance();
  }

  /**
   * Initialize background image.
   */
  initializeBackgroundImage() {
    this.backgroundImageField = H5PEditor.findField('backgroundImage', this.parent);

    if (!this.backgroundImageField) {
      throw H5PEditor.t('core', 'unknownFieldPath', { ':path': this.backgroundImageField });
    }

    this.main.setBackground(this.backgroundImageField.params);
    this.backgroundImageField.changes.push((change) => {
      this.main.setBackground(change ?? null);
    });
  }

  /**
   * Initialize label list instance.
   */
  initializeLabelListInstance() {
    this.labelListInstance = H5PEditor.findField('labels', this.fieldInstance);

    if (!this.labelListInstance) {
      throw H5PEditor.t('core', 'unknownFieldPath', { ':path': 'labels' });
    }
  }

  /**
   * Get the instance of the label list.
   * @returns {object|false} The label list instance.
   */
  getLabelListInstance() {
    if (!this.labelListInstance) {
      return false;
    }

    return this.labelListInstance;
  }

  /**
   * Get the instance of a label group at a specific index.
   * @param {number} index Index of the label group.
   * @returns {object|boolean} The label group instance or false if not found.
   */
  getLabelGroupInstance(index) {
    if (!this.labelListInstance || typeof index !== 'number' || index < 0) {
      return false;
    }

    let group = false;
    this.labelListInstance.forEachChild((child, childIndex) => {
      if (group) {
        return;
      }

      if (childIndex === index) {
        group = child;
      }
    });

    return group;
  }

  /**
   * Fill Dictionary.
   */
  fillDictionary() {
    // Convert H5PEditor language strings into object.
    const plainTranslations = H5PEditor.language['H5PEditor.LabelExercise'].libraryStrings || {};
    const translations = {};

    Object.entries(plainTranslations).forEach(([key, value]) => {
      const splits = key.split(/[./]+/);
      const lastSplit = splits.pop();

      const current = splits.reduce((acc, split) => {
        if (!acc[split]) {
          acc[split] = {};
        }
        return acc[split];
      }, translations);

      current[lastSplit] = value;
    });

    this.dictionary.fill(translations);
  }
}
