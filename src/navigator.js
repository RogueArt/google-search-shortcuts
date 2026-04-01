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

  goToLinkAbove() { this.moveFocusTo(this.curIndex - 1) }
  goToLinkBelow() { this.moveFocusTo(this.curIndex + 1) }

  moveFocusTo(toIndex) {
    if (toIndex < 0 || toIndex >= this.links.length) return

    this.resetFocus(this.curIndex)
    this.setFocus(toIndex)
    this.curIndex = toIndex
  }

  resetFocus(index) {
    const link = this.links[index]
    const textNode = link.querySelector('h3')
    if (!textNode) return

    textNode.style.fontWeight = ''
    textNode.style.textDecoration = ''
  }

  setFocus(index) {
    // If it's the first link, go all the way to top
    if (index === 0) { window.scrollTo(0, 0) }

    const link = this.links[index]
    link.focus()

    const textNode = link.querySelector('h3')
    if (!textNode) return

    textNode.style.fontWeight = 'bold'
    textNode.style.textDecoration = 'underline'
  }

  isFocusedOnInput() {
    const { activeElement } = document
    if (activeElement === null) return false

    return ['TEXTAREA', 'INPUT'].includes(activeElement.tagName)
  }
}
