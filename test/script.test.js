import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initializeExtension,
  startWhenDocumentIsComplete,
} from '../src/script.js'
import { createDom, setRect } from '../test-support/dom.js'

function createBrowserApi(stored = null, getError = null) {
  const listeners = new Set()
  return {
    storage: {
      local: {
        async get() {
          if (getError) throw getError
          return stored ? { shortcuts: stored } : {}
        },
        async set() {},
      },
      onChanged: {
        addListener(listener) { listeners.add(listener) },
        removeListener(listener) { listeners.delete(listener) },
      },
    },
    emitStorageChange(value) {
      for (const listener of listeners) {
        listener({ shortcuts: { newValue: value } }, 'local')
      }
    },
    emitChanges(changes, areaName = 'local') {
      for (const listener of listeners) listener(changes, areaName)
    },
    listenerCount() { return listeners.size },
  }
}

function createSearchPage() {
  const { window } = createDom(`
    <input id="search" />
    <div id="editor" contenteditable="true"></div>
    <main id="rso">
      <article><a id="A" href="https://example.com/A"><h3>A</h3></a></article>
      <article><a id="B" href="https://example.com/B"><h3>B</h3></a></article>
      <article><a id="C" href="https://example.com/C"><h3>C</h3></a></article>
    </main>
  `)
  setRect(window.document.getElementById('A'), { top: 100 })
  setRect(window.document.getElementById('B'), { top: 300 })
  setRect(window.document.getElementById('C'), { top: 500 })
  window.requestAnimationFrame = callback => {
    callback()
    return 1
  }
  window.scrollTo = () => {}
  const editor = window.document.getElementById('editor')
  Object.defineProperty(editor, 'isContentEditable', { value: true })
  return window
}

function createDetailedSearchPage() {
  const { window } = createDom(`
    <main id="rso">
      <article>
        <a id="A" href="https://example.com/A"><h3>A</h3></a>
        <a id="A1" href="https://example.com/A1"><span>A detail</span></a>
      </article>
      <article><a id="B" href="https://example.com/B"><h3>B</h3></a></article>
    </main>
  `)
  setRect(window.document.getElementById('A'), { top: 100 })
  setRect(window.document.getElementById('A1'), { top: 160 })
  setRect(window.document.getElementById('B'), { top: 300 })
  window.requestAnimationFrame = callback => {
    callback()
    return 1
  }
  window.scrollTo = () => {}
  return window
}

function dispatchKey(window, key, modifiers = {}) {
  const event = new window.KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...modifiers,
  })
  window.document.activeElement.dispatchEvent(event)
  return event
}

test('controller dispatches shortcuts, prevents defaults, and cleans up', async () => {
  const window = createSearchPage()
  const browserApi = createBrowserApi()
  const cleanup = await initializeExtension({
    documentRef: window.document,
    windowRef: window,
    browserApi,
  })

  assert.equal(window.document.activeElement.id, 'A')
  const event = dispatchKey(window, 'j')
  assert.equal(event.defaultPrevented, true)
  assert.equal(window.document.activeElement.id, 'B')
  assert.equal(browserApi.listenerCount(), 1)

  cleanup()
  assert.equal(browserApi.listenerCount(), 0)
})

test('input and contenteditable focus suppress navigation without preventing keys', async () => {
  const window = createSearchPage()
  const cleanup = await initializeExtension({
    documentRef: window.document,
    windowRef: window,
    browserApi: createBrowserApi(),
  })

  for (const elementId of ['search', 'editor']) {
    const element = window.document.getElementById(elementId)
    element.focus()
    const event = dispatchKey(window, 'j')
    assert.equal(event.defaultPrevented, false)
    assert.equal(window.document.activeElement, element)
  }

  cleanup()
})

test('storage changes update shortcuts on an open results page', async () => {
  const window = createSearchPage()
  const browserApi = createBrowserApi()
  const cleanup = await initializeExtension({
    documentRef: window.document,
    windowRef: window,
    browserApi,
  })

  browserApi.emitStorageChange({
    nextMain: { key: 'n' },
    prevMain: { key: 'p' },
    nextDetailed: { key: 'n', shiftKey: true },
    prevDetailed: { key: 'p', shiftKey: true },
  })

  assert.equal(dispatchKey(window, 'j').defaultPrevented, false)
  assert.equal(window.document.activeElement.id, 'A')
  assert.equal(dispatchKey(window, 'n').defaultPrevented, true)
  assert.equal(window.document.activeElement.id, 'B')

  cleanup()
})

test('detailed shortcuts traverse a sublink before the next main result', async () => {
  const window = createDetailedSearchPage()
  const cleanup = await initializeExtension({
    documentRef: window.document,
    windowRef: window,
    browserApi: createBrowserApi(),
  })

  assert.equal(window.document.activeElement.id, 'A')
  dispatchKey(window, 'j', { shiftKey: true })
  assert.equal(window.document.activeElement.id, 'A1')
  dispatchKey(window, 'j', { shiftKey: true })
  assert.equal(window.document.activeElement.id, 'B')
  dispatchKey(window, 'k', { shiftKey: true })
  assert.equal(window.document.activeElement.id, 'A1')

  cleanup()
})

test('irrelevant storage changes are ignored and cleanup disables shortcuts', async () => {
  const window = createSearchPage()
  const browserApi = createBrowserApi()
  const cleanup = await initializeExtension({
    documentRef: window.document,
    windowRef: window,
    browserApi,
  })

  browserApi.emitChanges({ otherSetting: { newValue: true } })
  browserApi.emitChanges({ shortcuts: { newValue: {} } }, 'sync')
  dispatchKey(window, 'j')
  assert.equal(window.document.activeElement.id, 'B')

  cleanup()
  const event = dispatchKey(window, 'j')
  assert.equal(event.defaultPrevented, false)
  assert.equal(window.document.activeElement.id, 'B')
})

test('a storage read failure keeps default navigation operational', async () => {
  const window = createSearchPage()
  const warnings = []
  const cleanup = await initializeExtension({
    documentRef: window.document,
    windowRef: window,
    browserApi: createBrowserApi(null, new Error('storage offline')),
    logger: { warn: (...args) => warnings.push(args) },
  })

  dispatchKey(window, 'j')
  assert.equal(window.document.activeElement.id, 'B')
  assert.equal(warnings.length, 1)

  cleanup()
})

test('Enter variants remain unhandled for native Firefox link activation', async () => {
  const window = createSearchPage()
  const cleanup = await initializeExtension({
    documentRef: window.document,
    windowRef: window,
    browserApi: createBrowserApi(),
  })

  for (const modifiers of [
    {},
    { shiftKey: true },
    { ctrlKey: true },
  ]) {
    const event = dispatchKey(window, 'Enter', modifiers)
    assert.equal(event.defaultPrevented, false)
    assert.equal(window.document.activeElement.id, 'A')
  }

  cleanup()
})

test('startup waits for complete and initializes exactly once', async () => {
  const window = createSearchPage()
  const browserApi = createBrowserApi()
  let readyState = 'loading'
  Object.defineProperty(window.document, 'readyState', {
    configurable: true,
    get: () => readyState,
  })

  const started = startWhenDocumentIsComplete({
    documentRef: window.document,
    windowRef: window,
    browserApi,
  })
  assert.equal(browserApi.listenerCount(), 0)

  readyState = 'complete'
  window.document.dispatchEvent(new window.Event('readystatechange'))
  const cleanup = await started

  assert.equal(browserApi.listenerCount(), 1)
  window.document.dispatchEvent(new window.Event('readystatechange'))
  assert.equal(browserApi.listenerCount(), 1)
  cleanup()
})

test('startup initializes immediately when the document is already complete', async () => {
  const window = createSearchPage()
  const browserApi = createBrowserApi()
  Object.defineProperty(window.document, 'readyState', {
    configurable: true,
    value: 'complete',
  })

  const cleanup = await startWhenDocumentIsComplete({
    documentRef: window.document,
    windowRef: window,
    browserApi,
  })

  assert.equal(browserApi.listenerCount(), 1)
  cleanup()
})
