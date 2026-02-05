/**
 * Determine if the user is using a mouse or not.
 * @returns {boolean} True if user is using a mouse, false otherwise.
 */
export const isUsingMouse = () => {
  return document.querySelector('.h5p-content')?.classList.contains('using-mouse');
};
