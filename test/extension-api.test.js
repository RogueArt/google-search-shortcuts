import assert from 'node:assert/strict'
import test from 'node:test'

import { getExtensionApi } from '../src/extension-api.js'

function createApi(name) {
  return {
    name,
    storage: {
      local: {},
      onChanged: {},
    },
  }
}

test('Firefox browser API is preferred when both namespaces exist', () => {
  const browser = createApi('firefox')
  const chrome = createApi('chromium')

  assert.equal(getExtensionApi({ browser, chrome }), browser)
})

test('Chromium chrome API is used when browser is absent', () => {
  const chrome = createApi('chromium')

  assert.equal(getExtensionApi({ chrome }), chrome)
})

test('missing or incomplete extension APIs are rejected', () => {
  assert.equal(getExtensionApi({}), null)
  assert.equal(getExtensionApi({ chrome: { storage: { local: {} } } }), null)
})
