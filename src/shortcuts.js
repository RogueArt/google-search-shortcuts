import {
  ACTION_IDS,
  ACTIONS,
  createDefaultShortcuts,
} from './actions.js'

/** @typedef {import('./types.js').ActionId} ActionId */
/** @typedef {import('./types.js').Shortcut} Shortcut */
/** @typedef {import('./types.js').ShortcutMap} ShortcutMap */
/** @typedef {import('./types.js').StorageArea} StorageArea */

const MODIFIER_KEYS = new Set(['shift', 'control', 'ctrl', 'alt', 'meta'])
const RESERVED_KEYS = new Set(['enter', 'escape'])
const KEY_LABELS = {
  ' ': 'Space',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  arrowup: 'ArrowUp',
  backspace: 'Backspace',
  delete: 'Delete',
  end: 'End',
  home: 'Home',
  pagedown: 'PageDown',
  pageup: 'PageUp',
  tab: 'Tab',
}

/** @param {string} key */
export function isModifierOnlyKey(key) {
  return typeof key === 'string' && MODIFIER_KEYS.has(key.toLowerCase())
}

/**
 * @param {Partial<Shortcut> | null | undefined} shortcut
 * @returns {Shortcut | null}
 */
export function normalizeShortcut(shortcut) {
  if (!shortcut || typeof shortcut.key !== 'string') return null

  const key = shortcut.key.toLowerCase()
  if (key.length === 0 || isModifierOnlyKey(key)) return null

  return {
    key,
    shiftKey: Boolean(shortcut.shiftKey),
    ctrlKey: Boolean(shortcut.ctrlKey),
    altKey: Boolean(shortcut.altKey),
    metaKey: Boolean(shortcut.metaKey),
  }
}

/** @param {Partial<Shortcut> | null | undefined} shortcut */
export function formatShortcut(shortcut) {
  const normalized = normalizeShortcut(shortcut)
  if (!normalized) return 'Not set'

  const parts = []
  if (normalized.ctrlKey) parts.push('Ctrl')
  if (normalized.altKey) parts.push('Alt')
  if (normalized.shiftKey) parts.push('Shift')
  if (normalized.metaKey) parts.push('Meta')

  const keyLabel = KEY_LABELS[normalized.key]
    || (normalized.key.length === 1
      ? normalized.key.toUpperCase()
      : normalized.key)
  parts.push(keyLabel)

  return parts.join('+')
}

/** @param {Partial<Shortcut> | null | undefined} shortcut */
export function shortcutToId(shortcut) {
  const normalized = normalizeShortcut(shortcut)
  if (!normalized) return null

  return [
    normalized.ctrlKey ? '1' : '0',
    normalized.altKey ? '1' : '0',
    normalized.shiftKey ? '1' : '0',
    normalized.metaKey ? '1' : '0',
    normalized.key,
  ].join(':')
}

/** @param {KeyboardEvent} event */
export function eventToShortcut(event) {
  if (!event || event.isComposing || isModifierOnlyKey(event.key)) return null

  return normalizeShortcut({
    key: event.key,
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
  })
}

/**
 * @param {KeyboardEvent} event
 * @param {Shortcut} shortcut
 */
export function matchesShortcut(event, shortcut) {
  const normalized = normalizeShortcut(shortcut)
  if (!event || !normalized || typeof event.key !== 'string') return false

  return (
    event.key.toLowerCase() === normalized.key
    && Boolean(event.shiftKey) === normalized.shiftKey
    && Boolean(event.ctrlKey) === normalized.ctrlKey
    && Boolean(event.altKey) === normalized.altKey
    && Boolean(event.metaKey) === normalized.metaKey
  )
}

/**
 * @param {KeyboardEvent} event
 * @param {ShortcutMap} shortcuts
 */
export function findMatchingAction(event, shortcuts) {
  for (const actionId of ACTION_IDS) {
    if (matchesShortcut(event, shortcuts[actionId])) {
      return {
        actionId,
        command: ACTIONS[actionId].command,
      }
    }
  }

  return null
}

/** @param {Partial<ShortcutMap> | null | undefined} shortcuts */
export function validateShortcuts(shortcuts) {
  const seen = new Set()

  for (const actionId of ACTION_IDS) {
    const shortcut = normalizeShortcut(shortcuts && shortcuts[actionId])
    if (!shortcut) {
      return {
        isValid: false,
        message: 'Each shortcut must include at least one non-modifier key.',
      }
    }

    if (RESERVED_KEYS.has(shortcut.key)) {
      return {
        isValid: false,
        message: 'Enter opens results and Escape cancels recording; choose another key.',
      }
    }

    const id = shortcutToId(shortcut)
    if (seen.has(id)) {
      return {
        isValid: false,
        message: 'Two actions cannot use the same shortcut.',
      }
    }

    seen.add(id)
  }

  return { isValid: true, message: '' }
}

/**
 * @param {unknown} value
 * @returns {ShortcutMap}
 */
export function decodeShortcuts(value) {
  const candidate = createDefaultShortcuts()

  if (value && typeof value === 'object') {
    for (const actionId of ACTION_IDS) {
      const stored = normalizeShortcut(value[actionId])
      if (stored) candidate[actionId] = stored
    }
  }

  return validateShortcuts(candidate).isValid
    ? candidate
    : createDefaultShortcuts()
}

/** @param {StorageArea} storageArea */
export async function getStoredShortcuts(storageArea) {
  if (!storageArea) throw new Error('Extension storage is unavailable.')

  const result = await storageArea.get('shortcuts')
  return decodeShortcuts(result && result.shortcuts)
}

/**
 * @param {ShortcutMap} shortcuts
 * @param {StorageArea} storageArea
 */
export async function saveShortcuts(shortcuts, storageArea) {
  if (!storageArea) throw new Error('Extension storage is unavailable.')

  const validation = validateShortcuts(shortcuts)
  if (!validation.isValid) throw new Error(validation.message)

  await storageArea.set({ shortcuts })
}
