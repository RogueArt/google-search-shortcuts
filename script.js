 function getTopLevelLinks() {
  return Array.from(document.querySelectorAll('a > h3'))
}
// Get only links that aren't the related question pair links
 function getVisibleTopLevelLinks() {
  const [idx, len] = getRelatedQuestionIndex()

  // Remove len elements starting at idx
  const topLevelLinks = getTopLevelLinks()
  topLevelLinks.splice(idx, len)

  return topLevelLinks
}

// <============= UTILS =============>
// Check if focused on search bar
 function focusedOnSearchBar() {
  return document.activeElement.tagName === 'INPUT'
}

document.addEventListener('keydown', event => {
  // Do nothing if focused on search bar
  if (focusedOnSearchBar()) return

  // Get what key was pressed and if shift pressed
  const { key, shiftKey } = event
  // Case 2: Pressed a number
  else if (keyIsNumber) {
    const visibleLinks = getVisibleTopLevelLinks()
    const index = convertKeyToIndex(key)
    visibleLinks[index - 1].click()
  }

})
