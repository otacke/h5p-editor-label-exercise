import { extend } from '@services/util.js';
import EditArea from '@components/editArea.js';
import OverlayDialog from '@components/overlay-dialog/overlay-dialog.js';
import Toolbar from '@components/toolbar/toolbar.js';
import './main.scss';

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
    return new Toolbar({
      buttons: [{
        id: 'add-label',
        type: 'pulse',
        props: [{ draggable: true }],
        dataTransferPairs: [{ type: 'h5p-label-exercise-toolbar', data: 'true' }],
        pulseStates: [
          {
            id: 'add-label',
            label: this.params.dictionary.get('l10n.addLabel'),
          },
        ],
        onClick: () => {
          this.addLabelToEditArea({}, { new: true });
        },
      }],
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
      onDrop: (coordinates) => {
        this.handleDrop(coordinates);
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
   * @param {object} coordinates Coordinates where label was dropped.
   * @param {number} coordinates.x X coordinate.
   * @param {number} coordinates.y Y coordinate.
   */
  handleDrop(coordinates) {
    this.addLabelToEditArea({ telemetry: coordinates }, { new: true });
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

    H5PEditor.processSemanticsChunk(
      this.currentLabelGroupInstance.field.fields,
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
          this.closeEditorDialog();
          this.clearLabelGroupBackup();
          this.editArea.updateLabels();
        },
        onConfirmed: () => {
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
