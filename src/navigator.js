import {
  filterRelatedQuestionLinks,
  getAllTopLevelLinks,
} from './utils.js'

/**
 * @typedef Link
 * @type {HTMLElement}
 */

/**
 * @typedef Index
 * @type {number}
 * An integer from [0, links.length - 1]
 */

export class LinksNavigator {
  constructor() {
    // Filter the question links from all top level links
    this.links = filterRelatedQuestionLinks(getAllTopLevelLinks())
    this.linkNumber = 0

    // TODO - figure out why Google switches focus from this element
    // Currently set focus with a delay to avoid issue 
    setTimeout(() => this.setFocus(this.links[0]), 50)
  }

  /**
   * Moves view to the link above
   * @returns {void}
   */
  goToLinkAbove() {
    // Do nothing if on first link
    if (this.linkNumber === 0) return

    // Reset style of current link
    // Move focus to the above link
    this.resetFocus(this.links[this.linkNumber])
    this.setFocus(this.links[this.linkNumber - 1])

    // Decrement which link we're on by one
    this.linkNumber -= 1
  }

  /**
   * Moves view to the link below
   * @returns {void}
   */
  goToLinkBelow() {
    // Do nothing if on last link
    if (this.linkNumber === this.links.length - 1) return

    // Move focus to the below link
    this.moveFocus(this.linkNumber, this.linkNumber + 1)

    // Increment which link we're on by one
    this.linkNumber += 1
  }

  /**
   * Moves from a link at an index to a link at another index
   * @param {Index} from An integer from [0, links.length - 1]
   * @param {Index} to An index from [0, links.length - 1]
   */
  moveFocus(from, to) {
    this.resetFocus(this.links[from])
    this.setFocus(this.links[to])
  }

  /**
   * Reset focus (bolding, underline) from the link
   * @param {Link} link
   */
  resetFocus(link) {
    const textNode = link.getElementsByTagName('h3')[0]
    textNode.style.fontWeight = ''
    textNode.style.textDecoration = ''
  }

  /**
   * Sets the focus (bolding, underline) to the link at the link number
   * @param {Link} link
   */
  setFocus(link) {
    const { top } = link.getBoundingClientRect()
    
    // If it's the first link, go all the way to top
    if (link === this.links[0]) window.scrollTo(0, 0)

    // Otherwise offset a bit for all other links
    else window.scrollTo(0, top + window.scrollY - 80)

    // Set focus on the link
    link.focus()

    const textNode = link.getElementsByTagName('h3')[0]
    textNode.style.fontWeight = 'bold'
    textNode.style.textDecoration = 'underline'
  }

  /**
   * Checks if the user is currently foucsed on search bar
   * If they are, we do not allow for navigation
   * @returns {boolean} Search bar is active or not
   */
  isFocusedOnSearchBar() {
    // Check if there is even a current active element
    const { activeElement } = document
    if (activeElement === null) return false

    // Make sure that the active element is an input
    return activeElement.tagName === 'INPUT'
  }
}
