/** @constant {number} BASE_FONT_SIZE_PX Base font size. */
export const BASE_FONT_SIZE_PX = 16;

/** @constant {number} BASE_WIDTH_PX Base width for font size computation. */
export const BASE_WIDTH_PX = 640;

/** @constant {object} EVALUATION_STATE Possible evaluation states. */
export const EVALUATION_STATE = Object.freeze({
  CORRECT: 'correct',
  WRONG: 'wrong',
});

/** @constant {object} LABEL_TYPE Label types list. */
export const LABEL_TYPE = Object.freeze({
  BLANK: 'blank',
  DROPDOWN: 'dropdown',
  TEXT: 'text',
});
