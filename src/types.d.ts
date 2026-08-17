export type ActionId =
  | 'nextMain'
  | 'prevMain'
  | 'nextDetailed'
  | 'prevDetailed'

export type NavigationScope = 'main' | 'detailed'
export type NavigationDelta = -1 | 1

export interface Shortcut {
  key: string
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
}

export type ShortcutMap = Record<ActionId, Shortcut>

export interface NavigationCommand {
  scope: NavigationScope
  delta: NavigationDelta
}

export interface ActionDescriptor {
  command: Readonly<NavigationCommand>
  defaultShortcut: Readonly<Shortcut>
}

export interface StorageArea {
  get(key: string): Promise<Record<string, unknown>>
  set(value: Record<string, unknown>): Promise<void>
}

export interface StorageChange {
  newValue?: unknown
  oldValue?: unknown
}

export type StorageChangeListener = (
  changes: Record<string, StorageChange>,
  areaName: string,
) => void

export interface ExtensionApi {
  storage: {
    local: StorageArea
    onChanged: {
      addListener(listener: StorageChangeListener): void
      removeListener(listener: StorageChangeListener): void
    }
  }
}

export interface LinkGroup {
  mainLink: HTMLAnchorElement
  subLinks: HTMLAnchorElement[]
}

export type OccurrenceKind = 'main' | 'detail'

export interface NavigationGroup {
  index: number
  mainElement: HTMLAnchorElement
  main: Occurrence
  details: Occurrence[]
}

export interface Occurrence {
  element: HTMLAnchorElement
  group: NavigationGroup
  kind: OccurrenceKind
  semanticKey: string
  semanticOrdinal: number
  semanticCount: number
}

export interface NavigationIndex {
  groups: NavigationGroup[]
  mainOrder: Occurrence[]
  detailedOrder: Occurrence[]
}
