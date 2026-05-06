import Hint from '@components/label/label-types/hint.js';
import Label from '@components/label/label.js';
import { EVALUATION_STATE } from '@services/constants.js';
import { splitSolutionString } from '@services/util.js';
import DropdownSelect from './dropdown-select.js';
import './dropdown.scss';

export default class Dropdown extends Label {
  /**
   * @param {object} [params] Parameters.
   * @param {number|string} params.position 1-based label position/index.
   * @param {number} params.total Total number of labels.
   * @param {string} params.solutions Solutions string (uses '/' as separator and \/ for escaped /).
   * @param {string} params.distractors Distractors string (uses '/' as separator and \/ for escaped /).
   * @param {string} [params.hint] Optional hint text.
   * @param {object} params.telemetry Telemetry object with positioning/size.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [callbacks.onInteracted] Called when label is interacted with.
   */
  constructor(params = {}, callbacks = {}) {
    super(params, callbacks);

    this.solutions = splitSolutionString(this.params.solutions);
    this.distractors = splitSolutionString(this.params.distractors);

    this.dom.classList.add('h5peditor-label-exercise-label-dropdown');
    this.dom.style.removeProperty('--height');

    this.select = this.buildDropdownSelect();
    this.dom.append(this.select.getDOM());

    if (this.params.hint) {
      this.hint = this.buildHint();
      this.dom.append(this.hint.getDOM());
    }
  }

  buildDropdownSelect() {
    return new DropdownSelect({
      position: this.params.position,
      total: this.params.total,
      dictionary: this.params.dictionary,
      solutions: this.solutions,
      distractors: this.distractors,
    }, {
      onInteracted: () => {
        this.callbacks.onInteracted();
      },
    });
  }

  /**
   * Build hint.
   * @returns {HTMLElement} DOM for hint.
   */
  buildHint() {
    return new Hint({
      text: this.params.hint,
      position: this.params.position,
      dictionary: this.params.dictionary,
    });
  }

  /**
   * Build accessible label text indicating label index and correctness.
   * @param {boolean} isAnswerCorrect Whether current answer is correct.
   * @returns {string} Aria label text.
   */
  buildAriaLabel(isAnswerCorrect) {
    const labelIdentifier = this.params.dictionary.get('a11y.labelXOfY')
      .replaceAll('@current', this.params.position)
      .replaceAll('@total', this.params.total);

    const labelCorrectness = isAnswerCorrect ?
      this.params.dictionary.get('a11y.answeredCorrectly') :
      this.params.dictionary.get('a11y.answeredIncorrectly');

    return `${labelIdentifier} ${labelCorrectness}`;
  }

  /**
   * Disable select and hide hint (if present).
   */
  disable() {
    this.select?.disable();
    this.hint?.hide();
  }

  /**
   * Enable select and show hint (if present).
   */
  enable() {
    this.select?.enable();
    this.hint?.show();
  }

  /**
   * Get selected answer.
   * @returns {string} Answer string.
   */
  getAnswer() {
    return this.select.getAnswer();
  }

  /**
   * Whether answer was given.
   * @returns {boolean} True if answer was given by user, else false.
   */
  getAnswerGiven() {
    return this.select.getAnswerGiven();
  }

  /**
   * Get serializable current state for persistence.
   * @returns {object} Current state object.
   */
  getCurrentState() {
    return { answer: this.getAnswer() };
  }

  /**
   * Get evaluation details for this label.
   * @returns {object} Evaluation object with answer, score, maxScore, isCorrect and solutions.
   */
  getEvaluation() {
    return {
      answer: this.getAnswer(),
      score: this.getScore(),
      maxScore: this.getMaxScore(),
      isCorrect: this.getScore() === this.getMaxScore(),
      solutions: this.solutions,
    };
  }

  /**
   * Compute score for this label.
   * @returns {number} Current score.
   */
  getScore() {
    return this.solutions.includes(this.getAnswer()) ? 1 : 0;
  }

  /**
   * Maximum score for this label (always 1).
   * @returns {number} Maximum score.
   */
  getMaxScore() {
    return 1;
  }

  /**
   * Hide any evaluation state classes.
   */
  hideEvaluation() {
    Object.values(EVALUATION_STATE).forEach((state) => {
      this.dom.classList.remove(state);
    });
  }

  /**
   * Get serializable parameters for this label.
   * @returns {object} Label parameters.
   */
  getParams() {
    return {
      solutions: this.params.solutions,
      distractors: this.params.distractors,
      hint: this.params.hint,
      hotspotAnchorPosition: this.params.hotspotAnchorPosition,
      telemetry: {
        x: this.telemetry.getX(),
        y: this.telemetry.getY(),
        width: this.telemetry.getWidth(),
      },
    };
  }

  /**
   * Reset label state to initial.
   */
  reset() {
    this.select.reset();
    this.hideEvaluation();
  }

  /**
   * Set aria-label text for underlying select.
   * @param {string} label Aria-label value.
   */
  setAriaLabel(label) {
    this.select.setAriaLabel(label);
  }

  /**
   * Show evaluation state.
   */
  showEvaluation() {
    const isAnswerCorrect = this.getScore() === this.getMaxScore();
    const evaluationState = isAnswerCorrect ? EVALUATION_STATE.CORRECT : EVALUATION_STATE.WRONG;

    this.dom.classList.add(evaluationState);
    this.select.setAriaLabel(this.buildAriaLabel(isAnswerCorrect));
  }

  /**
   * Toggle whether label element should have listitem role.
   * @param {boolean} isListItem True to set role="listitem", false to remove it.
   */
  toggleListItemRole(isListItem) {
    if (isListItem) {
      this.dom.setAttribute('role', 'listitem');
    }
    else {
      this.dom.removeAttribute('role');
    }
  }

  update(params = {}) {
    Object.keys(params).forEach((key) => {
      this.params[key] = params[key];
    });

    this.solutions = splitSolutionString(params.solutions);
    this.distractors = splitSolutionString(params.distractors);

    this.dom.innerHTML = '';
    this.select = this.buildDropdownSelect();
    this.dom.append(this.select.getDOM());

    this.hint = this.buildHint();
    if (params.hint) {
      this.dom.append(this.hint.getDOM());
    }
  }

  /**
   * Restore state from serialized state object.
   * @param {object} [state] State to restore.
   */
  setCurrentState(state = {}) {
    this.select.setAnswer(state.answer);
    this.select.setAnswerGiven(true);
  }
}
