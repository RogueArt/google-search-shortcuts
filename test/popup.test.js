import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { initializePopup } from '../src/popup.js'
import { createDom } from '../test-support/dom.js'

const popupMarkup = await readFile(
  new URL('../src/popup.html', import.meta.url),
  'utf8',
)

function createBrowserApi({ stored = null, getError = null, setError = null } = {}) {
  const writes = []
  return {
    storage: {
      local: {
        async get() {
          if (getError) throw getError
          return stored ? { shortcuts: stored } : {}
        },
        async set(value) {
          if (setError) throw setError
          writes.push(value)
        },
      },
    },
    writes,
  }
}

function press(window, key, modifiers = {}) {
  const event = new window.KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...modifiers,
  })
  window.document.dispatchEvent(event)
  return event
}

const settle = () => new Promise(resolve => setTimeout(resolve, 0))

test('popup renders defaults and saves a recorded shortcut', async () => {
  const { window } = createDom(popupMarkup)
  const browserApi = createBrowserApi()
  const cleanup = await initializePopup({
    documentRef: window.document,
    browserApi,
  })

  assert.equal(window.document.getElementById('nextMain').textContent, 'J')
  assert.equal(
    window.document.querySelector('label[for="nextMain"]').textContent,
    'Next main result',
  )
  window.document.getElementById('nextMain').click()
  press(window, 'n', { ctrlKey: true })
  await settle()

  assert.equal(window.document.getElementById('nextMain').textContent, 'Ctrl+N')
  assert.equal(browserApi.writes.length, 1)
  assert.match(window.document.getElementById('status').textContent, /Saved/)
  cleanup()
})

test('duplicates show an error and Escape cancels recording', async () => {
  const { window } = createDom(popupMarkup)
  const cleanup = await initializePopup({
    documentRef: window.document,
    browserApi: createBrowserApi(),
  })

  const previousButton = window.document.getElementById('prevMain')
  previousButton.click()
  press(window, 'j')

  assert.match(window.document.getElementById('status').textContent, /same shortcut/)
  assert.match(previousButton.textContent, /Press a key/)

  press(window, 'Escape')
  assert.equal(previousButton.textContent, 'K')
  assert.match(window.document.getElementById('status').textContent, /cancelled/)
  cleanup()
})

test('Enter cannot replace native result activation', async () => {
  const { window } = createDom(popupMarkup)
  const browserApi = createBrowserApi()
  const cleanup = await initializePopup({
    documentRef: window.document,
    browserApi,
  })

  window.document.getElementById('nextMain').click()
  press(window, 'Enter')

  assert.equal(browserApi.writes.length, 0)
  assert.match(window.document.getElementById('status').textContent, /Enter opens results/)
  cleanup()
})

test('reset restores and persists all defaults', async () => {
  const { window } = createDom(popupMarkup)
  const browserApi = createBrowserApi({
    stored: {
      nextMain: { key: 'n' },
      prevMain: { key: 'p' },
      nextDetailed: { key: 'n', shiftKey: true },
      prevDetailed: { key: 'p', shiftKey: true },
    },
  })
  const cleanup = await initializePopup({
    documentRef: window.document,
    browserApi,
  })

  assert.equal(window.document.getElementById('nextMain').textContent, 'N')
  window.document.getElementById('resetDefaults').click()
  await settle()

  assert.equal(window.document.getElementById('nextMain').textContent, 'J')
  assert.equal(browserApi.writes[0].shortcuts.prevMain.key, 'k')
  cleanup()
})

test('load and save failures leave the popup usable and explain the failure', async () => {
  const { window } = createDom(popupMarkup)
  const browserApi = createBrowserApi({
    getError: new Error('read failed'),
    setError: new Error('write failed'),
  })
  const cleanup = await initializePopup({
    documentRef: window.document,
    browserApi,
  })

  assert.equal(window.document.getElementById('nextMain').textContent, 'J')
  assert.match(window.document.getElementById('status').textContent, /using defaults/)

  window.document.getElementById('nextMain').click()
  press(window, 'n')
  await settle()
  assert.match(window.document.getElementById('status').textContent, /Could not save/)
  assert.equal(window.document.getElementById('nextMain').disabled, false)
  cleanup()
})
