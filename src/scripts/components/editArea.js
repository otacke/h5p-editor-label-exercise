import Background from '@components/background.js';
import ElementInteractor from '@components/element-interactor/element-interactor.js';
import Label from '@components/label/label.js';
import { extend, parseFloatWithFallback } from '@services/util.js';
import { isUsingMouse } from '@services/util-h5p.js';
import './editArea.scss';

export default class EditArea {

  /**
   * @class
   * @param {object} [params] Parameters.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [callbacks.onLabelDeleted] Callback for when a label is deleted.
   * @param {function} [callbacks.onDrop] Callback for when a label is dropped.
   * @param {function} [callbacks.onEdit] Callback for when a label is edited.
   * @param {function} [callbacks.findFocus] Callback for when focus needs to be found after deletion.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = extend({}, params);

    this.callbacks = extend({
      onDrop: () => {},
      onEdit: () => {},
      onLabelDeleted: () => {},
      findFocus: () => {},
    }, callbacks);

    this.labels = [];
    this.elementInteractors = [];

    const { dom, background, labelArea } = this.buildDOM(this.params);
    this.dom = dom;
    this.background = background;
    this.labelArea = labelArea;
  }

  /**
   * Build DOM structures.
   * @param {object} params Parameters.
   * @returns {object} DOM structures.
   */
  buildDOM(params) {
    const dom = document.createElement('div');
    dom.classList.add('h5peditor-label-exercise-edit-area');

    dom.addEventListener('dragover', (event) => {
      event.preventDefault();
    });

    dom.addEventListener('drop', (event) => {
      this.handleLabelDropped(event);
    });

    const background = new Background(params);
    dom.append(background.getDOM());

    const labelArea = document.createElement('ol');
    labelArea.classList.add('h5peditor-label-exercise-label-area');
    dom.append(labelArea);

    return { dom, background, labelArea };
  }

  /**
   * Handle user dropping a label onto the edit area.
   * @param {DragEvent} event Drag event with drop data.
   */
  handleLabelDropped(event) {
    if (event.dataTransfer.getData('h5p-label-exercise-toolbar') !== 'true') {
      return; // Not meant to be dropped here
    }

    const rect = this.dom.getBoundingClientRect();

    const x = 100 * (event.clientX - rect.left) / rect.width;
    const y = 100 * (event.clientY - rect.top) / rect.height;

    event.preventDefault();

    this.callbacks.onDrop({ x, y });
  }

  /**
   * Add a label to the edit area.
   * @param {object} [params] Label parameters.
   * @param {object} [options] Options.
   */
  addLabel(params = {}, options = {}) {
    const labelParams = {
      ...params,
      telemetry: { x: 0, y: 0, width: 100 }, // Element interactor responsible for telemetry in editor
      solutions: params.solutions || '',
      dictionary: this.params.dictionary,
    };
    const label = new Label(labelParams);

    const elementInteractor = new ElementInteractor(
      {
        id: H5P.createUUID(),
        contentDOM: label.getDOM(),
        dictionary: this.params.dictionary,
        telemetry: this.buildInteractorTelemetry(params.telemetry),
        capabilities: {
          edit: true,
          move: true,
          bringToFront: false,
          sendToBack: false,
          resizeX: true,
          resizeY: false,
          delete: true,
        },
      },
      {
        getDenominator: (id) => {
          return this.params.dictionary.get('a11y.labelXOfY')
            .replace('@current', this.getIndexFromInteractorId(id) + 1)
            .replace('@total', this.elementInteractors.length);
        },
        getBoardRect: () => {
          return this.dom.getBoundingClientRect();
        },
        onEdit: (id) => {
          this.editElement(id);
        },
        onMove: (id) => {
          const index = this.getIndexFromInteractorId(id);
          const elementInteractor = this.elementInteractors[index];

          const labelGroupInstance = this.params.globals.get('getLabelGroupInstance')(index);
          labelGroupInstance.params.telemetry = elementInteractor.getTelemetry();
        },
        onBringToFront: (id, options) => {
          this.bringElementToFront(id, options);
        },
        onSendToBack: (id, options) => {
          this.sendElementToBack(id, options);
        },
        onDelete: (id) => {
          this.deleteElementWithConfirmation(id);
        },
      },
    );
    this.labelArea.appendChild(elementInteractor.getDOM());

    this.labels.push(label);
    this.elementInteractors.push(elementInteractor);

    if (options.new === true) {
      // List is already complete when label was added in previous session
      const labelListInstance = this.params.globals.get('getLabelListInstance')();
      labelListInstance?.addItem({ ...labelParams, telemetry: elementInteractor.getTelemetry() });
    }
  }

  /**
   * Build telemetry for element interactor from label telemetry.
   * @param {object} telemetry Telemetry data.
   * @returns {object} Interactor telemetry.
   */
  buildInteractorTelemetry(telemetry) {
    if (!telemetry) {
      return {};
    }

    const interactorTelemetry = {
      x: parseFloatWithFallback(telemetry.x),
      y: parseFloatWithFallback(telemetry.y),
    };

    if (telemetry.width) {
      interactorTelemetry.width = parseFloatWithFallback(telemetry.width);
    }

    return interactorTelemetry;
  }

  /**
   * Edit label with given id.
   * @param {string} id ID of the interactor/label to edit.
   */
  editElement(id) {
    const index = this.getIndexFromInteractorId(id);
    this.callbacks.onEdit(index);
  }

  /**
   * Get a interactor/label index from interactor ID.
   * @param {string} id Interactor ID.
   * @returns {number} Label index.
   */
  getIndexFromInteractorId(id) {
    return this.elementInteractors.findIndex((ei) => ei.getId() === id);
  }

  /**
   * Bring interactor to front.
   * @param {string} id Interactor ID.
   * @param {object} options Options.
   * @param {HTMLElement} [options.nextFocus] Element to focus after bringing to front.
   */
  bringElementToFront(id, options = {}) {
    this.changeZIndex(id, this.elementInteractors.length - 1, options);
  }

  /**
   * Change z-index of interactor.
   * @param {string} id Interactor ID.
   * @param {number} indexTo Index to move to.
   * @param {object} options Options.
   * @param {HTMLElement} [options.nextFocus] Element to focus after changing z-index.
   */
  changeZIndex(id, indexTo, options = {}) {
    const interactor = this.getInteractorFromInteractorId(id);
    if (!interactor) {
      return;
    }

    const indexFrom = this.getIndexFromInteractorId(id);
    const interactorToMove = this.elementInteractors.splice(indexFrom, 1)[0];
    this.elementInteractors.splice(indexTo, 0, interactorToMove);

    const labelToMove = this.labels.splice(indexFrom, 1)[0];
    this.labels.splice(indexTo, 0, labelToMove);

    if (indexTo === 0) {
      this.labelArea.insertBefore(interactor.getDOM(), this.labelArea.firstChild);
    }
    else {
      this.labelArea.appendChild(interactor.getDOM());
    }

    // Reattaching the interactor causes it and its children like context menu buttons to lose focus
    if (options.nextFocus) {
      options.nextFocus.focus();
    }
    else {
      interactor.focus();
    }

    // A little brute
    const labelListInstance = this.params.globals.get('getLabelListInstance')();
    const listValues = labelListInstance.getValue();
    const labelToMoveValue = listValues.splice(indexFrom, 1)[0];

    listValues.splice(indexTo, 0, labelToMoveValue);
    labelListInstance.removeAllItems();
    listValues.forEach((value) => {
      labelListInstance.addItem(value);
    });
  }

  /**
   * Get interactor from interactor ID.
   * @param {string} id Interactor ID.
   * @returns {ElementInteractor} Element interactor.
   */
  getInteractorFromInteractorId(id) {
    return this.elementInteractors.find((ei) => ei.getId() === id);
  }

  /**
   * Send interactor to back.
   * @param {string} id Interactor ID.
   * @param {object} options Options.
   * @param {HTMLElement} [options.nextFocus] Element to focus after sending to back.
   */
  sendElementToBack(id, options = {}) {
    this.changeZIndex(id, 0, options);
  }

  /**
   * Delete interactor with confirmation.
   * @param {string} id Interactor ID.
   */
  deleteElementWithConfirmation(id) {
    const activeElement = document.activeElement; // Save to restore focus later

    const confirmationDialog = this.params.globals.get('ConfirmationDialog');
    confirmationDialog.update(
      {
        headerText: this.params.dictionary.get('l10n.confirmDeletionHeader'),
        dialogText: `${this.params.dictionary.get('l10n.confirmDeletionDialog')}`,
        confirmText: this.params.dictionary.get('l10n.confirmDeletionConfirm'),
        cancelText: this.params.dictionary.get('l10n.confirmDeletionCancel'),
      },
      {
        onConfirmed: () => {
          const deletedInteractorIndex = this.getIndexFromInteractorId(id);
          this.deleteElement(id);

          let focusTarget;
          if (deletedInteractorIndex > 0) {
            focusTarget = this.elementInteractors[deletedInteractorIndex - 1];
          }
          else if (this.elementInteractors.length > 0) {
            focusTarget = this.elementInteractors[0];
          }
          else if (!isUsingMouse()) {
            this.callbacks.findFocus();
          }

          focusTarget?.focus();
        },
        onCanceled: () => {
          const elementInteractor = this.getInteractorFromInteractorId(id);
          if (!elementInteractor) {
            return;
          }

          elementInteractor.focus(); // Required to allow focusing the delete button that's hidden on focusout
          activeElement.focus();
          // Track H5P.Tooltip to not display on delete button after focus
          activeElement.dispatchEvent(new Event('mouseleave', { bubbles: true, cancelable: true }));
        },
      },
    );

    confirmationDialog.show();
  }

  /**
   * Delete interactor and label.
   * @param {string} id Interactor ID.
   */
  deleteElement(id) {
    const deleteIndex = this.getIndexFromInteractorId(id);
    if (deleteIndex === -1) {
      return;
    }

    const interactor = this.elementInteractors[deleteIndex];
    if (!interactor) {
      return;
    }

    const interactorDOM = interactor.getDOM();
    const focusDOM = interactorDOM.nextElementSibling || interactorDOM.previousElementSibling;

    this.elementInteractors.splice(deleteIndex, 1);
    this.labels.splice(deleteIndex, 1);
    const labelListInstance = this.params.globals.get('getLabelListInstance')();
    if (labelListInstance) {
      labelListInstance.removeItem(deleteIndex);
    }

    this.labelArea.removeChild(interactorDOM);

    this.callbacks.onLabelDeleted({
      id: id,
      focusDOM: focusDOM,
    });
  }

  /**
   * Get edit area DOM.
   * @returns {HTMLElement} Edit area DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Get number of labels.
   * @returns {number} Number of labels.
   */
  getLabelsCount() {
    return this.labels.length;
  }

  /**
   * Set background image of edit area.
   * @param {object} imageParams Image parameters.
   */
  setBackground(imageParams = {}) {
    this.background.setBackground(imageParams);
  }

  /**
   * Update all labels to reflect current label group params.
   */
  updateLabels() {
    this.labels.forEach((label, index) => {
      const groupInstance = this.params.globals.get('getLabelGroupInstance')(index);

      // We don't need telemetry here as it's handled by the element interactor
      const { telemetry, ...paramsWithoutTelemetry } = groupInstance.params;
      label.update(paramsWithoutTelemetry);

      this.elementInteractors[index].updateContentDOM(label.getDOM());
    });
  }
}
