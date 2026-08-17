/** @typedef {import('./types.js').ActionDescriptor} ActionDescriptor */
/** @typedef {import('./types.js').ActionId} ActionId */
/** @typedef {import('./types.js').Shortcut} Shortcut */
/** @typedef {import('./types.js').ShortcutMap} ShortcutMap */

/**
 * @param {string} key
 * @param {boolean} [shiftKey]
 * @returns {Readonly<Shortcut>}
 */
const shortcut = (key, shiftKey = false) => Object.freeze({
  key,
  shiftKey,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
})

/** @type {Readonly<Record<ActionId, Readonly<ActionDescriptor>>>} */
export const ACTIONS = Object.freeze({
  nextMain: Object.freeze({
    command: Object.freeze({ scope: 'main', delta: 1 }),
    defaultShortcut: shortcut('j'),
  }),
  prevMain: Object.freeze({
    command: Object.freeze({ scope: 'main', delta: -1 }),
    defaultShortcut: shortcut('k'),
  }),
  nextDetailed: Object.freeze({
    command: Object.freeze({ scope: 'detailed', delta: 1 }),
    defaultShortcut: shortcut('j', true),
  }),
  prevDetailed: Object.freeze({
    command: Object.freeze({ scope: 'detailed', delta: -1 }),
    defaultShortcut: shortcut('k', true),
  }),
})

/** @type {Readonly<ActionId[]>} */
export const ACTION_IDS = Object.freeze(
  /** @type {ActionId[]} */ (Object.keys(ACTIONS)),
)

/** @returns {ShortcutMap} */
export function createDefaultShortcuts() {
  /** @type {Partial<ShortcutMap>} */
  const defaults = {}

  for (const actionId of ACTION_IDS) {
    defaults[actionId] = { ...ACTIONS[actionId].defaultShortcut }
  }

  return /** @type {ShortcutMap} */ (defaults)
}
