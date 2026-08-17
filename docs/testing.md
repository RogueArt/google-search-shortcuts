# Testing and coverage

The suite contains 57 source-level tests plus four built-bundle smoke scenarios.
`npm run test:coverage` enforces at least 95% line coverage, 95% function
coverage, and 80% branch coverage across `src/*.js`.
The current measured result is 97.80% lines, 84.29% branches, and 100% functions.

## What the 57 tests cover

### Browser API selection — 3 tests

- Prefer Firefox's `browser` namespace when it is present.
- Fall back to Chromium's `chrome` namespace.
- Reject absent or incomplete extension APIs instead of silently half-starting.

### Google result discovery — 11 tests

- Visual top-to-bottom and left-to-right order rather than raw DOM order.
- Stable row buckets and DOM-order tie breaking.
- Overlapping main-result and detailed-link de-duplication.
- Detailed-link ownership when several main results share a container.
- Exclusion of clipped, hidden, transparent, `aria-hidden`, noisy, timestamp,
  answer-count, and `Read more` links.
- Results below the viewport remain eligible.
- Links outside `#rso`, links without layout, and children of collapsed
  overflow containers are ignored.

### Navigation state machine — 12 tests

- Main and detailed forward/backward sequences and no-wrap boundaries.
- Movement from a detailed link to its current or next main result.
- Recovery after the focused main or detailed link is deleted.
- Recovery when results appear after an initially empty scan.
- Stable semantic identity across DOM replacement and insertion.
- Conservative behavior for duplicate results, href mutation, and boundary
  replacement.

### DOM navigator — 10 tests

- Immediate initial focus, marker placement, and scroll position.
- Preservation of user focus both before initialization and while a delayed
  result scan is pending.
- Marker cleanup without changing Google's inline styles.
- Empty-result and deleted-result recovery.
- Synchronization when the user focuses a result outside the extension.
- Boundary marker repair after Google replaces a heading.
- Editable, contenteditable, textbox, and combobox classification.

### Popup — 5 tests

- The real `src/popup.html` renders default shortcuts.
- Recording and persisting a custom shortcut.
- Duplicate rejection, Escape cancellation, and Enter reservation.
- Resetting and persisting defaults.
- Storage read/write failure recovery while keeping the popup usable.

### Content-script controller — 11 tests

- Shortcut dispatch, default prevention, listener registration, and cleanup.
- Suppression inside inputs and contenteditable controls.
- Search-box focus and native Space behavior during initialization.
- Default-shortcut availability while saved settings are still loading.
- Live local-storage shortcut updates and irrelevant/sync-change filtering.
- Shift+J/Shift+K detailed traversal through an actual DOM fixture.
- Default operation after a storage read failure.
- Native Enter variants remain untouched.
- Both DOMContentLoaded and already-interactive startup paths initialize once.

### Shortcut rules — 5 tests

- Exact modifier matching and action routing.
- Modifier-only and composition-event suppression.
- Human-readable key labels.
- Duplicate and native-activation-key validation.
- Safe fallback from malformed or conflicting stored settings.

## Built-artifact verification

`npm run verify-build` verifies both generated manifests, their complete file
allowlists, the published Firefox ID and no-data declaration, the Chromium MV3
contract, byte-identical shared assets, safe ZIP paths, and byte parity between
each ZIP and unpacked build.

`npm run smoke-build` then executes the actual bundled popup and content script
through both API namespaces:

- Firefox bundle with `browser.storage`
- Firefox content script with `browser.storage`
- Chromium bundle with `chrome.storage`
- Chromium content script with `chrome.storage`

## What coverage does not prove

jsdom does not reproduce every Google layout, browser hit-test, or trusted link
activation behavior. The suite cannot by itself guarantee that Google has not
introduced a new result-card experiment, or prove the browser-native outcomes
of Enter, Ctrl+Enter, and Shift+Enter. Those require release smoke tests in real
Firefox and Chromium browsers on live Google results.
