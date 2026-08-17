import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createDefaultShortcuts,
} from '../src/actions.js'
import {
  decodeShortcuts,
  eventToShortcut,
  findMatchingAction,
  formatShortcut,
  matchesShortcut,
  validateShortcuts,
} from '../src/shortcuts.js'

function keyEvent(key, modifiers = {}) {
  return {
    key,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    ...modifiers,
  }
}

test('default shortcuts use exact modifier matching', () => {
  const shortcuts = createDefaultShortcuts()

  assert.equal(matchesShortcut(keyEvent('J'), shortcuts.nextMain), true)
  assert.equal(matchesShortcut(keyEvent('J', { shiftKey: true }), shortcuts.nextMain), false)
  assert.equal(findMatchingAction(
    keyEvent('J', { shiftKey: true }),
    shortcuts,
  ).actionId, 'nextDetailed')
})

test('modifier-only and composition events are ignored', () => {
  assert.equal(eventToShortcut(keyEvent('Shift')), null)
  assert.equal(eventToShortcut(keyEvent('j', { isComposing: true })), null)
})

test('formatting gives Space and named keys readable labels', () => {
  assert.equal(formatShortcut(keyEvent(' ', { ctrlKey: true })), 'Ctrl+Space')
  assert.equal(formatShortcut(keyEvent('ArrowDown')), 'ArrowDown')
})

test('duplicates and native activation keys are rejected', () => {
  const duplicates = createDefaultShortcuts()
  duplicates.prevMain = { ...duplicates.nextMain }
  assert.equal(validateShortcuts(duplicates).isValid, false)

  const enter = createDefaultShortcuts()
  enter.nextMain = keyEvent('Enter')
  assert.match(validateShortcuts(enter).message, /Enter opens results/)
})

test('malformed or conflicting storage falls back safely to defaults', () => {
  const malformed = decodeShortcuts({ nextMain: null })
  assert.equal(malformed.nextMain.key, 'j')

  const conflicting = createDefaultShortcuts()
  conflicting.prevMain = { ...conflicting.nextMain }
  const decoded = decodeShortcuts(conflicting)
  assert.equal(decoded.prevMain.key, 'k')
})
