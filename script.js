 function getTopLevelLinks() {
  return Array.from(document.querySelectorAll('a > h3'))
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
  if (key === 'j') {
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
  if (key === 'k') {
    if (index === links.length - 1) return

    resetFocus(links[index])
    setFocus(links[index + 1])
    index += 1

    // Scroll to bottom if hit first link
    // if (index === links.length - 1) window.scrollTo(0, document.body.scrollHeight)
  }
})

// <============= UTILS =============>
// Check if focused on search bar
 function focusedOnSearchBar() {
  return document.activeElement.tagName === 'INPUT'
}

 function convertKeyToIndex(key) {
  // Convert to int, subtract one for index
  const input = parseInt(key)

  // Return 10 if it's equal to 0
  return input === 0 ? 10 : input
}

document.addEventListener('keydown', event => {
  // Do nothing if focused on search bar
  if (focusedOnSearchBar()) return

  // Get what key was pressed and if shift pressed
  const { key, shiftKey } = event

  // Return if key is not a number or isn't backslash
  const keyIsNumber = !isNaN(parseInt(key))
  const keyIsBackslash = key === '\\'
  if (!keyIsNumber && !keyIsBackslash) return

  // Case 1: Pressed shift + number
  if (shiftKey && keyIsNumber) {
    const relatedLinks = getRelatedQuestionLinks()
    const index = convertKeyToIndex(key)
    relatedLinks[index - 1].click()
  }

  // Case 2: Pressed a number
  else if (keyIsNumber) {
    const visibleLinks = getVisibleTopLevelLinks()
    const index = convertKeyToIndex(key)
    visibleLinks[index - 1].click()
  }

  // Case 3: Pressed backslash \
  else if (keyIsBackslash) {
    // Get all related questions and expand them
    const relatedQuestions = document.querySelectorAll(
      '.related-question-pair > div > div'
    )
    relatedQuestions.forEach(question => question.click())
  }
})
