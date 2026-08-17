/** @typedef {import('./types.js').LinkGroup} LinkGroup */
/** @typedef {import('./types.js').NavigationCommand} NavigationCommand */
/** @typedef {import('./types.js').NavigationGroup} NavigationGroup */
/** @typedef {import('./types.js').NavigationIndex} NavigationIndex */
/** @typedef {import('./types.js').Occurrence} Occurrence */
/** @typedef {import('./types.js').OccurrenceKind} OccurrenceKind */

/** @param {HTMLAnchorElement} element */
function normalizedText(element) {
  return (element && element.textContent ? element.textContent : '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** @param {HTMLAnchorElement} link */
function linkIdentity(link) {
  const href = link && link.getAttribute ? link.getAttribute('href') || '' : ''
  return `${href}\n${normalizedText(link)}`
}

/**
 * @param {HTMLAnchorElement} element
 * @param {NavigationGroup} group
 * @param {OccurrenceKind} kind
 * @returns {Occurrence}
 */
function createOccurrence(element, group, kind) {
  const ownKey = linkIdentity(element)
  const ownerKey = linkIdentity(group.mainElement)

  return {
    element,
    group,
    kind,
    semanticKey: kind === 'main'
      ? `main\n${ownKey}`
      : `detail\n${ownerKey}\n${ownKey}`,
    semanticOrdinal: 0,
    semanticCount: 1,
  }
}

/** @param {Occurrence[]} occurrences */
function assignSemanticCounts(occurrences) {
  const counts = new Map()

  for (const occurrence of occurrences) {
    const count = counts.get(occurrence.semanticKey) || 0
    occurrence.semanticOrdinal = count
    counts.set(occurrence.semanticKey, count + 1)
  }

  for (const occurrence of occurrences) {
    occurrence.semanticCount = counts.get(occurrence.semanticKey)
  }
}

/**
 * @param {LinkGroup[]} linkGroups
 * @returns {NavigationIndex}
 */
export function createNavigationIndex(linkGroups) {
  const groups = linkGroups.map((linkGroup, index) => {
    return {
      index,
      mainElement: linkGroup.mainLink,
      main: null,
      details: [],
    }
  })

  const mainOrder = []
  const detailedOrder = []

  for (const group of groups) {
    const source = linkGroups[group.index]
    group.main = createOccurrence(source.mainLink, group, 'main')
    group.details = source.subLinks.map(link => {
      return createOccurrence(link, group, 'detail')
    })

    mainOrder.push(group.main)
    detailedOrder.push(group.main, ...group.details)
  }

  assignSemanticCounts(detailedOrder)

  return { groups, mainOrder, detailedOrder }
}

/**
 * @param {NavigationIndex} index
 * @param {Occurrence | null} previous
 * @returns {Occurrence | null}
 */
export function findEquivalentOccurrence(index, previous) {
  if (!previous) return null

  const exact = index.detailedOrder.find(occurrence => {
    return (
      occurrence.element === previous.element
      && occurrence.kind === previous.kind
      && occurrence.group.mainElement === previous.group.mainElement
    )
  })
  if (exact) return exact

  const semanticMatches = index.detailedOrder.filter(occurrence => {
    return occurrence.semanticKey === previous.semanticKey
  })

  if (previous.semanticCount !== 1 || semanticMatches.length !== 1) return null
  return semanticMatches[0]
}

/**
 * @param {NavigationIndex} index
 * @param {Occurrence} previous
 * @returns {Occurrence | null}
 */
function findRecoveryEquivalent(index, previous) {
  const equivalent = findEquivalentOccurrence(index, previous)
  if (equivalent) return equivalent

  if (previous.semanticCount <= 1) return null

  const semanticMatches = index.detailedOrder.filter(occurrence => {
    return occurrence.semanticKey === previous.semanticKey
  })
  if (semanticMatches.length === 0) return null

  return semanticMatches[
    Math.min(previous.semanticOrdinal, semanticMatches.length - 1)
  ]
}

/**
 * @param {NavigationIndex} index
 * @param {Element | null} element
 * @param {Occurrence | null} [preferred]
 * @returns {Occurrence | null}
 */
export function findOccurrenceByElement(index, element, preferred = null) {
  if (!element) return null

  const matches = index.detailedOrder.filter(occurrence => {
    return occurrence.element === element
  })
  if (matches.length === 0) return null
  if (!preferred) return matches[0]

  return matches.find(occurrence => {
    return (
      occurrence.kind === preferred.kind
      && occurrence.group.mainElement === preferred.group.mainElement
    )
  }) || matches[0]
}

/**
 * @param {NavigationIndex} index
 * @param {Occurrence | null} current
 * @param {NavigationCommand} command
 * @returns {Occurrence | null}
 */
export function getMovementTarget(index, current, command) {
  if (!current || !command || ![-1, 1].includes(command.delta)) return null

  if (command.scope === 'detailed') {
    const currentIndex = index.detailedOrder.indexOf(current)
    return index.detailedOrder[currentIndex + command.delta] || null
  }

  if (command.scope !== 'main') return null

  let targetGroupIndex
  if (current.kind === 'main') {
    targetGroupIndex = current.group.index + command.delta
  } else {
    targetGroupIndex = command.delta < 0
      ? current.group.index
      : current.group.index + 1
  }

  const targetGroup = index.groups[targetGroupIndex]
  return targetGroup ? targetGroup.main : null
}

/**
 * @param {NavigationIndex} previousIndex
 * @param {NavigationIndex} nextIndex
 * @param {Occurrence} current
 * @param {NavigationCommand} command
 * @returns {Occurrence | null}
 */
function findDirectionalRecovery(previousIndex, nextIndex, current, command) {
  if (command.scope === 'detailed') {
    const oldPosition = previousIndex.detailedOrder.indexOf(current)

    for (
      let index = oldPosition + command.delta;
      index >= 0 && index < previousIndex.detailedOrder.length;
      index += command.delta
    ) {
      const match = findRecoveryEquivalent(
        nextIndex,
        previousIndex.detailedOrder[index],
      )
      if (match) return match
    }

    return null
  }

  const firstCandidate = getMovementTarget(previousIndex, current, command)
  if (!firstCandidate) return null

  for (
    let groupIndex = firstCandidate.group.index;
    groupIndex >= 0 && groupIndex < previousIndex.groups.length;
    groupIndex += command.delta
  ) {
    const match = findRecoveryEquivalent(
      nextIndex,
      previousIndex.groups[groupIndex].main,
    )
    if (match) return match
  }

  return null
}

/**
 * @param {NavigationIndex} previousIndex
 * @param {NavigationIndex} nextIndex
 * @param {Occurrence} current
 * @param {NavigationCommand} command
 * @returns {Occurrence | null}
 */
function findBoundaryRecovery(previousIndex, nextIndex, current, command) {
  const previousOrder = command.scope === 'detailed'
    ? previousIndex.detailedOrder
    : previousIndex.mainOrder
  const nextOrder = command.scope === 'detailed'
    ? nextIndex.detailedOrder
    : nextIndex.mainOrder

  if (nextOrder.length === 0) return null

  let oldPosition = previousOrder.indexOf(current)
  if (oldPosition === -1) oldPosition = current.group.index

  const candidateIndex = command.delta > 0
    ? Math.min(oldPosition, nextOrder.length - 1)
    : Math.max(0, Math.min(oldPosition - 1, nextOrder.length - 1))

  return nextOrder[candidateIndex]
}

/**
 * @param {NavigationIndex} previousIndex
 * @param {Occurrence | null} current
 * @param {NavigationIndex} nextIndex
 * @param {NavigationCommand} command
 */
export function resolveMovement(
  previousIndex,
  current,
  nextIndex,
  command,
) {
  if (nextIndex.mainOrder.length === 0) {
    return {
      index: previousIndex,
      cursor: current,
      target: null,
      recovered: false,
    }
  }

  if (!current || previousIndex.mainOrder.length === 0) {
    const first = nextIndex.mainOrder[0]
    return {
      index: nextIndex,
      cursor: first,
      target: first,
      recovered: true,
    }
  }

  const refreshedCurrent = findEquivalentOccurrence(nextIndex, current)
  if (refreshedCurrent) {
    const target = getMovementTarget(nextIndex, refreshedCurrent, command)
    return {
      index: nextIndex,
      cursor: target || refreshedCurrent,
      target,
      recovered: false,
    }
  }

  const recovered = findDirectionalRecovery(
    previousIndex,
    nextIndex,
    current,
    command,
  ) || findBoundaryRecovery(
    previousIndex,
    nextIndex,
    current,
    command,
  )

  return {
    index: nextIndex,
    cursor: recovered,
    target: recovered,
    recovered: true,
  }
}
