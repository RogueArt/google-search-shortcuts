// Top-level link = big blue links that show up on search results page
export function getAllTopLevelLinks() {
  const links = [...document.querySelectorAll('a')]
  const topLevelLinks = links.filter(link => {
    return link.querySelector('h3') !== null
  })

  return topLevelLinks
}
