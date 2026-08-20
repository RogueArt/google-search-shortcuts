<div align="center">

<img src="./src/icons/icon-128.png" alt="Google Search Shortcuts icon" width="96" height="96">

<h1>Google Search Shortcuts</h1>

<p><strong>Move through Google Search results without leaving the keyboard.</strong></p>

<p>
  <a href="https://addons.mozilla.org/firefox/addon/google-search-shortcuts/"><img alt="Install for Firefox" src="https://img.shields.io/badge/Firefox-Install-FF7139?logo=firefoxbrowser&amp;logoColor=white"></a>
  <a href="https://chromewebstore.google.com/detail/google-search-shortcuts/CHROME_EXTENSION_ID"><img alt="Chrome publishing soon" src="https://img.shields.io/badge/Chrome-Publishing_soon-4285F4?logo=googlechrome&amp;logoColor=white"></a>
  <a href="https://microsoftedge.microsoft.com/addons/detail/google-search-shortcuts/EDGE_EXTENSION_ID"><img alt="Edge publishing soon" src="https://img.shields.io/badge/Edge-Publishing_soon-0078D7?logo=microsoftedge&amp;logoColor=white"></a>
  <a href="./package.json"><img alt="Next release 2.1.0" src="https://img.shields.io/badge/next_release-2.1.0-0969DA"></a>
  <a href="./LICENSE"><img alt="License: MPL-2.0" src="https://img.shields.io/badge/license-MPL--2.0-8A2BE2"></a>
</p>

</div>

Google Search Shortcuts is a small, privacy-friendly browser extension that
adds fast keyboard navigation to Google results. It focuses the real result
links, so normal browser actions such as Enter, Ctrl+Enter, and Shift+Enter
continue to work.

> [!NOTE]
> Chrome and Edge publishing is in progress. Their links below intentionally
> contain placeholder extension IDs and can be replaced as soon as the store
> listings are created.

## Install

| Browser | Status | Link |
| --- | --- | --- |
| Firefox | Available | [Get it from Firefox Add-ons][firefox-store] |
| Chrome | Publishing in progress | [Chrome Web Store placeholder][chrome-store] |
| Microsoft Edge | Publishing in progress | [Edge Add-ons placeholder][edge-store] |

Want to try the unreleased build? See [Install a development build](#install-a-development-build).

## Quick start

1. Run any search on `google.com`.
2. Press <kbd>J</kbd> or <kbd>K</kbd> to move through the main results.
3. Press <kbd>Shift</kbd> with <kbd>J</kbd> or <kbd>K</kbd> to include
   sublinks and other detailed results.
4. Press <kbd>Enter</kbd> to open the focused link.

The focused result receives a subtle underline. Navigation stops at the first
and last result instead of wrapping around.

## Shortcuts

| Shortcut | Action |
| --- | --- |
| <kbd>J</kbd> | Next main result |
| <kbd>K</kbd> | Previous main result |
| <kbd>Shift</kbd> + <kbd>J</kbd> | Next result or sublink |
| <kbd>Shift</kbd> + <kbd>K</kbd> | Previous result or sublink |
| <kbd>Enter</kbd> | Open the focused result in the current tab |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | Open the focused result in a background tab |
| <kbd>Shift</kbd> + <kbd>Enter</kbd> | Open the focused result in a new window |

Movement shortcuts are ignored while an input, textarea, select,
content-editable control, textbox, or combobox has focus. You can start typing
in Google's search box immediately—the extension will not take focus away.

## Customize the shortcuts

Open Google Search Shortcuts from the browser toolbar to record replacements
for any of the four movement shortcuts.

- Modifier combinations are supported.
- Duplicate shortcuts are rejected.
- Enter remains reserved for opening the focused link.
- **Reset to defaults** restores J, K, Shift+J, and Shift+K.
- Preferences stay in the browser's local extension storage.

## Highlights

- **Keyboard-first navigation** — move through main results or every detailed
  link without reaching for the mouse.
- **Native link behavior** — the extension focuses Google's actual anchors
  instead of simulating clicks.
- **Safe around typing** — editable controls keep focus and receive their
  keystrokes normally.
- **Resilient to live updates** — navigation recovers when Google inserts,
  removes, or replaces result elements.
- **Visual-order discovery** — results follow their rendered top-to-bottom and
  left-to-right order rather than unreliable DOM order.
- **Cross-browser packages** — one runtime produces Firefox Manifest V2 and
  Chrome/Edge Manifest V3 builds.
- **No tracking** — no analytics, external requests, accounts, or remote code.

## Privacy and permissions

Google Search Shortcuts processes the rendered Google results page locally so
it can identify and focus result links. It does not collect or transmit search
queries, page content, browsing history, URLs, or personal information.

The extension requests only:

- access to Google Search result pages, where its content script runs; and
- `storage`, used exclusively for locally saved shortcut preferences.

There are no analytics, advertisements, remote services, or remotely executed
scripts.

## Browser support

| Browser | Package | Notes |
| --- | --- | --- |
| Firefox | Manifest V2 | Preserves the ID of the published Firefox add-on |
| Google Chrome 95+ | Manifest V3 | Chrome Web Store release in progress |
| Microsoft Edge | Manifest V3 | Uses the same Chromium package as Chrome |

Firefox remains on Manifest V2 because Mozilla continues to support it and this
extension does not need a background worker, request interception, or another
feature that would benefit from a Firefox Manifest V3 conversion.

Current scope includes standard and Basic Variant (`gbv=1`) Search pages on
`google.com`. Other Google country domains are not yet included.

## Development

### Requirements

- Node.js 22.13 or newer
- npm

### Set up the project

```bash
git clone https://github.com/rajpiskala/google-search-shortcuts.git
cd google-search-shortcuts
npm ci
npm run check
```

`npm run check` runs static type analysis, all tests with enforced coverage,
both production builds, package verification, and built-bundle smoke tests.

### Useful commands

| Command | Purpose |
| --- | --- |
| `npm test` | Run the source test suite |
| `npm run test:coverage` | Run tests and enforce coverage thresholds |
| `npm run typecheck` | Check JavaScript through TypeScript's `checkJs` |
| `npm run build` | Build Firefox and Chromium packages |
| `npm run build:firefox` | Build only Firefox |
| `npm run build:chromium` | Build only Chrome/Edge |
| `npm run build-for-amo` | Build and verify the Firefox and AMO source packages |
| `npm run package:source` | Recreate only the versioned AMO source ZIP |
| `npm run verify-build` | Verify manifests, file allowlists, and ZIP parity |
| `npm run smoke-build` | Execute both bundled extensions against browser API mocks |

### Build outputs

| Target | Unpacked extension | Store package |
| --- | --- | --- |
| Firefox | `dist/firefox/` | `dist/packages/google-search-shortcuts-firefox.zip` |
| Chrome / Edge | `dist/chromium/` | `dist/packages/google-search-shortcuts-chromium.zip` |
| AMO reviewer source | — | `dist/packages/google-search-shortcuts-2.1.0-source.zip` |

The shared JavaScript, CSS, and HTML are verified byte-for-byte across the two
browser packages. Only browser-specific manifest metadata differs.

### Prepare a Firefox Add-ons submission

Run the dedicated AMO release command from a clean checkout:

```bash
npm ci
npm run build-for-amo
```

Upload `google-search-shortcuts-firefox.zip` as the add-on and
`google-search-shortcuts-2.1.0-source.zip` as its source code. Both are written
to `dist/packages/`. The source ZIP contains only original project files from
an explicit allowlist—no `node_modules`, `dist`, bundled JavaScript, or other
machine-generated source—and the verifier checks every archived byte.

See [docs/amo-source-submission.md](docs/amo-source-submission.md) for the exact
cross-platform environment and reviewer build instructions included in the
source archive.

## Install a development build

Build the project first:

```bash
npm ci
npm run build
```

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Select **Load Temporary Add-on**.
3. Choose `dist/firefox/manifest.json`.

Temporary add-ons are removed when Firefox restarts.

### Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose `dist/chromium/`.

### Microsoft Edge

1. Open `edge://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose `dist/chromium/`.

Disable any store-installed copy before testing an unpacked build so that two
content scripts do not run on the same results page.

## Project structure

| Area | Responsibility |
| --- | --- |
| `src/google-results.js` | Discover and visually order actionable Google links |
| `src/navigation-index.js` | Resolve movement and recover across DOM replacement |
| `src/navigator.js` | Coordinate focus, scrolling, and the visual marker |
| `src/shortcuts.js` | Validate, format, persist, and match shortcut settings |
| `src/script.js` | Initialize the content script and connect browser events |
| `src/popup.js` | Record and reset shortcuts in the toolbar popup |
| `webpack.config.cjs` | Generate Firefox MV2 and Chromium MV3 packages |

The runtime remains JavaScript for direct browser compatibility. TypeScript
checks the source through `checkJs` and the contracts in
`src/types.d.ts`, without adding a TypeScript runtime or test loader.

## Quality

The suite currently contains 57 source tests plus built-artifact smoke
scenarios. It covers result discovery, visibility filtering, navigation and
mutation recovery, editable-focus protection, shortcut customization, storage
failures, browser API selection, both startup paths, and both generated
packages.

See [docs/testing.md](docs/testing.md) for the detailed coverage breakdown,
artifact guarantees, and browser-testing limits.

## Contributing

Bug reports and focused pull requests are welcome.

When reporting a Google layout problem, please include:

- the affected Search URL or result type;
- Firefox, Chrome, or Edge and its version;
- the expected and actual shortcut behavior; and
- a screenshot or minimal HTML fixture when possible.

Before opening a pull request, run:

```bash
npm run check
```

[Open an issue](https://github.com/rajpiskala/google-search-shortcuts/issues/new)
or browse the [existing issues](https://github.com/rajpiskala/google-search-shortcuts/issues).

## License

Google Search Shortcuts is available under the
[Mozilla Public License 2.0](LICENSE). The complete license is also included in
each Firefox, Chrome, and Edge build package.

---

Google Search Shortcuts is an independent project and is not affiliated with or
endorsed by Google.

[firefox-store]: https://addons.mozilla.org/firefox/addon/google-search-shortcuts/
[chrome-store]: https://chromewebstore.google.com/detail/google-search-shortcuts/CHROME_EXTENSION_ID
[edge-store]: https://microsoftedge.microsoft.com/addons/detail/google-search-shortcuts/EDGE_EXTENSION_ID
