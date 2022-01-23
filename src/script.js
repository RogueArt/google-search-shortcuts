import { filterRelatedQuestionLinks, getAllTopLevelLinks, setFocus, resetFocus } from './utils.js'

let links = filterRelatedQuestionLinks(getAllTopLevelLinks())

let index = 0
setFocus(links[0])

// Check if focused on search bar
function focusedOnSearchBar() {
  return document.activeElement.tagName === 'INPUT'
}

document.addEventListener('keydown', async event => {
  const { key } = event

  // Don't do anything if on search bar
  if (focusedOnSearchBar()) return

  // Make sure we can access all 10 questions
  if (links.length < 10) {
    links = filterRelatedQuestionLinks(getAllTopLevelLinks())
  }

  // Go to link above
  if (key === 'k') {
    if (index === 0) return

    // Reset style of current
    resetFocus(links[index])
    setFocus(links[index - 1])

    // Decrease index by one
    index -= 1

    // Scroll to top if hit first link
    if (index === 0) window.scrollTo(0, 0)
  }

  // Go to link below
  if (key === 'j') {
    if (index === links.length - 1) return

    resetFocus(links[index])
    setFocus(links[index + 1])
    index += 1

    // Scroll to bottom if hit first link
    // if (index === links.length - 1) window.scrollTo(0, document.body.scrollHeight)
  }
})