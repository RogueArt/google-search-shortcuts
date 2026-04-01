import {
  getAllTopLevelLinks,
} from './utils.js'

export class LinksNavigator {
  constructor() {
    this.links = getAllTopLevelLinks()
    this.curIndex = 0

    window.requestAnimationFrame(() => {
      if (this.links.length === 0) { return }
      this.setFocus(this.curIndex)
    })
  }

  goToLinkAbove() { this.moveFocusBy(-1) }
  goToLinkBelow() { this.moveFocusBy(1) }

  moveFocusBy(delta) {
    const oldLinks = this.links
    const oldCurIndex = this.curIndex
    const prevLink = oldLinks[oldCurIndex]

    this.links = getAllTopLevelLinks()

    // Factors in the fact that the user may have opened/viewed links
    // BEFORE the current link. Which causes our index to "jump" forward
    const curIndex = this.links.indexOf(prevLink)

    // Simple case: going to next link
    if (curIndex !== -1) {
      const nextIndex = curIndex + delta
      if (nextIndex < 0 || nextIndex >= this.links.length) { return }

      this.resetFocus(curIndex)
      this.setFocus(nextIndex)
      this.curIndex = nextIndex
      return
    }

    // Edgecase: user opened link -> viewed it -> closed it -> proceeds to navigate
    const nextIndex = this.findNextIndexFromDeletedLink(oldLinks, oldCurIndex, delta)
    if (nextIndex === -1) { return }

    this.setFocus(nextIndex)
    this.curIndex = nextIndex
  }

  resetFocus(index) {
    const link = this.links[index]
    if (!link) { return }

    const textNode = link.querySelector('h3')
    if (!textNode) { return }

    textNode.style.fontWeight = ''
    textNode.style.textDecoration = ''
  }

  setFocus(index) {
    // If it's the first link, go all the way to top
    if (index === 0) { window.scrollTo(0, 0) }

    const link = this.links[index]
    if (!link) { return }
    link.focus()

    const textNode = link.querySelector('h3')
    if (!textNode) { return }

    textNode.style.fontWeight = 'bold'
    textNode.style.textDecoration = 'underline'
  }

  isFocusedOnInput() {
    const { activeElement } = document
    if (activeElement === null) return false

    return ['TEXTAREA', 'INPUT'].includes(activeElement.tagName)
  }
}
