import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

const settle = () => new Promise(resolve => setTimeout(resolve, 0))

function createExtensionApi() {
  const listeners = new Set()
  const writes = []

  return {
    storage: {
      local: {
        async get() { return {} },
        async set(value) { writes.push(value) },
      },
      onChanged: {
        addListener(listener) { listeners.add(listener) },
        removeListener(listener) { listeners.delete(listener) },
      },
    },
    writes,
  }
}

function setRect(element, { top, left = 20, width = 300, height = 30 }) {
  const value = {
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
  element.getBoundingClientRect = () => value
  element.getClientRects = () => [value]
}

async function smokePopup(target, namespace) {
  const html = await readFile(`dist/${target}/popup.html`, 'utf8')
  const bundle = await readFile(`dist/${target}/popup.js`, 'utf8')
  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    runScripts: 'outside-only',
    url: `https://${target}.extension.test/popup.html`,
  })
  const api = createExtensionApi()
  dom.window[namespace] = api
  dom.window.eval(bundle)
  await settle()

  const nextButton = dom.window.document.getElementById('nextMain')
  assert.equal(nextButton.textContent, 'J')
  nextButton.click()
  dom.window.document.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
    key: 'n',
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  }))
  await settle()

  assert.equal(nextButton.textContent, 'Ctrl+N')
  assert.equal(api.writes.length, 1)
  dom.window.close()
}

async function smokeContentScript(target, namespace) {
  const bundle = await readFile(`dist/${target}/script.js`, 'utf8')
  const dom = new JSDOM(`<!doctype html><html><body>
    <main id="rso">
      <article><a id="A" href="https://example.com/A"><h3>A</h3></a></article>
      <article><a id="B" href="https://example.com/B"><h3>B</h3></a></article>
    </main>
  </body></html>`, {
    pretendToBeVisual: true,
    runScripts: 'outside-only',
    url: 'https://www.google.com/search?q=extension-smoke-test',
  })
  const { window } = dom
  setRect(window.document.getElementById('A'), { top: 100 })
  setRect(window.document.getElementById('B'), { top: 300 })
  window.requestAnimationFrame = callback => {
    callback()
    return 1
  }
  window.scrollTo = () => {}
  Object.defineProperty(window.document, 'readyState', { value: 'complete' })
  window[namespace] = createExtensionApi()
  window.eval(bundle)
  await settle()

  assert.equal(window.document.activeElement.id, 'A')
  window.document.activeElement.dispatchEvent(new window.KeyboardEvent('keydown', {
    key: 'j',
    bubbles: true,
    cancelable: true,
  }))
  assert.equal(window.document.activeElement.id, 'B')
  dom.window.close()
}

await smokePopup('firefox', 'browser')
await smokeContentScript('firefox', 'browser')
await smokePopup('chromium', 'chrome')
await smokeContentScript('chromium', 'chrome')

console.log('Executed both built bundles through Firefox and Chromium API namespaces.')
