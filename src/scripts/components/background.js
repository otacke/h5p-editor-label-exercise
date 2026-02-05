import './background.scss';

export default class Background {

  /**
   * @class
   * @param {object} [params] Parameters.
   * @param {object} params.backgroundImage Background image data.
   * @param {string} params.contentId Content ID for path resolution.
   */
  constructor(params = {}) {
    const { dom, image } = this.buildDOM(params);
    this.dom = dom;
    this.image = image;

    this.setBackground(params.backgroundImage ?? null);
  }

  /**
   * Build DOM.
   * @returns {HTMLElement} DOM element.
   */
  buildDOM() {
    const dom = document.createElement('div');
    dom.classList.add('h5peditor-label-exercise-background');

    const image = document.createElement('img');
    image.classList.add('h5peditor-label-exercise-background-image');
    dom.append(image);

    return { dom, image };
  }

  /**
   * Get DOM.
   * @returns {HTMLElement} DOM element.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Set background image.
   * @param {object} [imageParams] Image parameters.
   */
  setBackground(imageParams = {}) {
    if (imageParams === null) {
      this.image.src = '';
      this.image.alt = '';
      this.toggleVisibility(false);

      return;
    }

    if (!imageParams.path) {
      return;
    }

    this.image.src = H5P.getPath(
      imageParams.path,
      H5PEditor.contentId,
    );
    this.image.alt = imageParams.alt || ''; // alt tag does not help in this context.
    this.toggleVisibility(true);
  }

  /**
   * Toggle visibility.
   * @param {boolean} isVisible Whether the background should be visible.
   */
  toggleVisibility(isVisible) {
    this.dom.classList.toggle('display-none', !isVisible);
  }
}
