function isVisible(el) {
  return el.getClientRects().length > 0
}

// Top-level link = big blue links that show up on search results page
export function getAllTopLevelLinks() {
  return [...document.querySelectorAll('a')].filter(link => {
    return link.querySelector('h3') !== null && isVisible(link)
  })
}

// Finds the next closest entry to the deleted link
export function findNextIndexFromDeletedLink(oldLinks, oldCurIndex, delta) {
  if (delta > 0) {
    for (let i = oldCurIndex + 1; i < oldLinks.length; i += 1) {
      const newIndex = this.links.indexOf(oldLinks[i])
      if (newIndex !== -1) {
        return newIndex
      }
    }
    return -1
  }

  if (delta < 0) {
    for (let i = oldCurIndex - 1; i >= 0; i -= 1) {
      const newIndex = this.links.indexOf(oldLinks[i])
      if (newIndex !== -1) {
        return newIndex
      }
    }
    return -1
  }

  return -1
}