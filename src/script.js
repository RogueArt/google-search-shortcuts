import { LinksNavigator } from './navigator.js'

if (document.readyState !== 'complete') {
  // Monitor document as new content loads in
  document.addEventListener('readystatechange', () => {
    if (document.readyState !== 'complete') return
    initializeExtension()
  })
}
else initializeExtension()

function initializeExtension() {
  const navigator = new LinksNavigator()
  document.addEventListener('keydown', async event => {
    const { key } = event

    // Don't do anything if on search bar
    if (navigator.isFocusedOnInput()) return

    // Key-based navigation:
    if (key === 'k') navigator.goToLinkAbove()
    if (key === 'j') navigator.goToLinkBelow()
  })
}