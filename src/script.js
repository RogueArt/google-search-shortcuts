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

  try {
    shortcuts = await getStoredShortcuts(browserApi.storage.local)
  } catch (error) {
    logger.warn('Google Search Shortcuts could not load saved shortcuts.', error)
  }

  const handleStorageChange = (changes, areaName) => {
    if (areaName && areaName !== 'local') return
    if (!changes.shortcuts) return

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

  return () => {
    browserApi.storage.onChanged.removeListener(handleStorageChange)
    documentRef.removeEventListener('keydown', handleKeydown)
    navigator.destroy()
  }
}

export function startWhenDocumentIsComplete(options = {}) {
  const documentRef = options.documentRef || document

  if (documentRef.readyState === 'complete') {
    return initializeExtension(options)
  }

  return new Promise(resolve => {
    const handleReadyStateChange = () => {
      if (documentRef.readyState !== 'complete') return

      documentRef.removeEventListener('readystatechange', handleReadyStateChange)
      resolve(initializeExtension(options))
    }

    documentRef.addEventListener('readystatechange', handleReadyStateChange)
  })
}

if (typeof document !== 'undefined') {
  const browserApi = getExtensionApi()
  if (browserApi) startWhenDocumentIsComplete({ browserApi })
}
