import assert from 'node:assert/strict'
import test from 'node:test'

import { ACTIONS } from '../src/actions.js'
import {
  createNavigationIndex,
  findEquivalentOccurrence,
  getMovementTarget,
  resolveMovement,
} from '../src/navigation-index.js'
import { createDom, group } from '../test-support/dom.js'

const id = occurrence => occurrence && occurrence.element.dataset.id

function fixture(documentRef) {
  return createNavigationIndex([
    group(documentRef, 'A', ['a1', 'a2']),
    group(documentRef, 'B'),
    group(documentRef, 'C', ['c1']),
  ])
}

test('detailed navigation follows main and sublink visual sequence', () => {
  const { window } = createDom()
  const index = fixture(window.document)
  const command = ACTIONS.nextDetailed.command
  const visited = [index.detailedOrder[0]]

  while (true) {
    const next = getMovementTarget(index, visited.at(-1), command)
    if (!next) break
    visited.push(next)
  }

  assert.deepEqual(visited.map(id), ['A', 'a1', 'a2', 'B', 'C', 'c1'])
  assert.equal(getMovementTarget(index, visited.at(-1), command), null)
})

test('main navigation from a sublink retains its asymmetric parity behavior', () => {
  const { window } = createDom()
  const index = fixture(window.document)
  const a2 = index.groups[0].details[1]

  assert.equal(id(getMovementTarget(index, a2, ACTIONS.prevMain.command)), 'A')
  assert.equal(id(getMovementTarget(index, a2, ACTIONS.nextMain.command)), 'B')
})

test('detailed navigation reverses from a main to the previous deepest item', () => {
  const { window } = createDom()
  const index = fixture(window.document)

  assert.equal(
    id(getMovementTarget(index, index.groups[2].main, ACTIONS.prevDetailed.command)),
    'B',
  )
  assert.equal(
    id(getMovementTarget(index, index.groups[1].main, ACTIONS.prevDetailed.command)),
    'a2',
  )
})

test('deleted current main recovers to one directional survivor without skipping', () => {
  const { window } = createDom()
  const previous = fixture(window.document)
  const next = createNavigationIndex([
    { mainLink: previous.groups[0].mainElement, subLinks: [] },
    { mainLink: previous.groups[2].mainElement, subLinks: [] },
  ])

  const down = resolveMovement(
    previous,
    previous.groups[1].main,
    next,
    ACTIONS.nextMain.command,
  )
  const up = resolveMovement(
    previous,
    previous.groups[1].main,
    next,
    ACTIONS.prevMain.command,
  )

  assert.equal(id(down.target), 'C')
  assert.equal(id(up.target), 'A')
  assert.equal(down.recovered, true)
})

test('deleted sublink recovers within detailed order in the requested direction', () => {
  const { window } = createDom()
  const previous = fixture(window.document)
  const next = createNavigationIndex([
    {
      mainLink: previous.groups[0].mainElement,
      subLinks: [previous.groups[0].details[1].element],
    },
    { mainLink: previous.groups[1].mainElement, subLinks: [] },
    { mainLink: previous.groups[2].mainElement, subLinks: [] },
  ])

  assert.equal(id(resolveMovement(
    previous,
    previous.groups[0].details[0],
    next,
    ACTIONS.nextDetailed.command,
  ).target), 'a2')
  assert.equal(id(resolveMovement(
    previous,
    previous.groups[0].details[0],
    next,
    ACTIONS.prevDetailed.command,
  ).target), 'A')
})

test('a transient initial empty result set recovers to the first main', () => {
  const { window } = createDom()
  const empty = createNavigationIndex([])
  const populated = fixture(window.document)

  for (const command of [ACTIONS.nextMain.command, ACTIONS.prevMain.command]) {
    const movement = resolveMovement(empty, null, populated, command)
    assert.equal(id(movement.target), 'A')
  }
})

test('semantic identity survives a wholesale DOM replacement before moving', () => {
  const oldDom = createDom()
  const newDom = createDom()
  const previous = fixture(oldDom.window.document)
  const next = fixture(newDom.window.document)
  const refreshedB = findEquivalentOccurrence(next, previous.groups[1].main)

  assert.equal(id(refreshedB), 'B')
  assert.notEqual(refreshedB.element, previous.groups[1].main.element)

  const movement = resolveMovement(
    previous,
    previous.groups[1].main,
    next,
    ACTIONS.nextMain.command,
  )
  assert.equal(id(movement.target), 'C')
  assert.equal(movement.recovered, false)
})

test('inserting a result before the current item does not change relative movement', () => {
  const { window } = createDom()
  const previous = fixture(window.document)
  const next = createNavigationIndex([
    group(window.document, 'X'),
    { mainLink: previous.groups[0].mainElement, subLinks: [] },
    { mainLink: previous.groups[1].mainElement, subLinks: [] },
    { mainLink: previous.groups[2].mainElement, subLinks: [] },
  ])

  assert.equal(id(resolveMovement(
    previous,
    previous.groups[1].main,
    next,
    ACTIONS.nextMain.command,
  ).target), 'C')
})

test('removing one of several semantically identical results does not skip its survivor', () => {
  const { window } = createDom()
  const duplicates = ['A0', 'A1', 'A2'].map(idValue => {
    const value = group(window.document, idValue)
    value.mainLink.href = 'https://example.com/same'
    value.mainLink.textContent = 'Same result'
    return value
  })
  const resultB = group(window.document, 'B')
  const previous = createNavigationIndex([...duplicates, resultB])
  const next = createNavigationIndex([duplicates[0], duplicates[2], resultB])

  const movement = resolveMovement(
    previous,
    previous.groups[1].main,
    next,
    ACTIONS.nextMain.command,
  )

  assert.equal(id(movement.target), 'A2')
  assert.equal(movement.recovered, true)
})

test('wholesale replacement of duplicate results recovers one position conservatively', () => {
  const oldDom = createDom()
  const newDom = createDom()
  const makeDuplicates = documentRef => ['A0', 'A1', 'A2'].map(idValue => {
    const value = group(documentRef, idValue)
    value.mainLink.href = 'https://example.com/same'
    value.mainLink.textContent = 'Same result'
    return value
  })
  const previous = createNavigationIndex([
    ...makeDuplicates(oldDom.window.document),
    group(oldDom.window.document, 'B'),
  ])
  const next = createNavigationIndex([
    ...makeDuplicates(newDom.window.document),
    group(newDom.window.document, 'B'),
  ])

  const movement = resolveMovement(
    previous,
    previous.groups[1].main,
    next,
    ACTIONS.nextMain.command,
  )

  assert.equal(id(movement.target), 'A2')
  assert.equal(movement.recovered, true)
})

test('a benign-looking href mutation is treated as recovery, not proven survival', () => {
  const { window } = createDom()
  const previous = fixture(window.document)
  const replacement = group(window.document, 'B')
  replacement.mainLink.href = 'https://example.com/B?tracking=changed'
  const next = createNavigationIndex([
    { mainLink: previous.groups[0].mainElement, subLinks: [] },
    replacement,
    { mainLink: previous.groups[2].mainElement, subLinks: [] },
  ])

  const movement = resolveMovement(
    previous,
    previous.groups[1].main,
    next,
    ACTIONS.nextMain.command,
  )

  assert.equal(id(movement.target), 'C')
  assert.equal(movement.recovered, true)
})

test('boundary recovery follows the requested position when a new item replaces it', () => {
  const { window } = createDom()
  const previous = fixture(window.document)
  const inserted = group(window.document, 'X')
  const withoutLast = createNavigationIndex([
    { mainLink: previous.groups[0].mainElement, subLinks: [] },
    { mainLink: previous.groups[1].mainElement, subLinks: [] },
    inserted,
  ])
  const withoutFirst = createNavigationIndex([
    inserted,
    { mainLink: previous.groups[1].mainElement, subLinks: [] },
    { mainLink: previous.groups[2].mainElement, subLinks: [] },
  ])

  assert.equal(id(resolveMovement(
    previous,
    previous.groups[2].main,
    withoutLast,
    ACTIONS.nextMain.command,
  ).target), 'X')
  assert.equal(id(resolveMovement(
    previous,
    previous.groups[0].main,
    withoutFirst,
    ACTIONS.prevMain.command,
  ).target), 'X')
})
