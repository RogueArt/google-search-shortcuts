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
