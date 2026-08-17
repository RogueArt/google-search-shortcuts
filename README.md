# Google Search Shortcuts

Google Search Shortcuts is a Firefox, Chrome, and Microsoft Edge extension for
navigating Google results without leaving the keyboard.

[Install the published Firefox extension](https://addons.mozilla.org/en-US/firefox/addon/google-search-shortcuts/)

## Shortcuts

On a `google.com/search` results page, click away from editable controls before
using a shortcut.

| Shortcut | Action |
| --- | --- |
| `j` | Next main result |
| `k` | Previous main result |
| `Shift+j` | Next result or sublink |
| `Shift+k` | Previous result or sublink |
| `Enter` | Open the focused result in the current tab |
| `Shift+Enter` | Open the focused result in a new window |
| `Ctrl+Enter` | Open the focused result in a background tab |

The four movement shortcuts can be changed from the extension toolbar popup.
They are disabled while an input, textarea, select, content-editable control,
textbox, or combobox has focus. Navigation does not wrap at the first or last
result.

The Enter combinations are each browser's native behavior for a focused link.
The extension deliberately gives the actual result anchor focus so those
behaviors remain available.

## Browser packages

One runtime is packaged with two manifests:

- Firefox remains on Manifest V2 to preserve compatibility with the published
  add-on. Mozilla continues to support MV2, and this extension does not use a
  background page, request interception, or another feature that would benefit
  from a Firefox MV3 conversion.
- Chrome and Edge use the same Chromium Manifest V3 package. Modern Chrome no
  longer runs MV2 extensions.

The source selects Firefox's `browser` API or Chromium's `chrome` API at one
small platform boundary. All navigation, popup, styling, and storage behavior
is otherwise shared.

## Development

Node.js 22.13 or newer is required.

```bash
npm install
npm run check
```

Useful individual commands:

```bash
npm run typecheck
npm test
npm run test:coverage
npm run build:firefox
npm run build:chromium
npm run build-for-amo
```

`npm run build` produces:

- `dist/firefox/` and `dist/packages/google-search-shortcuts-firefox.zip`
- `dist/chromium/` and `dist/packages/google-search-shortcuts-chromium.zip`

Load `dist/firefox/manifest.json` from Firefox's
`about:debugging#/runtime/this-firefox` page. Load `dist/chromium/` with
Developer mode's **Load unpacked** action in `chrome://extensions` or
`edge://extensions`.

The production source remains JavaScript for this compatibility release, but
TypeScript checks it through `checkJs` and the contracts in `src/types.d.ts`.
This adds static checks without changing the extension runtime or requiring a
TypeScript test loader. A later mechanical `.js` to `.ts` conversion can use the
same contracts after the cross-browser release has settled.

See [docs/testing.md](docs/testing.md) for the coverage breakdown, artifact
smokes, and remaining browser-testing limits.

## Current scope

- Search pages on `google.com` are supported. Other Google country domains are
  not yet included.
- Live Google markup changes frequently. Automated tests use stable DOM
  fixtures, and releases should also receive hands-on Firefox and Chromium
  smoke tests.
- The Firefox and Chromium packages intentionally differ only in manifest
  metadata. Build verification enforces byte-identical shared assets.
