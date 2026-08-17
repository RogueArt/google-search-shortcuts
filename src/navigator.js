import {
  getAllLinkGroups,
  getLinkTextNode,
} from './google-results.js'
import {
  createNavigationIndex,
  findOccurrenceByElement,
  getMovementTarget,
  resolveMovement,
} from './navigation-index.js'

export const HIGHLIGHT_CLASS = 'google-search-shortcuts-highlight'

function isEditableElement(element) {
  if (!element || element.nodeType !== 1) return false

  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) return true
  if (element.isContentEditable) return true

  return Boolean(element.closest(
    '[contenteditable=""], [contenteditable="true"], [role="textbox"], [role="combobox"]',
  ))
}

export function isEditing(documentRef, eventTarget = null) {
  return (
    isEditableElement(eventTarget)
    || isEditableElement(documentRef.activeElement)
  )
}

export class LinksNavigator {
  constructor({
    documentRef = document,
    windowRef = window,
    collectGroups = getAllLinkGroups,
  } = {}) {
    this.document = documentRef
    this.window = windowRef
    this.collectGroups = collectGroups
    this.highlightedLabel = null
    this.destroyed = false
    this.index = this.createCurrentIndex()
    this.cursor = null

    const firstResult = this.index.mainOrder[0] || null
    if (firstResult && this.canAutofocus()) {
      this.select(firstResult)
    } else if (!firstResult) {
      this.window.requestAnimationFrame(() => this.retryInitialFocus())
    }
  }

  canAutofocus() {
    const activeElement = this.document.activeElement
    return (
      !activeElement
      || activeElement === this.document.body
      || activeElement === this.document.documentElement
    )
  }

  retryInitialFocus() {
    if (this.destroyed) return

    const refreshed = this.createCurrentIndex()
    if (refreshed.mainOrder.length > 0) this.index = refreshed

    const firstResult = this.index.mainOrder[0] || null
    if (firstResult && this.canAutofocus()) this.select(firstResult)
  }

  createCurrentIndex() {
    return createNavigationIndex(this.collectGroups(this.document))
  }

  move(command) {
    const refreshedIndex = this.createCurrentIndex()
    const activeOccurrence = findOccurrenceByElement(
      refreshedIndex,
      this.document.activeElement,
      this.cursor,
    )

    if (activeOccurrence) {
      const activeChanged = (
        !this.cursor
        || activeOccurrence.element !== this.cursor.element
        || activeOccurrence.kind !== this.cursor.kind
      )
      const activeLabel = getLinkTextNode(activeOccurrence.element)
      const markerChanged = (
        activeLabel !== this.highlightedLabel
        || !activeLabel
        || !activeLabel.classList.contains(HIGHLIGHT_CLASS)
      )
      const target = getMovementTarget(refreshedIndex, activeOccurrence, command)
      this.index = refreshedIndex
      this.cursor = target || activeOccurrence
      if (target || activeChanged || markerChanged) this.select(this.cursor)
      return Boolean(target)
    }

    const previousCursor = this.cursor
    const movement = resolveMovement(
      this.index,
      this.cursor,
      refreshedIndex,
      command,
    )

    this.index = movement.index
    this.cursor = movement.cursor

    const cursorWasReplaced = (
      !movement.target
      && previousCursor
      && this.cursor
      && previousCursor.element !== this.cursor.element
    )

    if (movement.target || cursorWasReplaced) this.select(this.cursor)
    return Boolean(movement.target)
  }

  clearHighlight() {
    if (!this.highlightedLabel) return

    this.highlightedLabel.classList.remove(HIGHLIGHT_CLASS)
    this.highlightedLabel = null
  }

  select(occurrence) {
    if (!occurrence || !occurrence.element) return

    this.clearHighlight()
    this.cursor = occurrence

    if (this.index.mainOrder[0] === occurrence) {
      this.window.scrollTo(0, 0)
    }

    occurrence.element.focus()

    const label = getLinkTextNode(occurrence.element)
    if (!label) return

    label.classList.add(HIGHLIGHT_CLASS)
    this.highlightedLabel = label
  }

  destroy() {
    this.destroyed = true
    this.clearHighlight()
  }
}
