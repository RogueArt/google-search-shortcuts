import { JSDOM } from 'jsdom'

export function createDom(html = '<main id="rso"></main>') {
  const source = /<!doctype html>/i.test(html)
    ? html
    : `<!doctype html><html><body>${html}</body></html>`

  return new JSDOM(source, {
    url: 'https://www.google.com/search?q=test',
    pretendToBeVisual: true,
  })
}

export function rect({ top = 0, left = 0, width = 200, height = 30 } = {}) {
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON() { return this },
  }
}

export function setRect(element, dimensions) {
  const value = rect(dimensions)
  element.getBoundingClientRect = () => value
  element.getClientRects = () => [value]
  return element
}

export function createLink(documentRef, id, text = id) {
  const link = documentRef.createElement('a')
  link.href = `https://example.com/${id}`
  link.dataset.id = id
  link.textContent = text
  return link
}

export function group(documentRef, mainId, detailIds = []) {
  return {
    mainLink: createLink(documentRef, mainId),
    subLinks: detailIds.map(id => createLink(documentRef, id)),
  }
}
