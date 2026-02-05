import LabelHint from './label-hint.js';
import LabelInput from './label-input.js';
import Telemetry from '@models/telemetry.js';
import { extend, splitSolutionString } from '@services/util.js';
import './label.scss';

/** @constant {number} VERTICAL_CENTER_PERCENTAGE Vertical center percentage for solution positioning. */
const VERTICAL_CENTER_PERCENTAGE = 50;

/** @constant {Map<string, string>} EVALUATION_STATES Possible evaluation states. */
const EVALUATION_STATES = new Map([
  ['correct', 'correct'],
  ['wrong', 'wrong'],
]);

export default class Label {
  /**
   * @param {object} [params] Parameters
   * @param {number|string} params.position 1-based label position/index.
   * @param {number} params.total Total number of labels.
   * @param {string} params.solutions Solutions string (uses '/' as separator and \/ for escaped /).
   * @param {string} [params.hint] Optional hint text.
   * @param {object} params.telemetry Telemetry object with positioning/size.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [callbacks.onInteracted] Called when label is interacted with.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = extend({}, params);
    this.callbacks = extend({
      onInteracted: () => {},
    }, callbacks);

    this.solutions = splitSolutionString(this.params.solutions);

    this.telemetry = new Telemetry(
      this.params.telemetry,
      {
        adjustOverflowHeight: true,
        adjustOverflowWidth: true,
      },
    );

    const  { dom, input, solution, hint } = this.buildDOM();

    this.dom = dom;
    this.input = input;
    this.solution = solution;
    if (hint) {
      this.hint = hint;
    }
  }

  /**
   * Build and return DOM element for this label.
   * @returns {HTMLElement} Label DOM root.
   */
  buildDOM() {
    const dom = document.createElement('div');
    dom.classList.add('h5peditor-label-exercise-label');
    dom.style.setProperty('--left', `${this.telemetry.getXAsString()}%`);
    dom.style.setProperty('--top', `${this.telemetry.getYAsString()}%`);
    dom.style.setProperty('--width', `${this.telemetry.getWidthAsString()}%`);
    dom.setAttribute('role', 'listitem');

    const input = new LabelInput({
      position: this.params.position,
      total: this.params.total,
      dictionary: this.params.dictionary,
    }, {
      onInteracted: () => {
        this.callbacks.onInteracted();
      },
    });
    dom.append(input.getDOM());

    let hint;
    if (this.params.hint) {
      hint = new LabelHint({
        text: this.params.hint,
        position: this.params.position,
        dictionary: this.params.dictionary,
      });

      dom.append(hint.getDOM());
    }

    return { dom, input, hint };
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
   * Disable input and hide hint (if present).
   */
  disable() {
    this.input.disable();
    this.hint?.hide();
  }

  /**
   * Enable input and show hint (if present).
   */
  enable() {
    this.input.enable();
    this.hint?.show();
  }

  /**
   * Get stored answer string.
   * @returns {string} Answer string.
   */
  getAnswer() {
    return this.input.getAnswer();
  }

  /**
   * Whether answer was given.
   * @returns {boolean} True if answer was given by user, else false.
   */
  getAnswerGiven() {
    return this.input.getAnswerGiven();
  }

  /**
   * Get serializable current state for persistence.
   * @returns {object} Current state object.
   */
  getCurrentState() {
    return { answer: this.getAnswer() };
  }

  /**
   * Get root DOM element for this label.
   * @returns {HTMLElement} Label DOM element.
   */
  getDOM() {
    return this.dom;
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
    EVALUATION_STATES.forEach((state) => {
      this.dom.classList.remove(state);
    });
  }

  update(params = {}) {
    Object.keys(params).forEach((key) => {
      this.params[key] = params[key];
    });

    this.solutions = splitSolutionString(params.solutions);

    this.telemetry = new Telemetry(
      this.params.telemetry,
      {
        adjustOverflowHeight: true,
        adjustOverflowWidth: true,
      },
    );

    const  { dom, input, solution, hint } = this.buildDOM();

    this.dom = dom;
    this.input = input;
    this.solution = solution;
    if (hint) {
      this.hint = hint;
    }
  }

  /**
   * Get serializable parameters for this label.
   * @returns {object} Label parameters.
   */
  getParams() {
    return {
      solutions: this.params.solutions,
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
    this.input.reset();
    this.solution.hide();
    this.hideEvaluation();
  }

  /**
   * Set aria-label text for underlying input.
   * @param {string} label Aria-label value.
   */
  setAriaLabel(label) {
    this.input.setAriaLabel(label);
  }

  /**
   * Show evaluation state.
   */
  showEvaluation() {
    const isAnswerCorrect = this.getScore() === this.getMaxScore();
    const evaluationState = isAnswerCorrect ?
      EVALUATION_STATES.get('correct') :
      EVALUATION_STATES.get('wrong');

    this.dom.classList.add(evaluationState);
    this.input.setAriaLabel(this.buildAriaLabel(isAnswerCorrect));
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

  /**
   * Restore state from serialized state object.
   * @param {object} [state] State to restore.
   */
  setCurrentState(state = {}) {
    this.input.setAnswer(state.answer);
    this.input.setAnswerGiven(true);
  }
}
