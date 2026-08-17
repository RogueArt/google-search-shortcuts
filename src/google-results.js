const ROW_TOLERANCE_PX = 4

function createScanContext() {
  return {
    rects: new WeakMap(),
    styles: new WeakMap(),
    visibility: new WeakMap(),
  }
}

function getNormalizedText(element) {
  return (element && element.textContent ? element.textContent : '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getElementRect(element, scan = null) {
  if (scan && scan.rects.has(element)) return scan.rects.get(element)

  const rect = element.getBoundingClientRect()
  let result = rect

  if (rect.width <= 0 || rect.height <= 0) {
    const clientRects = element.getClientRects()
    result = clientRects.length > 0 ? clientRects[0] : rect
  }

  if (scan) scan.rects.set(element, result)
  return result
}

function getStyle(element, scan = null) {
  if (scan && scan.styles.has(element)) return scan.styles.get(element)

  const view = element.ownerDocument && element.ownerDocument.defaultView
  const style = view ? view.getComputedStyle(element) : null
  if (scan) scan.styles.set(element, style)
  return style
}

function clipsAxis(value) {
  return ['auto', 'clip', 'hidden', 'scroll'].includes(value)
}

function isEffectivelyHidden(element, scan) {
  let current = element

  while (current && current.nodeType === 1) {
    const style = getStyle(current, scan)
    if (
      current.hidden
      || current.hasAttribute('inert')
      || current.getAttribute('aria-hidden') === 'true'
      || (style && (
        style.display === 'none'
        || style.visibility === 'hidden'
        || style.visibility === 'collapse'
        || style.opacity === '0'
      ))
    ) {
      return true
    }

    current = current.parentElement
  }

  return false
}

function isClippedByAncestor(element, rect, scan) {
  let ancestor = element.parentElement
  const documentElement = element.ownerDocument.documentElement
  const body = element.ownerDocument.body
  let visibleLeft = rect.left
  let visibleRight = rect.right
  let visibleTop = rect.top
  let visibleBottom = rect.bottom

  while (ancestor && ancestor !== documentElement && ancestor !== body) {
    const style = getStyle(ancestor, scan)
    const ancestorRect = getElementRect(ancestor, scan)

    const clipsX = style && (
      clipsAxis(style.overflowX) || clipsAxis(style.overflow)
    )
    const clipsY = style && (
      clipsAxis(style.overflowY) || clipsAxis(style.overflow)
    )

    if (clipsX) {
      if (ancestorRect.width <= 0) return true
      visibleLeft = Math.max(visibleLeft, ancestorRect.left)
      visibleRight = Math.min(visibleRight, ancestorRect.right)
    }

    if (clipsY) {
      if (ancestorRect.height <= 0) return true
      visibleTop = Math.max(visibleTop, ancestorRect.top)
      visibleBottom = Math.min(visibleBottom, ancestorRect.bottom)
    }

    ancestor = ancestor.parentElement
  }

  const visibleWidth = Math.max(0, visibleRight - visibleLeft)
  const visibleHeight = Math.max(0, visibleBottom - visibleTop)
  const minimumWidth = Math.min(8, rect.width * 0.25)
  const minimumHeight = Math.min(8, rect.height * 0.25)

  return visibleWidth < minimumWidth || visibleHeight < minimumHeight
}

export function isActionablyVisible(element, scan = null) {
  if (scan && scan.visibility.has(element)) {
    return scan.visibility.get(element)
  }

  if (!element || element.getClientRects().length === 0) return false

  if (isEffectivelyHidden(element, scan)) {
    if (scan) scan.visibility.set(element, false)
    return false
  }

  const rect = getElementRect(element, scan)
  const visible = (
    rect.width > 0
    && rect.height > 0
    && !isClippedByAncestor(element, rect, scan)
  )

  if (scan) scan.visibility.set(element, visible)
  return visible
}

function visuallySort(elements, domOrder, scan) {
  const positioned = elements.map(element => ({
    element,
    rect: getElementRect(element, scan),
    domIndex: domOrder.get(element),
  })).sort((left, right) => {
    return left.rect.top - right.rect.top || left.domIndex - right.domIndex
  })

  const rows = []
  for (const item of positioned) {
    const currentRow = rows[rows.length - 1]

    if (!currentRow || item.rect.top - currentRow.top > ROW_TOLERANCE_PX) {
      rows.push({ top: item.rect.top, items: [item] })
    } else {
      currentRow.items.push(item)
    }
  }

  const ordered = []
  for (const row of rows) {
    row.items.sort((left, right) => {
      return left.rect.left - right.rect.left || left.domIndex - right.domIndex
    })
    ordered.push(...row.items.map(item => item.element))
  }

  return ordered
}

function topmostScore(element, scan) {
  const documentRef = element.ownerDocument
  const style = getStyle(element, scan)
  if (style && style.pointerEvents === 'none') return -1
  if (typeof documentRef.elementFromPoint !== 'function') return 0

  const rect = getElementRect(element, scan)
  const x = rect.left + (rect.width / 2)
  const y = rect.top + (rect.height / 2)
  const view = documentRef.defaultView

  if (x < 0 || y < 0 || x >= view.innerWidth || y >= view.innerHeight) return 0

  const hit = documentRef.elementFromPoint(x, y)
  return hit && (hit === element || element.contains(hit)) ? 1 : 0
}

function removeGeometryDuplicates(elements, scan) {
  const unique = []

  for (const element of elements) {
    const duplicateIndex = unique.findIndex(existing => {
      return hasCompetingGeometry(existing, element, scan)
    })

    if (duplicateIndex === -1) {
      unique.push(element)
    } else if (
      topmostScore(element, scan) > topmostScore(unique[duplicateIndex], scan)
    ) {
      unique[duplicateIndex] = element
    }
  }

  return unique
}

function getResultContainer(link, resultsRoot) {
  let current = link

  while (current && current.parentElement) {
    if (current.parentElement === resultsRoot) return current
    current = current.parentElement
  }

  return null
}

function getUniqueMainScope(mainLink, container, containerMainLinks) {
  if (containerMainLinks.length === 1) return container

  let scope = mainLink
  let ancestor = mainLink.parentElement

  while (ancestor && ancestor !== container) {
    const containedMains = containerMainLinks.filter(link => ancestor.contains(link))
    if (containedMains.length !== 1) break

    scope = ancestor
    ancestor = ancestor.parentElement
  }

  return scope
}

function hasClasslessSpan(link) {
  return [...link.querySelectorAll('span')].some(span => {
    return span.className === '' && getNormalizedText(span) !== ''
  })
}

function hasCompetingGeometry(left, right, scan) {
  const leftRect = getElementRect(left, scan)
  const rightRect = getElementRect(right, scan)
  if (Math.abs(leftRect.top - rightRect.top) > ROW_TOLERANCE_PX) return false

  const overlapWidth = Math.max(
    0,
    Math.min(leftRect.right, rightRect.right)
      - Math.max(leftRect.left, rightRect.left),
  )
  const overlapHeight = Math.max(
    0,
    Math.min(leftRect.bottom, rightRect.bottom)
      - Math.max(leftRect.top, rightRect.top),
  )
  const smallerArea = Math.min(
    leftRect.width * leftRect.height,
    rightRect.width * rightRect.height,
  )

  return smallerArea > 0 && (overlapWidth * overlapHeight) / smallerArea >= 0.9
}

function isMainLink(link, scan) {
  return (
    link.hasAttribute('href')
    && link.querySelector('h3') !== null
    && isActionablyVisible(link, scan)
  )
}

function isValidSubLink(link, mainLink, scope, scan) {
  if (link === mainLink || !link.hasAttribute('href')) return false
  if (!scope.contains(link)) return false
  if (link.querySelector('h3') !== null) return false
  if (!isActionablyVisible(link, scan)) return false
  if (hasCompetingGeometry(link, mainLink, scan)) return false

  const linkRect = getElementRect(link, scan)
  const mainRect = getElementRect(mainLink, scan)
  if (linkRect.top < mainRect.top - ROW_TOLERANCE_PX) return false

  const text = getNormalizedText(link)
  if (text === '' || text === 'Read more') return false
  if (/^\d+\s+answers?$/.test(text)) return false
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) return false

  return hasClasslessSpan(link)
}

export function getAllTopLevelLinks(root = document) {
  const resultsRoot = root.querySelector('#rso')
  if (!resultsRoot) return []

  const anchors = [...resultsRoot.querySelectorAll('a')]
  const domOrder = new Map(anchors.map((link, index) => [link, index]))
  const scan = createScanContext()
  return removeGeometryDuplicates(
    visuallySort(anchors.filter(link => isMainLink(link, scan)), domOrder, scan),
    scan,
  )
}

export function getAllLinkGroups(root = document) {
  const resultsRoot = root.querySelector('#rso')
  if (!resultsRoot) return []

  const anchors = [...resultsRoot.querySelectorAll('a')]
  const domOrder = new Map(anchors.map((link, index) => [link, index]))
  const scan = createScanContext()
  const mainLinks = removeGeometryDuplicates(
    visuallySort(anchors.filter(link => isMainLink(link, scan)), domOrder, scan),
    scan,
  )
  const mainsByContainer = new Map()

  for (const mainLink of mainLinks) {
    const container = getResultContainer(mainLink, resultsRoot)
    if (!container) continue

    const containedMains = mainsByContainer.get(container) || []
    containedMains.push(mainLink)
    mainsByContainer.set(container, containedMains)
  }

  return mainLinks.map(mainLink => {
    const container = getResultContainer(mainLink, resultsRoot)
    if (!container) return null

    const scope = getUniqueMainScope(
      mainLink,
      container,
      mainsByContainer.get(container),
    )
    const subLinks = removeGeometryDuplicates(
      visuallySort(
        [...scope.querySelectorAll('a')].filter(link => {
          return isValidSubLink(link, mainLink, scope, scan)
        }),
        domOrder,
        scan,
      ),
      scan,
    )

    return { mainLink, subLinks }
  }).filter(Boolean)
}

export function getLinkTextNode(link) {
  const heading = link.querySelector('h3')
  if (heading) return heading

  const classlessSpan = [...link.querySelectorAll('span')].find(span => {
    return span.className === '' && getNormalizedText(span) !== ''
  })

  return classlessSpan || link.querySelector('span')
}
