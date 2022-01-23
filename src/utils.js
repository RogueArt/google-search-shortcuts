// Gets all top level links in the page
export function getAllTopLevelLinks() {
  const links = [...document.querySelectorAll('a')]
  const topLevelLinks = links.filter(link => {
    return link.querySelector('h3') !== null
  })

  return topLevelLinks
}

// Filter out related question links
export function filterRelatedQuestionLinks(links) {
  // Get all related questions that pop up on Google
  const relatedQuestionDiv = [...document.querySelectorAll('.related-question-pair')]

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