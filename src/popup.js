import {
  ACTION_IDS,
  createDefaultShortcuts,
} from './actions.js'
import { getExtensionApi } from './extension-api.js'
import {
  eventToShortcut,
  formatShortcut,
  getStoredShortcuts,
  saveShortcuts,
  validateShortcuts,
} from './shortcuts.js'

const ACTION_LABELS = {
  nextMain: 'Next main result',
  prevMain: 'Previous main result',
  nextDetailed: 'Next detailed result',
  prevDetailed: 'Previous detailed result',
}

export async function initializePopup({
  documentRef = document,
  browserApi = getExtensionApi(),
} = {}) {
  if (!browserApi) throw new Error('WebExtension APIs are unavailable.')

  const buttons = {}
  const clickHandlers = {}
  const status = documentRef.getElementById('status')
  const resetButton = /** @type {HTMLButtonElement} */ (
    documentRef.getElementById('resetDefaults')
  )
  let shortcuts = createDefaultShortcuts()
  let recordingAction = null
  let savePending = false

  for (const actionId of ACTION_IDS) {
    buttons[actionId] = documentRef.getElementById(actionId)
  }

  function setStatus(message, isError = false) {
    status.textContent = message
    status.classList.toggle('error', isError)
  }

  function render() {
    for (const actionId of ACTION_IDS) {
      const button = buttons[actionId]
      button.textContent = recordingAction === actionId
        ? 'Press a key combination...'
        : formatShortcut(shortcuts[actionId])
      button.classList.toggle('recording', recordingAction === actionId)
      button.disabled = savePending
      button.setAttribute(
        'aria-pressed',
        recordingAction === actionId ? 'true' : 'false',
      )
    }

    resetButton.disabled = savePending
  }

  function stopRecording() {
    recordingAction = null
    render()
  }

  function startRecording(actionId) {
    if (savePending) return

    recordingAction = actionId
    render()
    setStatus(
      `Recording shortcut for ${ACTION_LABELS[actionId]}. Press Escape to cancel.`,
    )
  }

  async function resetDefaults() {
    if (savePending) return

    const previous = shortcuts
    shortcuts = createDefaultShortcuts()
    recordingAction = null
    savePending = true
    render()

    try {
      await saveShortcuts(shortcuts, browserApi.storage.local)
      setStatus('Reset to defaults.')
    } catch (error) {
      shortcuts = previous
      setStatus(`Could not reset shortcuts: ${error.message}`, true)
    } finally {
      savePending = false
      render()
    }
  }

  async function handleRecordingKeydown(event) {
    if (!recordingAction || savePending) return

    event.preventDefault()
    event.stopPropagation()

    if (event.key === 'Escape') {
      stopRecording()
      setStatus('Shortcut recording cancelled.')
      return
    }

    const shortcut = eventToShortcut(event)
    if (!shortcut) return

    const actionId = recordingAction
    const nextShortcuts = {
      ...shortcuts,
      [actionId]: shortcut,
    }
    const validation = validateShortcuts(nextShortcuts)

    if (!validation.isValid) {
      setStatus(validation.message, true)
      return
    }

    const previous = shortcuts
    shortcuts = nextShortcuts
    recordingAction = null
    savePending = true
    render()

    try {
      await saveShortcuts(shortcuts, browserApi.storage.local)
      setStatus(
        `Saved ${ACTION_LABELS[actionId]} as ${formatShortcut(shortcut)}.`,
      )
    } catch (error) {
      shortcuts = previous
      recordingAction = actionId
      setStatus(`Could not save shortcut: ${error.message}`, true)
    } finally {
      savePending = false
      render()
    }
  }

  try {
    shortcuts = await getStoredShortcuts(browserApi.storage.local)
  } catch (error) {
    setStatus('Saved shortcuts could not be loaded; using defaults.', true)
  }

  render()

  for (const actionId of ACTION_IDS) {
    clickHandlers[actionId] = () => startRecording(actionId)
    buttons[actionId].addEventListener('click', clickHandlers[actionId])
  }

  resetButton.addEventListener('click', resetDefaults)
  documentRef.addEventListener('keydown', handleRecordingKeydown)

  return () => {
    for (const actionId of ACTION_IDS) {
      buttons[actionId].removeEventListener('click', clickHandlers[actionId])
    }

    resetButton.removeEventListener('click', resetDefaults)
    documentRef.removeEventListener('keydown', handleRecordingKeydown)
  }
}

if (typeof document !== 'undefined') {
  const browserApi = getExtensionApi()
  if (browserApi) initializePopup({ browserApi })
}
