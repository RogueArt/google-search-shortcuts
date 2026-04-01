// Gets all top level links in the page
export function getAllTopLevelLinks() {
  const links = [...document.querySelectorAll('a')]
  const topLevelLinks = links.filter(link => {
    return link.querySelector('h3') !== null
  })

  return topLevelLinks
}
