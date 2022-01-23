import { LinksNavigator } from './navigator.js'

// Monitor document as new content loads in
document.addEventListener('readystatechange', (event) => {
  // Wait until document is complete
  if (document.readyState !== 'complete') return

  const navigator = new LinksNavigator() 
  document.addEventListener('keydown', async event => {
    const { key } = event

    // Don't do anything if on search bar
    if (navigator.isFocusedOnSearchBar()) return

    // Navigate based on key
    if (key === 'k') navigator.goToLinkAbove()
    if (key === 'j') navigator.goToLinkBelow()
  })
})