// Gets all top level links in the page
export function getAllTopLevelLinks() {
  const links = Array.from(document.querySelectorAll('a'))
  const topLevelLinks = links.filter(link => {
    return link.querySelector('h3') !== null
  })
  return topLevelLinks
}

// Filter out related question links
export function filterRelatedQuestionLinks(links) {
  // Get all related questions that pop up on Google
  const relatedQuestionDiv = Array.from(
    document.querySelectorAll('.related-question-pair')
  )

  // Return links directly if no related questions
  if (relatedQuestionDiv.length === 0) return links

  // Get the first link within one of these divs
  const firstRelatedLink = relatedQuestionDiv[0].querySelector('a')

  // Get the first related link's index in our array
  const firstRelatedLinkIdx = links.findIndex(node => node === firstRelatedLink)

  // Trim as many related questions there are
  const trimAmount = relatedQuestionDiv.length
  links.splice(firstRelatedLinkIdx, trimAmount)

  // Return the filtered links
  return links
}

// Sets the link back to white
export function resetFocus(link) {
  const textNode = link.getElementsByTagName('h3')[0]
  textNode.style.fontWeight = ''
  textNode.style.textDecoration = ''
}

// Sets the link back to red
export function setFocus(link, goingDown) {
  const { top } = link.getBoundingClientRect()
  window.scrollTo(0, top + window.scrollY + (goingDown ? 50 : -50))

  const textNode = link.getElementsByTagName('h3')[0]
  textNode.style.fontWeight = 'bold'
  textNode.style.textDecoration = 'underline'
}

console.log('Hello from utils.js')