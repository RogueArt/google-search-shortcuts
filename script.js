 function getTopLevelLinks() {
  return Array.from(document.querySelectorAll('a > h3'))
}

 function getRelatedQuestionIndex() {
  // Get all the links on the page
  const allLinkNodes = getTopLevelLinks()
  const questionLinkNodes = getRelatedQuestionLinks()

  // Index to splice from is where first node is equal
  const index = allLinkNodes.findIndex(node => node === questionLinkNodes[0])

  // Return index and how many elements to splice
  return [index, questionLinkNodes.length]
}

 function getRelatedQuestionLinks() {
  // Get all the related questions as nodes, convert to array from NodeList
  const questionPairNodes = document.querySelectorAll('.related-question-pair')
  const questionPairArr = Array.from(questionPairNodes)

  // Return only the links
  return questionPairArr.map(node => node.querySelector('a > h3'))
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
