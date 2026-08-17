import { createDefaultShortcuts } from './actions.js'
import { getExtensionApi } from './extension-api.js'
import { LinksNavigator, isEditing } from './navigator.js'
import {
  decodeShortcuts,
  findMatchingAction,
  getStoredShortcuts,
} from './shortcuts.js'

export async function initializeExtension({
  documentRef = document,
  windowRef = window,
  browserApi = getExtensionApi(),
  logger = console,
} = {}) {
  if (!browserApi) throw new Error('WebExtension APIs are unavailable.')

  const navigator = new LinksNavigator({ documentRef, windowRef })
  let shortcuts = createDefaultShortcuts()
  let shortcutRevision = 0

  const handleStorageChange = (changes, areaName) => {
    if (areaName && areaName !== 'local') return
    if (!changes.shortcuts) return

    shortcutRevision += 1
    shortcuts = decodeShortcuts(changes.shortcuts.newValue)
  }

  const handleKeydown = event => {
    if (event.isComposing || isEditing(documentRef, event.target)) return

    const match = findMatchingAction(event, shortcuts)
    if (!match) return

    event.preventDefault()
    navigator.move(match.command)
  }

  browserApi.storage.onChanged.addListener(handleStorageChange)
  documentRef.addEventListener('keydown', handleKeydown)

  try {
    const storedShortcuts = await getStoredShortcuts(browserApi.storage.local)
    if (shortcutRevision === 0) shortcuts = storedShortcuts
  } catch (error) {
    logger.warn('Google Search Shortcuts could not load saved shortcuts.', error)
  }

  return () => {
    browserApi.storage.onChanged.removeListener(handleStorageChange)
    documentRef.removeEventListener('keydown', handleKeydown)
    navigator.destroy()
  }
}

export function startWhenDocumentIsReady(options = {}) {
  const documentRef = options.documentRef || document

  if (documentRef.readyState !== 'loading') {
    return initializeExtension(options)
  }

  return new Promise(resolve => {
    const handleDomReady = () => {
      documentRef.removeEventListener('DOMContentLoaded', handleDomReady)
      resolve(initializeExtension(options))
    }

    documentRef.addEventListener('DOMContentLoaded', handleDomReady)
  })
}

if (typeof document !== 'undefined') {
  const browserApi = getExtensionApi()
  if (browserApi) startWhenDocumentIsReady({ browserApi })
}
