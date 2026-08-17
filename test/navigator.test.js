import assert from 'node:assert/strict'
import test from 'node:test'

import { ACTIONS } from '../src/actions.js'
import {
  HIGHLIGHT_CLASS,
  LinksNavigator,
  isEditing,
} from '../src/navigator.js'
import { createDom } from '../test-support/dom.js'

function makeGroup(documentRef, id, detailIds = []) {
  const mainLink = documentRef.createElement('a')
  mainLink.href = `https://example.com/${id}`
  mainLink.dataset.id = id
  const heading = documentRef.createElement('h3')
  heading.textContent = id
  mainLink.append(heading)

  const subLinks = detailIds.map(detailId => {
    const link = documentRef.createElement('a')
    link.href = `https://example.com/${detailId}`
    link.dataset.id = detailId
    const label = documentRef.createElement('span')
    label.textContent = detailId
    link.append(label)
    return link
  })

  documentRef.body.append(mainLink, ...subLinks)
  return { mainLink, subLinks }
}

function setupNavigator(initialGroups) {
  const { window } = createDom()
  let animationFrame = null
  const scrollCalls = []
  window.requestAnimationFrame = callback => {
    animationFrame = callback
    return 1
  }
  window.scrollTo = (...args) => scrollCalls.push(args)

  let groups = initialGroups(window.document)
  const navigator = new LinksNavigator({
    documentRef: window.document,
    windowRef: window,
    collectGroups: () => groups,
  })

  return {
    window,
    navigator,
    runAnimationFrame: () => animationFrame(),
    setGroups: value => { groups = value },
    scrollCalls,
  }
}

test('initialization focuses the real first anchor and marks only its label', () => {
  const setup = setupNavigator(documentRef => [
    makeGroup(documentRef, 'A'),
    makeGroup(documentRef, 'B'),
  ])

  setup.runAnimationFrame()

  assert.equal(setup.window.document.activeElement.dataset.id, 'A')
  assert.equal(
    setup.window.document.querySelector('h3').classList.contains(HIGHLIGHT_CLASS),
    true,
  )
  assert.deepEqual(setup.scrollCalls, [[0, 0]])
})

test('moving removes only the extension class and preserves authored inline styles', () => {
  const setup = setupNavigator(documentRef => {
    const first = makeGroup(documentRef, 'A')
    first.mainLink.querySelector('h3').style.fontWeight = '500'
    return [first, makeGroup(documentRef, 'B')]
  })
  setup.runAnimationFrame()
  const firstHeading = setup.window.document.querySelector('h3')

  setup.navigator.move(ACTIONS.nextMain.command)

  assert.equal(firstHeading.classList.contains(HIGHLIGHT_CLASS), false)
  assert.equal(firstHeading.style.fontWeight, '500')
  assert.equal(setup.window.document.activeElement.dataset.id, 'B')
})

test('navigation recovers when results appear after an initially empty scan', () => {
  const setup = setupNavigator(() => [])
  setup.runAnimationFrame()
  const first = makeGroup(setup.window.document, 'A')
  setup.setGroups([first, makeGroup(setup.window.document, 'B')])

  setup.navigator.move(ACTIONS.nextMain.command)

  assert.equal(setup.window.document.activeElement.dataset.id, 'A')
})

test('removing the current result consumes one move without skipping a survivor', () => {
  let fixture
  const setup = setupNavigator(documentRef => {
    fixture = [
      makeGroup(documentRef, 'A'),
      makeGroup(documentRef, 'B'),
      makeGroup(documentRef, 'C'),
    ]
    return fixture
  })
  setup.runAnimationFrame()
  setup.navigator.select(setup.navigator.index.groups[1].main)
  fixture[1].mainLink.remove()
  setup.setGroups([fixture[0], fixture[2]])

  setup.navigator.move(ACTIONS.nextMain.command)

  assert.equal(setup.window.document.activeElement.dataset.id, 'C')
})

test('recognized external anchor focus becomes the navigation source of truth', () => {
  const setup = setupNavigator(documentRef => [
    makeGroup(documentRef, 'A'),
    makeGroup(documentRef, 'B'),
    makeGroup(documentRef, 'C'),
  ])
  setup.runAnimationFrame()
  const third = setup.navigator.index.groups[2].main.element
  third.focus()

  setup.navigator.move(ACTIONS.prevMain.command)

  assert.equal(setup.window.document.activeElement.dataset.id, 'B')
})

test('external focus at a boundary synchronizes the marker without wrapping', () => {
  const setup = setupNavigator(documentRef => [
    makeGroup(documentRef, 'A'),
    makeGroup(documentRef, 'B'),
    makeGroup(documentRef, 'C'),
  ])
  setup.runAnimationFrame()
  const third = setup.navigator.index.groups[2].main.element
  third.focus()

  const moved = setup.navigator.move(ACTIONS.nextMain.command)

  assert.equal(moved, false)
  assert.equal(third.querySelector('h3').classList.contains(HIGHLIGHT_CLASS), true)
  assert.equal(
    setup.navigator.index.groups[0].main.element
      .querySelector('h3')
      .classList.contains(HIGHLIGHT_CLASS),
    false,
  )
})

test('a replaced label inside the same active anchor is re-marked at a boundary', () => {
  const setup = setupNavigator(documentRef => [
    makeGroup(documentRef, 'A'),
    makeGroup(documentRef, 'B'),
  ])
  setup.runAnimationFrame()
  const first = setup.navigator.index.groups[0].main.element
  const oldHeading = first.querySelector('h3')
  const newHeading = setup.window.document.createElement('h3')
  newHeading.textContent = 'A replacement'
  oldHeading.replaceWith(newHeading)

  setup.navigator.move(ACTIONS.prevMain.command)

  assert.equal(newHeading.classList.contains(HIGHLIGHT_CLASS), true)
  assert.equal(oldHeading.classList.contains(HIGHLIGHT_CLASS), false)
})

test('editable controls include contenteditable and ARIA textboxes', () => {
  const { window } = createDom(`
    <div id="editor" contenteditable="true"></div>
    <div id="textbox" role="textbox"></div>
    <button id="button"></button>
  `)
  const editor = window.document.getElementById('editor')
  Object.defineProperty(editor, 'isContentEditable', { value: true })

  assert.equal(isEditing(window.document, editor), true)
  assert.equal(isEditing(
    window.document,
    window.document.getElementById('textbox'),
  ), true)
  assert.equal(isEditing(
    window.document,
    window.document.getElementById('button'),
  ), false)
})
