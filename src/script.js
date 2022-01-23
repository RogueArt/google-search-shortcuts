import { LinksNavigator } from './navigator.js'

// Check if the document is already complete
if (document.readyState !== 'complete') {
  // Monitor document as new content loads in
  document.addEventListener('readystatechange', () => {
    // Wait until document is complete before initializing
    if (document.readyState !== 'complete') return
    initializeExtension()
  })
}
else initializeExtension()

// Load everything we need for the extension here
function initializeExtension() {
  const navigator = new LinksNavigator()
  document.addEventListener('keydown', async event => {
    const { key } = event

    // Don't do anything if on search bar
    if (navigator.isFocusedOnSearchBar()) return

    // Navigate based on key
    if (key === 'k') navigator.goToLinkAbove()
    if (key === 'j') navigator.goToLinkBelow()
  })
}