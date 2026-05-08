import EditArea from '@components/editArea.js';
import OverlayDialog from '@components/overlay-dialog/overlay-dialog.js';
import Toolbar from '@components/toolbar/toolbar.js';
import { LABEL_TYPE } from '@services/constants.js';
import { extend } from '@services/util.js';
import './main.scss';

/** @constant {Map} NAMES_OF_FORM_FIELDS Names of valid form fields for label types. */
const NAMES_OF_FORM_FIELDS = new Map([
  [LABEL_TYPE.BLANK, ['solutions', 'hint', 'hotspotAnchorPosition', 'telemetry']],
  [LABEL_TYPE.DROPDOWN, ['solutions', 'distractors', 'hint', 'hotspotAnchorPosition', 'telemetry']],
  [LABEL_TYPE.TEXT, ['text', 'backgroundColor', 'hotspotAnchorPosition', 'telemetry']],
]);

export default class Main {

  /**
   * @class
   * @param {object} [params] Parameters.
   */
  constructor(params = {}) {
    this.params = extend({
      contentParams: {
        labels: [],
      },
    }, params);

    const { dom, toolbar, editArea, overlayDialog } = this.buildDOM(this.params);
    this.dom = dom;
    this.toolbar = toolbar;
    this.editArea = editArea;
    this.overlayDialog = overlayDialog;

    this.params.contentParams.labels.forEach((labelParams) => {
      this.addLabelToEditArea(labelParams);
    });
  }

  /**
   * Build DOM structures.
   * @param {object} params Parameters.
   * @returns {object} DOM structures.
   */
  buildDOM(params) {
    const dom = document.createElement('div');
    dom.classList.add('h5peditor-label-exercise-main');

    const toolbar = this.buildToolbar(params);
    dom.append(toolbar.getDOM());

    const editArea = this.buildEditArea(params);
    dom.append(editArea.getDOM());

    dom.append(this.params.globals.get('ConfirmationDialog').getDOM());

    const overlayDialog = this.buildOverlayDialog(params);
    dom.append(overlayDialog.getDOM());

    return { dom, toolbar, editArea, overlayDialog };
  }

  /**
   * Build toolbar.
   * @returns {Toolbar} Toolbar instance.
   */
  buildToolbar() {
    const buttonTypes = Object.values(LABEL_TYPE);

    return new Toolbar({
      buttons: buttonTypes.map((type) => {
        const capitalizedType = `${type.charAt(0).toUpperCase()}${type.slice(1)}`;

        return {
          id: `add-${type}`,
          type: 'pulse',
          props: [{ draggable: true }],
          dataTransferPairs: [{ type: 'h5p-label-exercise-toolbar', data: type }],
          pulseStates: [
            {
              id: `add-${type}`,
              label: this.params.dictionary.get(`l10n.add${capitalizedType}`),
            },
          ],
          onClick: () => {
            this.addLabelToEditArea({ type }, { new: true });
          },
        };
      }),
    });
  }

  /**
   * Add label to edit area.
   * @param {object} params Parameters.
   * @param {object} options Options.
   * @param {boolean} [options.new] Should be true if label is newly created
   */
  addLabelToEditArea(params = {}, options = {}) {
    this.editArea.addLabel(params, options);
  }

  /**
   * Build edit area that holds labels.
   * @param {object} params Parameters.
   * @returns {EditArea} EditArea instance.
   */
  buildEditArea(params) {
    const editArea = new EditArea({
      ...params,
      globals: params.globals,
    }, {
      onDrop: (params) => {
        this.handleDrop(params);
      },
      onEdit: (index) => {
        this.openEditorDialogForLabel(index);
      },
      findFocus: () => {
        this.findFocus();
      },
    });

    return editArea;
  }

  /**
   * Handle user dropping a label from the toolbar into the edit area.
   * @param {object} params Parameters.
   * @param {string} params.type Type.
   * @param {object} params.coordinates Coordinates where label was dropped.
   * @param {number} params.coordinates.x X coordinate.
   * @param {number} params.coordinates.y Y coordinate.
   */
  handleDrop(params) {
    this.addLabelToEditArea({ type: params.type, telemetry: params.coordinates }, { new: true });
  }

  /**
   * Open editor dialog for label at given index.
   * @param {number} index Index of the label.
   */
  openEditorDialogForLabel(index) {
    if (typeof index !== 'number') {
      return;
    }

    const contentFormDOM = document.createElement('div');
    contentFormDOM.classList.add('h5peditor-label-exercise-content-form');

    this.currentLabelGroupInstance = this.params.globals.get('getLabelGroupInstance')(index);
    if (!this.currentLabelGroupInstance) {
      delete this.currentLabelGroupInstance;
      return;
    }

    this.backupLabelParams = { ...this.currentLabelGroupInstance.params };

    let fields = window.structuredClone(this.currentLabelGroupInstance.field.fields);
    fields = fields.filter((field) => {
      const type = this.currentLabelGroupInstance.params.type;
      return NAMES_OF_FORM_FIELDS.get(type).includes(field.name);
    });

    H5PEditor.processSemanticsChunk(
      fields,
      this.currentLabelGroupInstance.params,
      H5P.jQuery(contentFormDOM),
      this.currentLabelGroupInstance,
    );

    const title = this.params.dictionary.get('a11y.labelXOfY')
      .replace('@current', index + 1)
      .replace('@total', this.editArea.getLabelsCount());
    this.overlayDialog.setTitle(title);
    this.overlayDialog.setContent(contentFormDOM);
    this.overlayDialog.show();
  }

  /**
   * Child may have lost focus. Find focus.
   */
  findFocus() {
    this.toolbar.focus();
  }

  /**
   * Build overlay dialog for editing labels.
   * @param {object} params Parameters.
   * @returns {OverlayDialog} OverlayDialog instance.
   */
  buildOverlayDialog(params) {
    return new OverlayDialog(
      { dictionary: params.dictionary },
      {
        onClosed: () => {
          this.resetLabelGroup();
          this.currentLabelGroupInstance?.validate(); // Ensure form values are saved
          this.closeEditorDialog();
          this.clearLabelGroupBackup();
          this.editArea.updateLabels();
        },
        onConfirmed: () => {
          this.currentLabelGroupInstance?.validate(); // Ensure form values are saved
          this.closeEditorDialog();
          this.clearLabelGroupBackup();
          this.editArea.updateLabels();
        },
      },
    );
  }

  /**
   * Reset label group to backup params.
   */
  resetLabelGroup() {
    this.currentLabelGroupInstance.params = { ...this.backupLabelParams };
  }

  resize() {
    this.editArea.resize();
  }

  /**
   * Close editor dialog.
   */
  closeEditorDialog() {
    this.overlayDialog.hide();
  }

  /**
   * Clear label group backup.
   */
  clearLabelGroupBackup() {
    delete this.currentLabelGroupInstance;
    delete this.backupLabelParams;
  }

  /**
   * Get main DOM.
   * @returns {HTMLElement} Main DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Set background image of edit area.
   * @param {object} imageParams Image parameters.
   */
  setBackground(imageParams = {}) {
    this.editArea.setBackground(imageParams);
  }
}
